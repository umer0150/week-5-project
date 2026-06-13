import Groq from "groq-sdk";
import { db } from "../db";
import { faqs, tickets, conversations } from "../db/schema";
import { eq, ilike, or, and } from "drizzle-orm";
import type { ChatMessage, EscalationResult } from "../types";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const VALID_PRIORITIES = ["low", "medium", "high", "urgent"] as const;
type Priority = (typeof VALID_PRIORITIES)[number];

function sanitizePriority(p: unknown): Priority {
  return VALID_PRIORITIES.includes(p as Priority) ? (p as Priority) : "medium";
}

function sanitizeText(s: unknown, maxLen: number): string {
  if (typeof s !== "string") return "";
  return s.replace(/[\r\n]+/g, " ").trim().slice(0, maxLen);
}

// ─── Tool Handlers ────────────────────────────────────────────────────────────

async function handleSearchFAQs(query: string): Promise<string> {
  const results = await db
    .select()
    .from(faqs)
    .where(
      or(
        ilike(faqs.question, `%${query}%`),
        ilike(faqs.answer, `%${query}%`),
        ilike(faqs.category, `%${query}%`)
      )
    )
    .limit(3);

  if (results.length === 0) return "No FAQ articles found matching this query.";

  return results
    .map((faq, i) => `[FAQ ${i + 1}] ${faq.question}\nAnswer: ${faq.answer}\nCategory: ${faq.category}`)
    .join("\n\n");
}

async function handleGetTicketStatus(ticketId: string, userId: string): Promise<string> {
  const ticket = await db
    .select()
    .from(tickets)
    .where(and(eq(tickets.id, ticketId), eq(tickets.userId, userId)))
    .limit(1);

  if (ticket.length === 0) return `No ticket found with ID: ${ticketId}`;

  const t = ticket[0];
  return `Ticket #${t.id.slice(0, 8)}:\nStatus: ${t.status}\nPriority: ${t.priority}\nTitle: ${t.title}\nCreated: ${t.createdAt.toLocaleDateString()}`;
}

async function handleEscalation(
  reason: string,
  priority: Priority,
  summary: string,
  conversationId: string,
  userId: string
): Promise<{ message: string; ticketId: string }> {
  const safeReason = sanitizeText(reason, 500);
  const safeSummary = sanitizeText(summary, 100);
  const safePriority = sanitizePriority(priority);

  const [ticket] = await db
    .insert(tickets)
    .values({
      conversationId,
      userId,
      title: safeSummary || "Support escalation",
      description: `${safeSummary}\n\nEscalation Reason: ${safeReason}`,
      status: "escalated",
      priority: safePriority,
    })
    .returning();

  await db
    .update(conversations)
    .set({ isEscalated: true, escalationReason: safeReason })
    .where(eq(conversations.id, conversationId));

  return {
    message: `Ticket created: #${ticket.id.slice(0, 8)}`,
    ticketId: ticket.id,
  };
}

// ─── Tools Definition ─────────────────────────────────────────────────────────

const TOOLS: any[] = [
  {
    type: "function",
    function: {
      name: "search_faqs",
      description: "Search the knowledge base for answers to common questions. Use this FIRST before escalating.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search query to find relevant FAQ articles",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "escalate_to_human",
      description: "Escalate a complex issue to a human support agent. Only use when you cannot resolve with FAQ knowledge, user is very frustrated, or issue involves security/legal/billing over $100.",
      parameters: {
        type: "object",
        properties: {
          reason: { type: "string", description: "Why this needs human support" },
          priority: { type: "string", enum: ["low", "medium", "high", "urgent"], description: "Ticket priority level" },
          summary: { type: "string", description: "Brief summary of the customer issue" },
        },
        required: ["reason", "priority", "summary"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_ticket_status",
      description: "Check the status of a support ticket by ticket ID",
      parameters: {
        type: "object",
        properties: {
          ticketId: { type: "string", description: "The ticket ID to check" },
        },
        required: ["ticketId"],
      },
    },
  },
];

// ─── System Prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are Alex, a friendly and professional AI customer support agent.

Your responsibilities:
1. Help customers with their questions and issues
2. ALWAYS search FAQs first before giving answers using the search_faqs tool
3. Be empathetic and solution-focused
4. Escalate to human agents ONLY when necessary

IMPORTANT: When you need to use a tool, use the proper tool-calling mechanism only. NEVER write function calls as text in your response (e.g. never output something like <function=name{...}> or similar text-based syntax). Either call the tool properly through the tool-calling interface, or respond in plain text without mentioning tool names.

Personality: Warm, professional, helpful, concise but thorough.
Always acknowledge the customer's concern before solving it.
Use bullet points for multi-step instructions.
Always end with asking if there is anything else you can help with.`;

// ─── Main AI Chat Function ────────────────────────────────────────────────────

const MAX_TOOL_ITERATIONS = 6;

async function callGroq(groqMessages: any[], temperature: number) {
  return groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: groqMessages,
    tools: TOOLS,
    tool_choice: "auto",
    max_tokens: 1024,
    temperature,
  });
}

export async function streamAIResponse(
  messages: ChatMessage[],
  conversationId: string,
  userId: string,
  onChunk: (chunk: string) => void,
  onToolCall: (tool: string, input: unknown) => void
): Promise<{ content: string; escalation?: EscalationResult }> {

  const contentParts: string[] = [];
  let escalationResult: EscalationResult | undefined;

  const groqMessages: any[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ];

  let continueLoop = true;
  let iterations = 0;

  while (continueLoop) {
    iterations++;
    if (iterations > MAX_TOOL_ITERATIONS) {
      const fallback = "\n\nI'm having trouble completing this request. Let me connect you with a human agent.";
      onChunk(fallback);
      contentParts.push(fallback);
      break;
    }

    let response;
    try {
      response = await callGroq(groqMessages, 0.4);
    } catch (err: any) {
      // Model produced a malformed inline function call instead of a proper tool call
      if (err?.error?.error?.code === "tool_use_failed") {
        console.warn("⚠️ tool_use_failed, retrying with corrective system message");

        groqMessages.push({
          role: "system",
          content:
            "Your previous response attempted to call a function using invalid text-based syntax. Do not write function calls as text. Either use the proper tool-calling mechanism, or respond with plain text only (no function syntax).",
        });

        try {
          response = await callGroq(groqMessages, 0.3);
        } catch (retryErr: any) {
          if (retryErr?.error?.error?.code === "tool_use_failed") {
            // Give up on tools entirely for this turn — respond in plain text
            console.warn("⚠️ tool_use_failed again, falling back to no-tools response");
            const fallbackResponse = await groq.chat.completions.create({
              model: "llama-3.3-70b-versatile",
              messages: groqMessages,
              max_tokens: 1024,
              temperature: 0.3,
            });
            response = fallbackResponse;
          } else {
            throw retryErr;
          }
        }
      } else {
        throw err;
      }
    }

    const choice = response.choices[0];
    const assistantMessage = choice.message;

    groqMessages.push(assistantMessage);

    if (assistantMessage.content) {
      if (contentParts.length > 0) {
        contentParts.push("\n\n");
        onChunk("\n\n");
      }

      const words = assistantMessage.content.split(" ");
      for (const word of words) {
        onChunk(word + " ");
        await new Promise((r) => setTimeout(r, 15));
      }
      contentParts.push(assistantMessage.content);
    }

    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      for (const toolCall of assistantMessage.tool_calls) {
        const toolName = toolCall.function.name;

        let toolArgs: any;
        try {
          toolArgs = JSON.parse(toolCall.function.arguments);
        } catch {
          toolArgs = {};
        }

        onToolCall(toolName, toolArgs);

        let toolResult = "";

        if (toolName === "search_faqs") {
          toolResult = await handleSearchFAQs(toolArgs.query ?? "");
        } else if (toolName === "escalate_to_human") {
          const res = await handleEscalation(
            toolArgs.reason ?? "",
            sanitizePriority(toolArgs.priority),
            toolArgs.summary ?? "",
            conversationId,
            userId
          );
          toolResult = res.message;
          escalationResult = {
            shouldEscalate: true,
            reason: sanitizeText(toolArgs.reason, 500),
            priority: sanitizePriority(toolArgs.priority),
            ticketId: res.ticketId,
          };
        } else if (toolName === "get_ticket_status") {
          toolResult = await handleGetTicketStatus(toolArgs.ticketId ?? "", userId);
        } else {
          toolResult = `Unknown tool: ${toolName}`;
        }

        groqMessages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: toolResult,
        });
      }

      continueLoop = true;
    } else {
      continueLoop = false;
    }
  }

  return { content: contentParts.join(""), escalation: escalationResult };
}
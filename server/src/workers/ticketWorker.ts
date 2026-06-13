import { Worker, Queue } from "bullmq";
import { db } from "../db";
import { tickets } from "../db/schema";
import { eq } from "drizzle-orm";

const connection = {
  url: process.env.REDIS_URL ?? "redis://localhost:6379",
};

export const ticketQueue = new Queue("tickets", { connection });
export const notificationQueue = new Queue("notifications", { connection });

export function startTicketWorker() {
  const worker = new Worker(
    "tickets",
    async (job) => {
      console.log(`🔧 Processing ticket job: ${job.name}`);

      if (job.name === "auto-assign") {
        const { ticketId } = job.data as { ticketId: string };
        await db
          .update(tickets)
          .set({ status: "in_progress", updatedAt: new Date() })
          .where(eq(tickets.id, ticketId));
        console.log(`✅ Auto-assigned ticket ${ticketId}`);
      }

      if (job.name === "escalation-notify") {
        const { ticketId, userId } = job.data as { ticketId: string; userId: string };
        console.log(`📧 Escalation notification sent for ticket ${ticketId} to user ${userId}`);
      }
    },
    { connection }
  );

  worker.on("completed", (job) => console.log(`✅ Job ${job.id} completed`));
  worker.on("failed", (job, err) => console.error(`❌ Job ${job?.id} failed:`, err));

  return worker;
}

export async function enqueueEscalation(ticketId: string, userId: string) {
  await ticketQueue.add("auto-assign", { ticketId }, { delay: 1000, attempts: 3 });
  await ticketQueue.add("escalation-notify", { ticketId, userId }, { delay: 2000, attempts: 3 });
}
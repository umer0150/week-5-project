import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { faqs } from "./schema";

const seedFAQs = [
  {
    question: "How do I reset my password?",
    answer:
      "To reset your password: 1) Click 'Forgot Password' on the login page. 2) Enter your email address. 3) Check your email for a reset link. 4) Click the link and create a new password. The link expires in 24 hours.",
    category: "Account",
    tags: ["password", "reset", "login", "account"],
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit cards (Visa, MasterCard, American Express), PayPal, bank transfers, and cryptocurrency (Bitcoin, Ethereum). All transactions are encrypted and secure.",
    category: "Billing",
    tags: ["payment", "billing", "credit card", "paypal"],
  },
  {
    question: "How do I cancel my subscription?",
    answer:
      "To cancel your subscription: Go to Account Settings > Subscription > Cancel Plan. Your access continues until the end of the billing period. You won't be charged again after cancellation.",
    category: "Billing",
    tags: ["cancel", "subscription", "refund", "billing"],
  },
  {
    question: "What is your refund policy?",
    answer:
      "We offer a 30-day money-back guarantee for all plans. If you're not satisfied, contact support within 30 days of purchase for a full refund. Refunds are processed within 5-7 business days.",
    category: "Billing",
    tags: ["refund", "money back", "guarantee", "billing"],
  },
  {
    question: "How do I upgrade my plan?",
    answer:
      "You can upgrade anytime from Account Settings > Subscription > Change Plan. Upgrades take effect immediately and you'll be charged the prorated difference for the remaining billing period.",
    category: "Billing",
    tags: ["upgrade", "plan", "subscription"],
  },
  {
    question: "How long does shipping take?",
    answer:
      "Standard shipping takes 5-7 business days. Express shipping (2-3 days) and overnight options are available at checkout. International shipping takes 10-14 business days. Free shipping on orders over $50.",
    category: "Shipping",
    tags: ["shipping", "delivery", "tracking", "order"],
  },
  {
    question: "Can I track my order?",
    answer:
      "Yes! Once your order ships, you'll receive a tracking number via email. You can also track your order in your Account > Orders section. Tracking updates are available within 24 hours of shipment.",
    category: "Shipping",
    tags: ["tracking", "order", "shipping", "delivery"],
  },
  {
    question: "How do I contact human support?",
    answer:
      "You can reach our human support team via: Email at support@company.com (response within 24hrs), Live chat (Mon-Fri 9am-6pm EST), Phone: 1-800-SUPPORT (Mon-Fri 9am-5pm EST). For urgent issues, use our escalation option.",
    category: "Support",
    tags: ["contact", "human", "support", "help"],
  },
  {
    question: "Is my data secure?",
    answer:
      "Yes. We use industry-standard AES-256 encryption, SOC 2 Type II compliance, regular security audits, and GDPR compliance. Your data is never sold to third parties. You can request data deletion anytime.",
    category: "Security",
    tags: ["security", "privacy", "data", "encryption", "GDPR"],
  },
  {
    question: "How do I update my account information?",
    answer:
      "Go to Account Settings > Profile to update your name, email, phone number, and address. Email changes require verification. Profile updates save immediately.",
    category: "Account",
    tags: ["account", "profile", "update", "settings"],
  },
];

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("neon.tech")
    ? { rejectUnauthorized: false }
    : false,
});

const db = drizzle(pool, { schema: { faqs } });

// ─── Seed Function ────────────────────────────────────────────────────────────

async function seed() {
  console.log("🌱 Seeding database...");
  try {
    await db.delete(faqs);
    await db.insert(faqs).values(seedFAQs);
    console.log(`✅ Seeded ${seedFAQs.length} FAQs`);
  } catch (error) {
    console.error("❌ Seed error:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

seed()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
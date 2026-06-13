import { useState } from "react";
import { Search, BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";
import type { FAQ } from "../types";

/* ---------------- FAQ ITEM ---------------- */

function FAQItem({ faq }: { faq: FAQ }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-gray-800 rounded-xl bg-gray-900/60 backdrop-blur-sm overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-gray-800/40 transition-colors"
      >
        <span className="text-sm font-medium text-gray-100 leading-snug">
          {faq.question}
        </span>

        <div className="text-sky-300 flex-shrink-0">
          {open ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 pt-5 text-sm text-gray-400 leading-relaxed border-t border-gray-800">
          {faq.answer}
        </div>
      )}
    </div>
  );
}

/* ---------------- PAGE ---------------- */

export default function FAQPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  const { data: faqs = [], isLoading } = useQuery({
    queryKey: ["faqs", search, category],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (search) params.set("search", search);
      if (category) params.set("category", category);

      const res = await api.get<{ data: FAQ[] }>(`/faqs?${params.toString()}`);

      return res.data.data ?? [];
    },
  });

  const categories = Array.from(new Set(faqs.map((f) => f.category)));

  return (
    <div className="h-full bg-gray-950 text-white flex flex-col">
      {/* HEADER */}
      <div className="px-4 sm:px-6 py-5 border-b border-gray-800">
        <h1 className="text-lg font-semibold">Frequently Asked Questions</h1>
        <p className="text-xs text-gray-500 mt-1">
          Quick answers to common questions
        </p>
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
        {/* SEARCH + FILTER */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search FAQs..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-sm text-white placeholder-gray-500 focus:border-blue-500/40 outline-none"
            />
          </div>

          {/* Category */}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full sm:w-44 px-3 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-sm text-white focus:border-blue-500/40 outline-none"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* RESULTS */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-16 bg-gray-900 border border-gray-800 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : faqs.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No FAQs found</p>
            <p className="text-gray-600 text-sm mt-1">
              Try a different search term
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {faqs.map((faq) => (
              <FAQItem key={faq.id} faq={faq} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

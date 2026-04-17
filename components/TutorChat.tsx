"use client";

/**
 * TutorChat — Socratic Python coaching chat panel
 *
 * Sits alongside lesson/challenge content. Supports 4 modes:
 *   socratic    — "Guide me through this" (default for challenges)
 *   syntax      — "How do I write X in Python?"
 *   tutorial    — "Explain concept X to me"
 *   talkthrough — "Let me think out loud"
 */

import { useState, useRef, useEffect, useCallback } from "react";
import type { TutorMessage } from "@/app/api/tutor/route";

type TutorMode = "socratic" | "syntax" | "tutorial" | "talkthrough";

interface TutorContext {
  challengeId?: string;
  lessonTitle?: string;
  moduleTitle?: string;
  currentCode?: string;
  attemptNumber?: number;
}

interface TutorChatProps {
  context?: TutorContext;
  initialMode?: TutorMode;
  className?: string;
}

const MODE_CONFIG: Record<TutorMode, { label: string; icon: string; placeholder: string; description: string }> = {
  socratic: {
    label: "Guide me",
    icon: "🧭",
    placeholder: "Ask for guidance — Eli will steer you with questions...",
    description: "Eli coaches with questions. No answers until you've tried.",
  },
  syntax: {
    label: "Syntax help",
    icon: "⌨️",
    placeholder: "Ask any Python syntax or API question...",
    description: "Fast answers for Python syntax and stdlib questions.",
  },
  tutorial: {
    label: "Mini tutorial",
    icon: "📖",
    placeholder: "What concept do you want explained? (e.g. 'groupby reset_index')",
    description: "Focused 2-min explanation of one concept.",
  },
  talkthrough: {
    label: "Think out loud",
    icon: "💬",
    placeholder: "Talk through your approach — Eli listens and asks questions...",
    description: "Narrate your thinking. Eli helps you find gaps.",
  },
};

const STARTER_PROMPTS: Record<TutorMode, string[]> = {
  socratic: [
    "I'm not sure where to start with this problem",
    "I loaded the data — what should I do next?",
    "I know I need to group the data but I'm not sure how",
  ],
  syntax: [
    "How do I group by multiple columns in pandas?",
    "What's the difference between json.load and json.loads?",
    "How do I calculate the 95th percentile in numpy?",
  ],
  tutorial: [
    "Explain groupby and reset_index",
    "When should I use defaultdict vs a regular dict?",
    "How does pandas handle NaN in aggregations?",
  ],
  talkthrough: [
    "OK so my plan is to first load the JSON, then...",
    "I'm thinking I should filter before grouping because...",
    "The problem asks for cheapest model above 8.0 so I think I...",
  ],
};

export default function TutorChat({ context, initialMode = "socratic", className = "" }: TutorChatProps) {
  const [mode, setMode] = useState<TutorMode>(initialMode);
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || loading) return;

    const userMsg: TutorMessage = { role: "user", content: content.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          mode,
          context,
        }),
      });

      if (!res.ok) throw new Error(`Tutor API error: ${res.status}`);
      const data = await res.json() as { reply: string; mode: string };

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Something went wrong — try again or rephrase your question.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [messages, mode, context, loading]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = () => setMessages([]);

  const switchMode = (newMode: TutorMode) => {
    setMode(newMode);
    setMessages([]);
  };

  const cfg = MODE_CONFIG[mode];

  // ── Collapsed state ─────────────────────────────────────────────────────────
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-zinc-900/80 hover:bg-zinc-800 text-sm text-zinc-300 hover:text-white transition-all ${className}`}
      >
        <span className="text-lg">🧑‍💻</span>
        <span>Ask Eli</span>
        <span className="text-xs text-zinc-500 ml-1">({cfg.label})</span>
      </button>
    );
  }

  // ── Expanded chat ────────────────────────────────────────────────────────────
  return (
    <div className={`flex flex-col rounded-xl border border-white/10 bg-zinc-950 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-zinc-900">
        <div className="flex items-center gap-2">
          <span className="text-lg">🧑‍💻</span>
          <span className="text-sm font-medium text-white">Eli</span>
          <span className="text-xs text-zinc-500">— {cfg.description}</span>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-zinc-500 hover:text-white transition-colors text-xs"
        >
          ✕
        </button>
      </div>

      {/* Mode tabs */}
      <div className="flex border-b border-white/10 bg-zinc-900/50">
        {(Object.keys(MODE_CONFIG) as TutorMode[]).map((m) => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs transition-colors border-b-2 ${
              mode === m
                ? "border-lime-400 text-lime-400 bg-lime-400/5"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <span>{MODE_CONFIG[m].icon}</span>
            <span>{MODE_CONFIG[m].label}</span>
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] max-h-[400px]">
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-xs text-zinc-600 mb-3">Try asking:</p>
            {STARTER_PROMPTS[mode].map((prompt) => (
              <button
                key={prompt}
                onClick={() => sendMessage(prompt)}
                className="block w-full text-left text-xs px-3 py-2 rounded-lg border border-white/5 bg-zinc-900 text-zinc-400 hover:text-white hover:border-white/20 transition-all"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-zinc-700 text-white rounded-br-none"
                  : "bg-zinc-900 border border-white/10 text-zinc-200 rounded-bl-none"
              }`}
            >
              <MessageContent content={msg.content} />
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-zinc-900 border border-white/10 rounded-xl rounded-bl-none px-3 py-2">
              <span className="text-zinc-500 text-sm animate-pulse">Eli is thinking…</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-white/10 p-3 bg-zinc-900/50">
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="text-xs text-zinc-600 hover:text-zinc-400 mb-2 transition-colors"
          >
            Clear chat
          </button>
        )}
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={cfg.placeholder}
            rows={2}
            className="flex-1 bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 resize-none focus:outline-none focus:border-lime-400/40 transition-colors"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="px-3 py-2 rounded-lg bg-lime-400 text-black text-sm font-medium hover:bg-lime-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
          >
            Send
          </button>
        </div>
        <p className="text-xs text-zinc-700 mt-1.5">Enter to send · Shift+Enter for newline</p>
      </div>
    </div>
  );
}

// ── Inline markdown renderer (code blocks + plain text) ─────────────────────
function MessageContent({ content }: { content: string }) {
  const parts = content.split(/(```[\s\S]*?```)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("```")) {
          const lines = part.split("\n");
          const lang = lines[0].replace("```", "").trim();
          const code = lines.slice(1, -1).join("\n");
          return (
            <pre
              key={i}
              className="mt-2 mb-2 p-2 rounded bg-zinc-800 text-xs font-mono overflow-x-auto text-lime-300 border border-white/5"
            >
              {lang && <div className="text-zinc-600 text-[10px] mb-1">{lang}</div>}
              <code>{code}</code>
            </pre>
          );
        }
        return (
          <span key={i} className="whitespace-pre-wrap">
            {part}
          </span>
        );
      })}
    </>
  );
}

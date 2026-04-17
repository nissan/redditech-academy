/**
 * judge-llm.ts — Swappable LLM factory for the Eli judge
 *
 * Prod:   JUDGE_PROVIDER=anthropic (default)  → Claude Haiku via @langchain/anthropic
 * Local:  JUDGE_PROVIDER=ollama               → Ollama OpenAI-compat API via @langchain/openai
 *
 * Environment variables:
 *   JUDGE_PROVIDER      "anthropic" | "ollama"  (default: "anthropic")
 *   JUDGE_MODEL         model name override
 *   ANTHROPIC_API_KEY   required for anthropic provider
 *   OLLAMA_BASE_URL     Ollama server URL (default: "http://localhost:11434")
 *
 * Usage:
 *   const llm = createJudgeLLM();
 *   const result = await llm.invoke([{ role: "system", ... }, { role: "user", ... }]);
 *   const text = result.content as string;
 */

import { ChatAnthropic } from "@langchain/anthropic";
import { ChatOpenAI } from "@langchain/openai";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { execSync } from "child_process";

function getAnthropicKey(): string {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;
  try {
    return execSync('op read "op://OpenClaw/Anthropic API Key/notesPlain"', {
      timeout: 5000,
      encoding: "utf-8",
    }).trim();
  } catch {
    throw new Error("ANTHROPIC_API_KEY not set and 1Password not available");
  }
}

export type JudgeProvider = "anthropic" | "ollama";

export interface JudgeLLMOptions {
  provider?: JudgeProvider;
  model?: string;
  ollamaBaseUrl?: string;
}

/**
 * Create the judge LLM appropriate for the current environment.
 * Reads from environment variables; options override env vars.
 */
export function createJudgeLLM(opts: JudgeLLMOptions = {}): BaseChatModel {
  const provider =
    (opts.provider ?? (process.env.JUDGE_PROVIDER as JudgeProvider | undefined) ?? "anthropic");

  if (provider === "ollama") {
    const baseUrl =
      opts.ollamaBaseUrl ??
      process.env.OLLAMA_BASE_URL ??
      "http://localhost:11434";

    const model = opts.model ?? process.env.JUDGE_MODEL ?? "mistral:latest";

    // Ollama exposes an OpenAI-compatible API at /v1 — no separate SDK needed
    return new ChatOpenAI({
      model,
      temperature: 0.3,
      maxTokens: 400,
      // Ollama's OpenAI-compat endpoint
      configuration: {
        baseURL: `${baseUrl}/v1`,
        apiKey: "ollama", // Ollama ignores the key but the SDK requires one
      },
      modelKwargs: {
        // Ask Ollama for JSON mode — prevents fence-wrapping
        response_format: { type: "json_object" },
      },
    });
  }

  // Default: Anthropic Claude Haiku
  const apiKey = getAnthropicKey();
  const model = opts.model ?? process.env.JUDGE_MODEL ?? "claude-haiku-4-5";

  return new ChatAnthropic({
    apiKey,
    model,
    maxTokens: 300,
    temperature: 0.3,
  });
}

/** Return a human-readable label for logging */
export function judgeProviderLabel(): string {
  const provider = process.env.JUDGE_PROVIDER ?? "anthropic";
  const model =
    process.env.JUDGE_MODEL ??
    (provider === "ollama" ? "mistral:latest" : "claude-haiku-4-5");
  const base =
    provider === "ollama"
      ? (process.env.OLLAMA_BASE_URL ?? "http://localhost:11434")
      : "Anthropic";
  return `${provider}/${model} @ ${base}`;
}

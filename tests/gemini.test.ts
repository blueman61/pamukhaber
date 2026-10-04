import type { GenerateContentParameters, GenerateContentResponse } from "@google/genai";
import { describe, expect, it, vi } from "vitest";
import { AiError, candidateModels, createGeminiGenerator, toAiError } from "@/lib/ai";

/** SDK'nın ApiError'ı gibi: HTTP durumu + mesajda JSON gövde. */
const apiError = (status: number, message: string, code = "INVALID_ARGUMENT", reason?: string) =>
  Object.assign(
    new Error(JSON.stringify({ error: { code: status, message, status: code, details: reason ? [{ reason }] : [] } })),
    { status, name: "ApiError" },
  );

const ok = (text: string) => ({ text, candidates: [] }) as unknown as GenerateContentResponse;
const future = () => Date.now() + 5_000;

describe("candidateModels", () => {
  it("puts GEMINI_MODEL first and dedupes", () => {
    expect(candidateModels("my-model")).toEqual(["my-model", "gemini-flash-latest", "gemini-flash-lite-latest"]);
    expect(candidateModels("gemini-flash-latest")).toEqual(["gemini-flash-latest", "gemini-flash-lite-latest"]);
    expect(candidateModels(undefined)[0]).toBe("gemini-flash-latest");
  });
});

describe("createGeminiGenerator", () => {
  it("skips unavailable models and remembers the working one", async () => {
    const seen: string[] = [];
    const call = vi.fn(async (p: GenerateContentParameters) => {
      seen.push(p.model);
      if (p.model === "old-model") throw apiError(404, "models/old-model is not found for API version v1beta", "NOT_FOUND");
      return ok('{"ok":true}');
    });
    const gen = createGeminiGenerator(call, () => ["old-model", "gemini-flash-latest"]);
    expect(await gen.json("s", "p", {}, future())).toBe('{"ok":true}');
    expect(seen).toEqual(["old-model", "gemini-flash-latest"]);
    await gen.json("s", "p", {}, future());
    expect(seen.at(-1)).toBe("gemini-flash-latest");
    expect(seen).toHaveLength(3); // ikinci çağrıda eski model denenmedi
  });

  it("retries without thinking config when the model rejects it", async () => {
    const configs: unknown[] = [];
    const call = vi.fn(async (p: GenerateContentParameters) => {
      configs.push(p.config?.thinkingConfig);
      if (p.config?.thinkingConfig) throw apiError(400, "Thinking level is not supported for this model.");
      return ok("{}");
    });
    const gen = createGeminiGenerator(call, () => ["gemini-flash-latest"]);
    await gen.json("s", "p", {}, future());
    expect(configs).toEqual([{ thinkingLevel: "LOW" }, undefined]);
  });

  it("uses a thinking budget for 2.5 models and passes an abort signal", async () => {
    let params: GenerateContentParameters | null = null;
    const gen = createGeminiGenerator(async (p) => ((params = p), ok("{}")), () => ["gemini-2.5-flash"]);
    await gen.json("s", "p", {}, future());
    expect(params!.config?.thinkingConfig).toEqual({ thinkingBudget: 0 });
    expect(params!.config?.abortSignal).toBeInstanceOf(AbortSignal);
  });

  it("reports when no model is available", async () => {
    const gen = createGeminiGenerator(async () => {
      throw apiError(404, "model not found", "NOT_FOUND");
    }, () => ["a", "b"]);
    await expect(gen.json("s", "p", {}, future())).rejects.toThrow(/modeli bulunamadı \(a, b\).*GEMINI_MODEL/);
  });

  it("turns aborts and exhausted budgets into a timeout message", async () => {
    const abort = Object.assign(new Error("This operation was aborted"), { name: "AbortError" });
    const gen = createGeminiGenerator(async () => {
      throw abort;
    }, () => ["m"]);
    await expect(gen.json("s", "p", {}, future())).rejects.toThrow(/10 saniye/);
    await expect(gen.json("s", "p", {}, Date.now() - 1)).rejects.toThrow(/10 saniye/);
  });

  it("does not swallow other errors as model problems", async () => {
    const call = vi.fn(async () => {
      throw apiError(400, "API key not valid. Please pass a valid API key.", "INVALID_ARGUMENT", "API_KEY_INVALID");
    });
    const gen = createGeminiGenerator(call, () => ["a", "b"]);
    await expect(gen.json("s", "p", {}, future())).rejects.toThrow(/API key not valid/);
    expect(call).toHaveBeenCalledTimes(1);
  });
});

describe("toAiError", () => {
  const silence = () => vi.spyOn(console, "error").mockImplementation(() => {});

  it("maps invalid keys (which Gemini returns as 400)", () => {
    silence();
    const e = toAiError(apiError(400, "API key not valid. Please pass a valid API key.", "INVALID_ARGUMENT", "API_KEY_INVALID"));
    expect(e.message).toMatch(/anahtarı geçersiz.*GEMINI_API_KEY/);
  });

  it("maps quota and region errors", () => {
    silence();
    expect(toAiError(apiError(429, "Resource exhausted", "RESOURCE_EXHAUSTED")).message).toMatch(/kotası/);
    expect(toAiError(apiError(400, "User location is not supported for the API use.", "FAILED_PRECONDITION")).message).toMatch(
      /bölgesinden/,
    );
  });

  it("shows a short, key-free technical detail for unknown errors", () => {
    silence();
    const long = `Something odd with key AIzaSyA1234567890abcdefghijklmnop ${"x".repeat(400)}`;
    const msg = toAiError(apiError(500, long, "INTERNAL")).message;
    expect(msg).toMatch(/^Yapay zekâya ulaşılamadı\. Tekrar deneyin\. \(500: Something odd/);
    expect(msg).not.toContain("AIzaSy");
    expect(msg.length).toBeLessThan(260);
  });

  it("passes AiError through", () => {
    const e = new AiError("hazır mesaj");
    expect(toAiError(e)).toBe(e);
  });
});

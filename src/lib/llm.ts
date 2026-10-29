import "server-only";
import type { ResumeAnalysis } from "./resume-analyzer";

/**
 * Optional LLM-written summary of a resume. Works with any OpenAI-compatible
 * chat completions endpoint. Returns null when no key is configured or the call
 * fails, so the app always works with the built-in analyzer alone.
 */
export async function llmResumeSummary(text: string, analysis: ResumeAnalysis): Promise<string | null> {
  const apiKey = process.env.LLM_API_KEY;
  if (!apiKey) return null;

  const baseUrl = (process.env.LLM_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const model = process.env.LLM_MODEL || "gpt-4o-mini";

  const prompt = [
    "You are a concise technical recruiter. In 3-4 sentences, summarize this candidate's strengths",
    "and the single most valuable improvement to their resume. Be specific and encouraging.",
    `Detected skills: ${analysis.skills.join(", ") || "none"}.`,
    `Estimated experience: ${analysis.experienceYears} years.`,
    "Resume:",
    text.slice(0, 6000),
  ].join("\n");

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }], max_tokens: 250, temperature: 0.3 }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch {
    return null;
  }
}

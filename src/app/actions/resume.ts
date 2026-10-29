"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { llmResumeSummary } from "@/lib/llm";
import { extractResumeText } from "@/lib/pdf";
import { analyzeResume } from "@/lib/resume-analyzer";
import type { FormState } from "./types";

const MAX_BYTES = 4 * 1024 * 1024;

export async function saveResume(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireSession("CANDIDATE");

  const file = formData.get("file");
  const pasted = String(formData.get("text") ?? "").trim();

  let text = pasted;
  let fileName: string | null = null;

  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_BYTES) return { error: "File is larger than 4 MB" };
    const ok = file.type === "application/pdf" || file.type === "text/plain" || /\.(pdf|txt)$/i.test(file.name);
    if (!ok) return { error: "Upload a PDF or .txt file" };
    try {
      text = await extractResumeText(file);
      fileName = file.name;
    } catch {
      return { error: "Couldn't read that PDF. Try exporting it again or paste the text instead." };
    }
  }

  text = text.replace(/\u0000/g, "").trim();
  if (text.length < 50) return { error: "Upload your resume or paste at least a few lines of it" };

  const analysis = analyzeResume(text);
  const summary = await llmResumeSummary(text, analysis);

  const data = {
    fileName,
    text,
    skills: JSON.stringify(analysis.skills),
    experienceYears: analysis.experienceYears,
    score: analysis.score,
    feedback: JSON.stringify(analysis.feedback),
    summary,
  };

  await db.resume.upsert({
    where: { userId: session.userId },
    create: { userId: session.userId, ...data },
    update: data,
  });

  revalidatePath("/resume");
  revalidatePath("/dashboard");
  revalidatePath("/jobs");
  return { success: `Analyzed — found ${analysis.skills.length} skills, score ${analysis.score}/100.` };
}

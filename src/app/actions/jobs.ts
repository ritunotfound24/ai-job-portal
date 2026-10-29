"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { JOB_TYPES } from "@/lib/constants";
import { db } from "@/lib/db";
import { extractSkills, normalizeSkillList } from "@/lib/skills";
import type { FormState } from "./types";

const jobSchema = z.object({
  title: z.string().trim().min(3, "Title is too short").max(120),
  location: z.string().trim().min(2, "Add a location").max(80),
  remote: z.boolean(),
  type: z.enum(JOB_TYPES),
  minYears: z.coerce.number().min(0).max(30),
  salaryRange: z.string().trim().max(60).optional(),
  description: z.string().trim().min(40, "Describe the role in a few sentences (40+ characters)").max(8000),
  skills: z.string().trim().max(500),
});

export async function createJob(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireSession("RECRUITER");
  const parsed = jobSchema.safeParse({
    title: formData.get("title"),
    location: formData.get("location"),
    remote: formData.get("remote") === "on",
    type: formData.get("type"),
    minYears: formData.get("minYears") || 0,
    salaryRange: formData.get("salaryRange") || undefined,
    description: formData.get("description"),
    skills: formData.get("skills") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const recruiter = await db.user.findUniqueOrThrow({ where: { id: session.userId } });

  // Use the skills the recruiter typed; if they left it empty, pull them from the description.
  let skills = normalizeSkillList(parsed.data.skills);
  if (skills.length === 0) skills = extractSkills(parsed.data.description);
  if (skills.length === 0) return { error: "List at least one required skill" };

  const { skills: _ignored, ...rest } = parsed.data;
  const job = await db.job.create({
    data: {
      ...rest,
      company: recruiter.company ?? recruiter.name,
      skills: JSON.stringify(skills),
      recruiterId: session.userId,
    },
  });

  revalidatePath("/jobs");
  redirect(`/jobs/${job.id}`);
}

export async function toggleJobOpen(formData: FormData): Promise<void> {
  const session = await requireSession("RECRUITER");
  const jobId = String(formData.get("jobId"));
  const job = await db.job.findUnique({ where: { id: jobId } });
  if (!job || job.recruiterId !== session.userId) return;

  await db.job.update({ where: { id: jobId }, data: { open: !job.open } });
  revalidatePath("/dashboard");
  revalidatePath("/jobs");
  revalidatePath(`/jobs/${jobId}`);
}

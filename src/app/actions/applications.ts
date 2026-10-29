"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { APPLICATION_STATUSES, type ApplicationStatus } from "@/lib/constants";
import { db } from "@/lib/db";
import { matchesForCandidate } from "@/lib/recommend";
import type { FormState } from "./types";

export async function applyToJob(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireSession("CANDIDATE");
  const jobId = String(formData.get("jobId") ?? "");
  const coverNote = String(formData.get("coverNote") ?? "").trim().slice(0, 2000) || null;

  const job = await db.job.findUnique({ where: { id: jobId } });
  if (!job || !job.open) return { error: "This job is no longer accepting applications" };

  const matches = await matchesForCandidate(session.userId);
  if (!matches) return { error: "Upload your resume before applying" };

  const existing = await db.application.findUnique({
    where: { jobId_candidateId: { jobId, candidateId: session.userId } },
  });
  if (existing) return { error: "You've already applied to this job" };

  await db.application.create({
    data: {
      jobId,
      candidateId: session.userId,
      coverNote,
      matchScore: matches.get(jobId)?.score ?? 0,
    },
  });

  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/dashboard");
  return { success: "Application sent! Track it from your dashboard." };
}

export async function updateApplicationStatus(formData: FormData): Promise<void> {
  const session = await requireSession("RECRUITER");
  const applicationId = String(formData.get("applicationId") ?? "");
  const status = String(formData.get("status") ?? "") as ApplicationStatus;
  if (!APPLICATION_STATUSES.includes(status)) return;

  const application = await db.application.findUnique({
    where: { id: applicationId },
    include: { job: { select: { recruiterId: true } } },
  });
  // Only the recruiter who owns the job can move its applicants.
  if (!application || application.job.recruiterId !== session.userId) return;

  await db.application.update({ where: { id: applicationId }, data: { status } });
  revalidatePath("/dashboard");
}

export async function withdrawApplication(formData: FormData): Promise<void> {
  const session = await requireSession("CANDIDATE");
  const applicationId = String(formData.get("applicationId") ?? "");
  await db.application.deleteMany({ where: { id: applicationId, candidateId: session.userId } });
  revalidatePath("/dashboard");
}

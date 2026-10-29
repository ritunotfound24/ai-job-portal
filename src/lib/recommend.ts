import "server-only";
import { db, parseList } from "./db";
import { rankJobs, type MatchResult } from "./matcher";

/**
 * Score every open job for a candidate. Returns a map keyed by job id,
 * or null if the candidate hasn't uploaded a resume yet.
 */
export async function matchesForCandidate(userId: string): Promise<Map<string, MatchResult> | null> {
  const resume = await db.resume.findUnique({ where: { userId } });
  if (!resume) return null;

  const jobs = await db.job.findMany({
    where: { open: true },
    select: { id: true, title: true, description: true, skills: true, minYears: true },
  });

  const ranked = rankJobs(
    { skills: parseList(resume.skills), experienceYears: resume.experienceYears, text: resume.text },
    jobs.map((j) => ({ ...j, skills: parseList(j.skills) })),
  );
  return new Map(ranked.map((r) => [r.jobId, r]));
}

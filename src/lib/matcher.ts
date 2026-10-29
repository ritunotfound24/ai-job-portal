import { tfidfSimilarity } from "./text";

export interface CandidateProfile {
  skills: string[];
  experienceYears: number;
  text: string;
}

export interface JobProfile {
  id: string;
  title: string;
  description: string;
  skills: string[];
  minYears: number;
}

export interface MatchResult {
  jobId: string;
  score: number; // 0-100
  matchedSkills: string[];
  missingSkills: string[];
  breakdown: { skills: number; content: number; experience: number };
  reasons: string[];
}

export const WEIGHTS = { skills: 0.55, content: 0.25, experience: 0.2 } as const;

/** How well the candidate's experience meets the job's minimum (1 = meets or exceeds). */
export function experienceFit(candidateYears: number, minYears: number): number {
  if (minYears <= 0) return 1;
  if (candidateYears >= minYears) return 1;
  // Partial credit, falling off linearly; being a year short isn't disqualifying.
  return Math.max(0, candidateYears / minYears);
}

/**
 * Rank jobs for one candidate. Combines:
 *  - skill coverage: share of the job's required skills the candidate has
 *  - content similarity: TF-IDF cosine between resume text and job description
 *  - experience fit
 */
export function rankJobs(candidate: CandidateProfile, jobs: JobProfile[]): MatchResult[] {
  if (jobs.length === 0) return [];

  const docs = [candidate.text, ...jobs.map((j) => `${j.title} ${j.title} ${j.description} ${j.skills.join(" ")}`)];
  const sim = tfidfSimilarity(docs);
  const have = new Set(candidate.skills.map((s) => s.toLowerCase()));

  const results = jobs.map((job, i) => {
    const required = job.skills;
    const matchedSkills = required.filter((s) => have.has(s.toLowerCase()));
    const missingSkills = required.filter((s) => !have.has(s.toLowerCase()));
    const skillScore = required.length ? matchedSkills.length / required.length : 0.5;

    // Raw TF-IDF cosine between a resume and a job post rarely exceeds ~0.4,
    // so rescale it to use the full 0-1 range.
    const contentScore = Math.min(1, sim(0, i + 1) / 0.4);
    const expScore = experienceFit(candidate.experienceYears, job.minYears);

    const total = WEIGHTS.skills * skillScore + WEIGHTS.content * contentScore + WEIGHTS.experience * expScore;

    const reasons: string[] = [];
    if (matchedSkills.length) reasons.push(`You have ${matchedSkills.length}/${required.length} required skills`);
    if (missingSkills.length) reasons.push(`Missing: ${missingSkills.slice(0, 4).join(", ")}${missingSkills.length > 4 ? "…" : ""}`);
    if (expScore < 1) reasons.push(`Asks for ${job.minYears}+ years; you have about ${candidate.experienceYears}`);
    if (contentScore > 0.6) reasons.push("Your resume closely matches the job description");

    return {
      jobId: job.id,
      score: Math.round(total * 100),
      matchedSkills,
      missingSkills,
      breakdown: {
        skills: Math.round(skillScore * 100),
        content: Math.round(contentScore * 100),
        experience: Math.round(expScore * 100),
      },
      reasons,
    };
  });

  return results.sort((a, b) => b.score - a.score);
}

/** Score a single candidate against a single job (used when someone applies). */
export function scoreMatch(candidate: CandidateProfile, job: JobProfile): MatchResult {
  return rankJobs(candidate, [job])[0];
}

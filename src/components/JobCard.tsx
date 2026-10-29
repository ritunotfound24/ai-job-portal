import Link from "next/link";
import { JOB_TYPE_LABEL, type JobType } from "@/lib/constants";
import type { MatchResult } from "@/lib/matcher";
import { ScoreRing } from "./ScoreRing";

interface Props {
  job: {
    id: string;
    title: string;
    company: string;
    location: string;
    remote: boolean;
    type: string;
    skills: string[];
    createdAt: Date;
  };
  match?: MatchResult;
}

export function JobCard({ job, match }: Props) {
  const matched = new Set(match?.matchedSkills ?? []);
  return (
    <Link href={`/jobs/${job.id}`} className="card flex items-start justify-between gap-4 transition hover:border-accent/40 hover:shadow-md">
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-base font-semibold">{job.title}</h3>
        <p className="mt-0.5 text-sm text-ink/60">
          {job.company} · {job.location}
          {job.remote ? " · Remote" : ""} · {JOB_TYPE_LABEL[job.type as JobType] ?? job.type}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {job.skills.slice(0, 7).map((s) => (
            <span key={s} className={match ? (matched.has(s) ? "chip-match" : "chip-missing") : "chip"}>
              {s}
            </span>
          ))}
        </div>
      </div>
      {match ? <ScoreRing score={match.score} size={56} label="match" /> : null}
    </Link>
  );
}

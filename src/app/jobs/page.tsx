import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { JobCard } from "@/components/JobCard";
import { getSession } from "@/lib/auth";
import { JOB_TYPES, JOB_TYPE_LABEL } from "@/lib/constants";
import { db, parseList } from "@/lib/db";
import { matchesForCandidate } from "@/lib/recommend";

export const dynamic = "force-dynamic";

interface Search {
  q?: string;
  type?: string;
  remote?: string;
  sort?: string;
}

export default async function JobsPage({ searchParams }: { searchParams: Search }) {
  const session = await getSession();
  const q = searchParams.q?.trim() ?? "";

  const where: Prisma.JobWhereInput = { open: true };
  if (q) {
    where.OR = [{ title: { contains: q } }, { company: { contains: q } }, { description: { contains: q } }, { skills: { contains: q } }];
  }
  if (searchParams.type && (JOB_TYPES as readonly string[]).includes(searchParams.type)) where.type = searchParams.type;
  if (searchParams.remote === "1") where.remote = true;

  const jobs = await db.job.findMany({ where, orderBy: { createdAt: "desc" } });
  const matches = session?.role === "CANDIDATE" ? await matchesForCandidate(session.userId) : null;

  const sortByMatch = matches && searchParams.sort !== "new";
  const sorted = sortByMatch
    ? [...jobs].sort((a, b) => (matches.get(b.id)?.score ?? 0) - (matches.get(a.id)?.score ?? 0))
    : jobs;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Jobs</h1>
          <p className="text-sm text-ink/60">
            {jobs.length} open role{jobs.length === 1 ? "" : "s"}
            {sortByMatch ? " · sorted by your match score" : ""}
          </p>
        </div>
        {session?.role === "CANDIDATE" && !matches ? (
          <Link href="/resume" className="btn">Upload resume to see match scores</Link>
        ) : null}
      </div>

      <form className="card grid gap-3 sm:grid-cols-[1fr_auto_auto_auto_auto]" role="search">
        <input name="q" defaultValue={q} placeholder="Search title, company or skill…" className="input" aria-label="Search jobs" />
        <select name="type" defaultValue={searchParams.type ?? ""} className="input" aria-label="Job type">
          <option value="">All types</option>
          {JOB_TYPES.map((t) => (
            <option key={t} value={t}>{JOB_TYPE_LABEL[t]}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 px-1 text-sm">
          <input type="checkbox" name="remote" value="1" defaultChecked={searchParams.remote === "1"} /> Remote
        </label>
        {matches ? (
          <select name="sort" defaultValue={searchParams.sort ?? "match"} className="input" aria-label="Sort">
            <option value="match">Best match</option>
            <option value="new">Newest</option>
          </select>
        ) : null}
        <button className="btn">Filter</button>
      </form>

      {sorted.length === 0 ? (
        <p className="text-ink/60">No jobs match those filters.</p>
      ) : (
        <div className="grid gap-3">
          {sorted.map((job) => (
            <JobCard key={job.id} job={{ ...job, skills: parseList(job.skills) }} match={matches?.get(job.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

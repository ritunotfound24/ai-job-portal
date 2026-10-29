import Link from "next/link";
import { JobCard } from "@/components/JobCard";
import { db, parseList } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [latest, jobCount, companyCount] = await Promise.all([
    db.job.findMany({ where: { open: true }, orderBy: { createdAt: "desc" }, take: 4 }),
    db.job.count({ where: { open: true } }),
    db.user.count({ where: { role: "RECRUITER" } }),
  ]);

  return (
    <div className="space-y-14">
      <section className="grid items-center gap-10 pt-6 md:grid-cols-[1.2fr_1fr]">
        <div>
          <p className="mb-3 text-sm font-medium uppercase tracking-wider text-accent">Resume in, matches out</p>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Stop guessing which jobs you&apos;re a fit for.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-ink/70">
            Upload your resume once. HireMatch extracts your skills, scores your resume, and ranks every open role by how
            well you match — with the exact skills you&apos;re missing.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/register" className="btn">Get matched</Link>
            <Link href="/jobs" className="btn-ghost">Browse {jobCount} jobs</Link>
          </div>
        </div>

        <div className="card space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50">How matching works</h2>
          <ol className="space-y-3 text-sm">
            <li><span className="font-semibold">55% skills</span> — share of the role&apos;s required skills found in your resume.</li>
            <li><span className="font-semibold">25% content</span> — TF-IDF similarity between your resume and the job description.</li>
            <li><span className="font-semibold">20% experience</span> — your estimated years against the role&apos;s minimum.</li>
          </ol>
          <p className="text-xs text-ink/50">{companyCount} companies hiring right now.</p>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-xl font-semibold">Latest openings</h2>
          <Link href="/jobs" className="text-sm text-accent hover:underline">See all →</Link>
        </div>
        {latest.length === 0 ? (
          <p className="text-ink/60">No jobs yet. Run <code>npm run db:seed</code> to load demo data.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {latest.map((job) => (
              <JobCard key={job.id} job={{ ...job, skills: parseList(job.skills) }} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

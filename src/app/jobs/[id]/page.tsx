import Link from "next/link";
import type { Application } from "@prisma/client";
import { notFound } from "next/navigation";
import { toggleJobOpen } from "@/app/actions/jobs";
import { ApplyForm } from "@/components/forms/ApplyForm";
import { ScoreRing } from "@/components/ScoreRing";
import { getSession } from "@/lib/auth";
import { JOB_TYPE_LABEL, STATUS_LABEL, STATUS_STYLE, type ApplicationStatus, type JobType } from "@/lib/constants";
import { db, parseList } from "@/lib/db";
import type { MatchResult } from "@/lib/matcher";
import { matchesForCandidate } from "@/lib/recommend";

export const dynamic = "force-dynamic";

export default async function JobPage({ params }: { params: { id: string } }) {
  const job = await db.job.findUnique({
    where: { id: params.id },
    include: { _count: { select: { applications: true } } },
  });
  if (!job) notFound();

  const session = await getSession();
  const skills = parseList(job.skills);
  const isOwner = session?.userId === job.recruiterId;

  let match: MatchResult | null = null;
  let application: Application | null = null;
  let hasResume = false;
  if (session?.role === "CANDIDATE") {
    const matches = await matchesForCandidate(session.userId);
    hasResume = matches !== null;
    match = matches?.get(job.id) ?? null;
    application = await db.application.findUnique({
      where: { jobId_candidateId: { jobId: job.id, candidateId: session.userId } },
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <article className="card">
        <Link href="/jobs" className="text-sm text-accent hover:underline">← All jobs</Link>
        <h1 className="mt-3 text-2xl font-semibold">{job.title}</h1>
        <p className="mt-1 text-ink/60">
          {job.company} · {job.location}
          {job.remote ? " · Remote" : ""} · {JOB_TYPE_LABEL[job.type as JobType] ?? job.type}
        </p>
        <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <div><dt className="inline text-ink/50">Experience: </dt><dd className="inline">{job.minYears > 0 ? `${job.minYears}+ years` : "Any"}</dd></div>
          {job.salaryRange ? <div><dt className="inline text-ink/50">Salary: </dt><dd className="inline">{job.salaryRange}</dd></div> : null}
          <div><dt className="inline text-ink/50">Posted: </dt><dd className="inline">{job.createdAt.toLocaleDateString("en-IN")}</dd></div>
        </dl>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {skills.map((s) => (
            <span key={s} className={match ? (match.matchedSkills.includes(s) ? "chip-match" : "chip-missing") : "chip"}>{s}</span>
          ))}
        </div>
        <div className="mt-6 whitespace-pre-line leading-relaxed text-ink/80">{job.description}</div>
      </article>

      <aside className="space-y-4">
        {!job.open ? <p className="card text-sm text-ink/70">This job is closed to new applications.</p> : null}

        {isOwner ? (
          <div className="card space-y-3">
            <p className="text-sm">{job._count.applications} applicant{job._count.applications === 1 ? "" : "s"}</p>
            <Link href="/dashboard" className="btn w-full">Review applicants</Link>
            <form action={toggleJobOpen}>
              <input type="hidden" name="jobId" value={job.id} />
              <button className="btn-ghost w-full">{job.open ? "Close job" : "Reopen job"}</button>
            </form>
          </div>
        ) : null}

        {session?.role === "CANDIDATE" ? (
          <>
            {match ? (
              <div className="card">
                <div className="flex items-center gap-4">
                  <ScoreRing score={match.score} size={72} />
                  <div className="text-sm">
                    <p className="font-semibold">Your match</p>
                    <p className="text-ink/60">Skills {match.breakdown.skills} · Content {match.breakdown.content} · Exp {match.breakdown.experience}</p>
                  </div>
                </div>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-ink/70">
                  {match.reasons.map((r) => <li key={r}>{r}</li>)}
                </ul>
              </div>
            ) : !hasResume ? (
              <div className="card text-sm">
                <p>Upload your resume to see how well you match and to apply.</p>
                <Link href="/resume" className="btn mt-3 w-full">Upload resume</Link>
              </div>
            ) : null}

            {application ? (
              <div className="card text-sm">
                <p>You applied on {application.createdAt.toLocaleDateString("en-IN")}.</p>
                <span className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[application.status as ApplicationStatus]}`}>
                  {STATUS_LABEL[application.status as ApplicationStatus]}
                </span>
              </div>
            ) : job.open && hasResume ? (
              <div className="card"><ApplyForm jobId={job.id} /></div>
            ) : null}
          </>
        ) : null}

        {!session ? (
          <div className="card text-sm">
            <p>Sign in to see your match score and apply.</p>
            <Link href={`/login?next=/jobs/${job.id}`} className="btn mt-3 w-full">Log in</Link>
          </div>
        ) : null}
      </aside>
    </div>
  );
}

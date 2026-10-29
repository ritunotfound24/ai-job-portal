import Link from "next/link";
import { withdrawApplication } from "@/app/actions/applications";
import { JobCard } from "@/components/JobCard";
import { ScoreRing } from "@/components/ScoreRing";
import { StatusSelect } from "@/components/StatusSelect";
import { requireSession } from "@/lib/auth";
import { APPLICATION_STATUSES, STATUS_LABEL, STATUS_STYLE, type ApplicationStatus } from "@/lib/constants";
import { db, parseList } from "@/lib/db";
import { matchesForCandidate } from "@/lib/recommend";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await requireSession();
  return session.role === "RECRUITER" ? (
    <RecruiterDashboard userId={session.userId} name={session.name} />
  ) : (
    <CandidateDashboard userId={session.userId} name={session.name} />
  );
}

async function CandidateDashboard({ userId, name }: { userId: string; name: string }) {
  const [resume, applications, matches] = await Promise.all([
    db.resume.findUnique({ where: { userId }, select: { score: true, experienceYears: true, skills: true } }),
    db.application.findMany({
      where: { candidateId: userId },
      include: { job: { select: { id: true, title: true, company: true } } },
      orderBy: { updatedAt: "desc" },
    }),
    matchesForCandidate(userId),
  ]);

  const appliedIds = new Set(applications.map((a) => a.jobId));
  const recommendedIds = matches
    ? [...matches.values()].filter((m) => !appliedIds.has(m.jobId) && m.score >= 40).slice(0, 4).map((m) => m.jobId)
    : [];
  const recommendedJobs = recommendedIds.length
    ? await db.job.findMany({ where: { id: { in: recommendedIds } } })
    : [];
  recommendedJobs.sort((a, b) => recommendedIds.indexOf(a.id) - recommendedIds.indexOf(b.id));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Hi, {name.split(" ")[0]}</h1>
          <p className="text-sm text-ink/60">{applications.length} application{applications.length === 1 ? "" : "s"} in progress</p>
        </div>
        {resume ? (
          <Link href="/resume" className="card flex items-center gap-3 !p-3 hover:border-accent/40">
            <ScoreRing score={resume.score} size={48} />
            <span className="text-sm">
              Resume score<br />
              <span className="text-ink/60">{parseList(resume.skills).length} skills · ~{resume.experienceYears} yrs</span>
            </span>
          </Link>
        ) : (
          <Link href="/resume" className="btn">Upload your resume</Link>
        )}
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Application tracker</h2>
        {applications.length === 0 ? (
          <p className="card text-sm text-ink/60">You haven&apos;t applied anywhere yet. <Link href="/jobs" className="text-accent hover:underline">Find a job</Link>.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-5">
            {APPLICATION_STATUSES.map((status) => {
              const items = applications.filter((a) => a.status === status);
              return (
                <div key={status} className="rounded-xl bg-black/[0.03] p-3">
                  <h3 className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-ink/60">
                    {STATUS_LABEL[status]} <span>{items.length}</span>
                  </h3>
                  <div className="space-y-2">
                    {items.map((a) => (
                      <div key={a.id} className="rounded-lg border border-black/10 bg-white p-3 text-sm shadow-sm">
                        <Link href={`/jobs/${a.job.id}`} className="font-medium hover:underline">{a.job.title}</Link>
                        <p className="text-xs text-ink/60">{a.job.company}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-xs text-ink/50">{a.matchScore}% match</span>
                          {status === "APPLIED" ? (
                            <form action={withdrawApplication}>
                              <input type="hidden" name="applicationId" value={a.id} />
                              <button className="text-xs text-rose-600 hover:underline">Withdraw</button>
                            </form>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Recommended for you</h2>
        {!matches ? (
          <p className="card text-sm text-ink/60">Upload a resume to get personalized recommendations.</p>
        ) : recommendedJobs.length === 0 ? (
          <p className="card text-sm text-ink/60">No strong new matches right now — check back as companies post roles.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {recommendedJobs.map((job) => (
              <JobCard key={job.id} job={{ ...job, skills: parseList(job.skills) }} match={matches.get(job.id)} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

async function RecruiterDashboard({ userId, name }: { userId: string; name: string }) {
  const jobs = await db.job.findMany({
    where: { recruiterId: userId },
    orderBy: { createdAt: "desc" },
    include: {
      applications: {
        orderBy: { matchScore: "desc" },
        include: { candidate: { select: { name: true, email: true, resume: { select: { skills: true, experienceYears: true } } } } },
      },
    },
  });

  const total = jobs.reduce((n, j) => n + j.applications.length, 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Hi, {name.split(" ")[0]}</h1>
          <p className="text-sm text-ink/60">{jobs.length} job{jobs.length === 1 ? "" : "s"} · {total} applicant{total === 1 ? "" : "s"}</p>
        </div>
        <Link href="/jobs/new" className="btn">Post a job</Link>
      </div>

      {jobs.length === 0 ? (
        <p className="card text-sm text-ink/60">You haven&apos;t posted any jobs yet.</p>
      ) : (
        jobs.map((job) => {
          const required = parseList(job.skills);
          return (
            <section key={job.id} className="card">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <Link href={`/jobs/${job.id}`} className="text-lg font-semibold hover:underline">{job.title}</Link>
                  <p className="text-xs text-ink/60">
                    {job.open ? "Open" : "Closed"} · {job.applications.length} applicant{job.applications.length === 1 ? "" : "s"} · ranked by match
                  </p>
                </div>
              </div>
              {job.applications.length === 0 ? (
                <p className="text-sm text-ink/60">No applicants yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead className="text-xs uppercase tracking-wide text-ink/50">
                      <tr>
                        <th className="pb-2 font-medium">Candidate</th>
                        <th className="pb-2 font-medium">Match</th>
                        <th className="pb-2 font-medium">Skills they have</th>
                        <th className="pb-2 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5">
                      {job.applications.map((a) => {
                        const has = new Set(parseList(a.candidate.resume?.skills).map((s) => s.toLowerCase()));
                        const matched = required.filter((s) => has.has(s.toLowerCase()));
                        return (
                          <tr key={a.id} className="align-top">
                            <td className="py-3 pr-4">
                              <p className="font-medium">{a.candidate.name}</p>
                              <p className="text-xs text-ink/60">{a.candidate.email} · ~{a.candidate.resume?.experienceYears ?? 0} yrs</p>
                              {a.coverNote ? <p className="mt-1 max-w-xs text-xs italic text-ink/70">“{a.coverNote}”</p> : null}
                            </td>
                            <td className="py-3 pr-4 font-semibold">{a.matchScore}%</td>
                            <td className="py-3 pr-4">
                              <div className="flex flex-wrap gap-1">
                                {matched.length ? matched.map((s) => <span key={s} className="chip-match">{s}</span>) : <span className="text-xs text-ink/50">—</span>}
                              </div>
                            </td>
                            <td className="py-3">
                              <div className="flex flex-col items-start gap-1">
                                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[a.status as ApplicationStatus]}`}>
                                  {STATUS_LABEL[a.status as ApplicationStatus]}
                                </span>
                                <StatusSelect applicationId={a.id} status={a.status} />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          );
        })
      )}
    </div>
  );
}

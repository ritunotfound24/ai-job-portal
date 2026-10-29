import Link from "next/link";
import { ResumeForm } from "@/components/forms/ResumeForm";
import { ScoreRing } from "@/components/ScoreRing";
import { requireSession } from "@/lib/auth";
import { db, parseList } from "@/lib/db";
import { getSkill, type SkillCategory } from "@/lib/skills";

export const dynamic = "force-dynamic";

const CATEGORY_LABEL: Record<SkillCategory, string> = {
  language: "Languages",
  frontend: "Frontend",
  backend: "Backend",
  database: "Databases",
  cloud: "Cloud & DevOps",
  ml: "ML & Data",
  tooling: "Tooling",
  soft: "Soft skills",
};

export default async function ResumePage() {
  const session = await requireSession("CANDIDATE");
  const resume = await db.resume.findUnique({ where: { userId: session.userId } });

  const skills = parseList(resume?.skills);
  const feedback = parseList(resume?.feedback);
  const grouped = new Map<string, string[]>();
  for (const s of skills) {
    const label = CATEGORY_LABEL[getSkill(s)?.category ?? "tooling"];
    grouped.set(label, [...(grouped.get(label) ?? []), s]);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      <section>
        <h1 className="mb-1 text-2xl font-semibold">Your resume</h1>
        <p className="mb-6 text-sm text-ink/60">
          {resume?.fileName ? `Current file: ${resume.fileName}` : "We extract skills and experience to match you with jobs."}
        </p>
        <div className="card">
          <ResumeForm hasResume={Boolean(resume)} />
        </div>
      </section>

      <section className="space-y-4">
        {resume ? (
          <>
            <div className="card flex items-center gap-5">
              <ScoreRing score={resume.score} size={88} label="resume score" />
              <div>
                <p className="text-lg font-semibold">{skills.length} skills · ~{resume.experienceYears} yrs experience</p>
                <p className="text-sm text-ink/60">Last analyzed {resume.updatedAt.toLocaleString("en-IN")}</p>
                <Link href="/jobs" className="mt-2 inline-block text-sm text-accent hover:underline">See your matches →</Link>
              </div>
            </div>

            {resume.summary ? (
              <div className="card">
                <h2 className="mb-2 font-semibold">AI summary</h2>
                <p className="text-sm leading-relaxed text-ink/80">{resume.summary}</p>
              </div>
            ) : null}

            <div className="card">
              <h2 className="mb-3 font-semibold">Detected skills</h2>
              {skills.length === 0 ? (
                <p className="text-sm text-ink/60">No known skills detected yet.</p>
              ) : (
                <dl className="space-y-2">
                  {[...grouped.entries()].map(([label, list]) => (
                    <div key={label} className="flex flex-wrap items-center gap-1.5">
                      <dt className="w-32 text-xs font-medium uppercase tracking-wide text-ink/50">{label}</dt>
                      {list.map((s) => <dd key={s} className="chip-match">{s}</dd>)}
                    </div>
                  ))}
                </dl>
              )}
            </div>

            <div className="card">
              <h2 className="mb-3 font-semibold">How to improve</h2>
              <ul className="list-disc space-y-1.5 pl-5 text-sm text-ink/80">
                {feedback.map((f) => <li key={f}>{f}</li>)}
              </ul>
            </div>
          </>
        ) : (
          <div className="card text-sm text-ink/60">Your analysis will appear here after you upload.</div>
        )}
      </section>
    </div>
  );
}

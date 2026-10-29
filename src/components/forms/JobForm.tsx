"use client";

import { useFormState } from "react-dom";
import { createJob } from "@/app/actions/jobs";
import { initialFormState } from "@/app/actions/types";
import { JOB_TYPES, JOB_TYPE_LABEL } from "@/lib/constants";
import { FormMessage } from "../FormMessage";
import { SubmitButton } from "../SubmitButton";

export function JobForm() {
  const [state, action] = useFormState(createJob, initialFormState);
  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="label" htmlFor="title">Job title</label>
        <input className="input" id="title" name="title" placeholder="Backend Engineer Intern" required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="location">Location</label>
          <input className="input" id="location" name="location" placeholder="Bengaluru" required />
        </div>
        <div>
          <label className="label" htmlFor="type">Type</label>
          <select className="input" id="type" name="type" defaultValue="FULL_TIME">
            {JOB_TYPES.map((t) => (
              <option key={t} value={t}>{JOB_TYPE_LABEL[t]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="minYears">Minimum experience (years)</label>
          <input className="input" id="minYears" name="minYears" type="number" min={0} max={30} step={0.5} defaultValue={0} />
        </div>
        <div>
          <label className="label" htmlFor="salaryRange">Salary range (optional)</label>
          <input className="input" id="salaryRange" name="salaryRange" placeholder="₹6–10 LPA" />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="remote" className="h-4 w-4 accent-[#2f5d50]" /> Remote-friendly
      </label>
      <div>
        <label className="label" htmlFor="skills">Required skills (comma separated)</label>
        <input className="input" id="skills" name="skills" placeholder="Node.js, PostgreSQL, Docker" />
        <p className="mt-1 text-xs text-ink/50">Leave empty to detect skills from the description automatically.</p>
      </div>
      <div>
        <label className="label" htmlFor="description">Description</label>
        <textarea className="input" id="description" name="description" rows={8} required />
      </div>
      <FormMessage state={state} />
      <SubmitButton pendingText="Publishing…">Publish job</SubmitButton>
    </form>
  );
}

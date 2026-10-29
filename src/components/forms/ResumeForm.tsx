"use client";

import { useFormState } from "react-dom";
import { saveResume } from "@/app/actions/resume";
import { initialFormState } from "@/app/actions/types";
import { FormMessage } from "../FormMessage";
import { SubmitButton } from "../SubmitButton";

export function ResumeForm({ hasResume }: { hasResume: boolean }) {
  const [state, action] = useFormState(saveResume, initialFormState);
  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="label" htmlFor="file">Upload resume (PDF or .txt, max 4 MB)</label>
        <input
          id="file"
          name="file"
          type="file"
          accept=".pdf,.txt,application/pdf,text/plain"
          className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-accent-light file:px-3 file:py-2 file:text-sm file:font-medium file:text-accent"
        />
      </div>
      <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-ink/40">
        <span className="h-px flex-1 bg-black/10" /> or paste text <span className="h-px flex-1 bg-black/10" />
      </div>
      <textarea name="text" rows={7} className="input font-mono text-xs" placeholder="Paste your resume text here…" />
      <FormMessage state={state} />
      <SubmitButton pendingText="Analyzing…">{hasResume ? "Re-analyze resume" : "Analyze resume"}</SubmitButton>
    </form>
  );
}

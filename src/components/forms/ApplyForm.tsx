"use client";

import { useFormState } from "react-dom";
import { applyToJob } from "@/app/actions/applications";
import { initialFormState } from "@/app/actions/types";
import { FormMessage } from "../FormMessage";
import { SubmitButton } from "../SubmitButton";

export function ApplyForm({ jobId }: { jobId: string }) {
  const [state, action] = useFormState(applyToJob, initialFormState);
  if (state.success) return <FormMessage state={state} />;

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="jobId" value={jobId} />
      <label className="label" htmlFor="coverNote">Short note to the recruiter (optional)</label>
      <textarea className="input" id="coverNote" name="coverNote" rows={4} maxLength={2000} />
      <FormMessage state={state} />
      <SubmitButton pendingText="Sending…">Apply now</SubmitButton>
    </form>
  );
}

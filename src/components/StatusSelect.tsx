"use client";

import { updateApplicationStatus } from "@/app/actions/applications";
import { APPLICATION_STATUSES, STATUS_LABEL, type ApplicationStatus } from "@/lib/constants";

/** Recruiter-side status dropdown; submits as soon as the value changes. */
export function StatusSelect({ applicationId, status }: { applicationId: string; status: string }) {
  return (
    <form action={updateApplicationStatus}>
      <input type="hidden" name="applicationId" value={applicationId} />
      <select
        name="status"
        defaultValue={status}
        className="rounded-md border border-black/15 bg-white px-2 py-1 text-xs"
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        aria-label="Application status"
      >
        {APPLICATION_STATUSES.map((s: ApplicationStatus) => (
          <option key={s} value={s}>{STATUS_LABEL[s]}</option>
        ))}
      </select>
    </form>
  );
}

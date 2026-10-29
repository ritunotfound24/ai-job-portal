export const ROLES = ["CANDIDATE", "RECRUITER"] as const;
export type Role = (typeof ROLES)[number];

export const JOB_TYPES = ["FULL_TIME", "INTERNSHIP", "CONTRACT", "PART_TIME"] as const;
export type JobType = (typeof JOB_TYPES)[number];

export const JOB_TYPE_LABEL: Record<JobType, string> = {
  FULL_TIME: "Full-time",
  INTERNSHIP: "Internship",
  CONTRACT: "Contract",
  PART_TIME: "Part-time",
};

export const APPLICATION_STATUSES = ["APPLIED", "SCREENING", "INTERVIEW", "OFFER", "REJECTED"] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const STATUS_LABEL: Record<ApplicationStatus, string> = {
  APPLIED: "Applied",
  SCREENING: "Screening",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  REJECTED: "Rejected",
};

export const STATUS_STYLE: Record<ApplicationStatus, string> = {
  APPLIED: "bg-slate-100 text-slate-700",
  SCREENING: "bg-amber-100 text-amber-800",
  INTERVIEW: "bg-sky-100 text-sky-800",
  OFFER: "bg-emerald-100 text-emerald-800",
  REJECTED: "bg-rose-100 text-rose-700",
};

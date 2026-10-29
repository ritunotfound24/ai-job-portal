import { JobForm } from "@/components/forms/JobForm";
import { requireSession } from "@/lib/auth";

export default async function NewJobPage() {
  await requireSession("RECRUITER");
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-semibold">Post a job</h1>
      <div className="card">
        <JobForm />
      </div>
    </div>
  );
}

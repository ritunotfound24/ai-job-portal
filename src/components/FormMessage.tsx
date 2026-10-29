import type { FormState } from "@/app/actions/types";

export function FormMessage({ state }: { state: FormState }) {
  if (state.error) {
    return (
      <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
        {state.error}
      </p>
    );
  }
  if (state.success) {
    return (
      <p role="status" className="rounded-lg bg-accent-light px-3 py-2 text-sm text-accent">
        {state.success}
      </p>
    );
  }
  return null;
}

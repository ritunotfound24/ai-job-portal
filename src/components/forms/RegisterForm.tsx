"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { register } from "@/app/actions/auth";
import { initialFormState } from "@/app/actions/types";
import { FormMessage } from "../FormMessage";
import { SubmitButton } from "../SubmitButton";

export function RegisterForm() {
  const [state, action] = useFormState(register, initialFormState);
  const [role, setRole] = useState<"CANDIDATE" | "RECRUITER">("CANDIDATE");

  return (
    <form action={action} className="space-y-4">
      <fieldset>
        <legend className="label">I am…</legend>
        <div className="grid grid-cols-2 gap-2">
          {(["CANDIDATE", "RECRUITER"] as const).map((r) => (
            <label
              key={r}
              className={`cursor-pointer rounded-lg border px-3 py-2 text-center text-sm ${
                role === r ? "border-accent bg-accent-light font-medium text-accent" : "border-black/15 bg-white"
              }`}
            >
              <input type="radio" name="role" value={r} checked={role === r} onChange={() => setRole(r)} className="sr-only" />
              {r === "CANDIDATE" ? "Looking for a job" : "Hiring"}
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <label className="label" htmlFor="name">Full name</label>
        <input className="input" id="name" name="name" autoComplete="name" required />
      </div>
      {role === "RECRUITER" ? (
        <div>
          <label className="label" htmlFor="company">Company</label>
          <input className="input" id="company" name="company" autoComplete="organization" required />
        </div>
      ) : null}
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input className="input" id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div>
        <label className="label" htmlFor="password">Password</label>
        <input className="input" id="password" name="password" type="password" minLength={8} autoComplete="new-password" required />
      </div>
      <FormMessage state={state} />
      <SubmitButton pendingText="Creating account…">Create account</SubmitButton>
    </form>
  );
}

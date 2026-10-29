"use client";

import { useFormState } from "react-dom";
import { login } from "@/app/actions/auth";
import { initialFormState } from "@/app/actions/types";
import { FormMessage } from "../FormMessage";
import { SubmitButton } from "../SubmitButton";

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useFormState(login, initialFormState);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next ?? ""} />
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input className="input" id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div>
        <label className="label" htmlFor="password">Password</label>
        <input className="input" id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      <FormMessage state={state} />
      <SubmitButton pendingText="Signing in…">Log in</SubmitButton>
    </form>
  );
}

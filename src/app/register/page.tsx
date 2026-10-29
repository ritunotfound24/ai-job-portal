import Link from "next/link";
import { RegisterForm } from "@/components/forms/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-6 text-2xl font-semibold">Create your account</h1>
      <div className="card">
        <RegisterForm />
      </div>
      <p className="mt-4 text-center text-sm text-ink/60">
        Already have an account? <Link href="/login" className="text-accent hover:underline">Log in</Link>
      </p>
    </div>
  );
}

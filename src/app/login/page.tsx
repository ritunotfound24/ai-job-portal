import Link from "next/link";
import { LoginForm } from "@/components/forms/LoginForm";

export default function LoginPage({ searchParams }: { searchParams: { next?: string } }) {
  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-6 text-2xl font-semibold">Welcome back</h1>
      <div className="card">
        <LoginForm next={searchParams.next} />
      </div>
      <p className="mt-4 text-center text-sm text-ink/60">
        New here? <Link href="/register" className="text-accent hover:underline">Create an account</Link>
      </p>
    </div>
  );
}

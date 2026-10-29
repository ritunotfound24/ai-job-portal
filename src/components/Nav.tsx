import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { getSession } from "@/lib/auth";

export async function Nav() {
  const session = await getSession();

  return (
    <header className="border-b border-black/10 bg-white/80 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Hire<span className="text-accent">Match</span>
        </Link>

        <div className="flex items-center gap-1 text-sm sm:gap-3">
          <Link href="/jobs" className="rounded-md px-2 py-1 hover:bg-black/5">
            Jobs
          </Link>
          {session ? (
            <>
              {session.role === "CANDIDATE" ? (
                <Link href="/resume" className="rounded-md px-2 py-1 hover:bg-black/5">
                  Resume
                </Link>
              ) : (
                <Link href="/jobs/new" className="rounded-md px-2 py-1 hover:bg-black/5">
                  Post a job
                </Link>
              )}
              <Link href="/dashboard" className="rounded-md px-2 py-1 hover:bg-black/5">
                Dashboard
              </Link>
              <form action={logout}>
                <button className="rounded-md px-2 py-1 text-ink/60 hover:bg-black/5">Log out</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="rounded-md px-2 py-1 hover:bg-black/5">
                Log in
              </Link>
              <Link href="/register" className="btn">
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

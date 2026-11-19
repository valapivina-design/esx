import Link from "next/link";
import { AuthShell } from "@/components/marketing/auth-shell";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { safeNextPath } from "@/lib/auth/paths";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; registered?: string; reset?: string; next?: string }>;
}) {
  const { error, registered, reset, next: nextRaw } = await searchParams;
  const next = safeNextPath(nextRaw);
  return (
    <AuthShell title="Log in" subtitle="Access your buyer or seller dashboard.">
      {registered && (
        <div className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Account created. You can log in now.
        </div>
      )}
      {reset && (
        <div className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Password updated. Log in with your new password.
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}
      <form action="/api/auth/signin" method="post" className="space-y-4">
        <input type="hidden" name="next" value={next} />
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required placeholder="you@example.com" />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" required placeholder="••••••••" />
        </div>
        <Button type="submit" className="w-full">Log in</Button>
      </form>
      <div className="mt-4 flex justify-between text-sm">
        <Link href="/forgot-password" className="text-navy hover:underline">Forgot password?</Link>
        <Link href={`/register?next=${encodeURIComponent(next)}`} className="text-navy hover:underline">Create account</Link>
      </div>
    </AuthShell>
  );
}

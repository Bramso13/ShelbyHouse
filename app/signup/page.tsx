import { AuthForm } from "@/components/auth-form";
import { safeNext } from "@/lib/dates";
import { requestOrigin } from "@/lib/origin";

export const metadata = { title: "Inscription" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  return <AuthForm mode="signup" next={safeNext(params.next)} origin={await requestOrigin()} />;
}

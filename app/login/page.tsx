import { AuthForm } from "@/components/auth-form";
import { safeNext } from "@/lib/dates";
import { requestOrigin } from "@/lib/origin";

export const metadata = { title: "Connexion" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  return <AuthForm mode="login" next={safeNext(params.next)} origin={await requestOrigin()} />;
}

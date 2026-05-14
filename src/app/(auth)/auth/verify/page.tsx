import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { consumeMagicToken } from "@/lib/auth/magic-link";
import { signJWT } from "@/lib/auth/jwt";
import { getSessionCookieOptions } from "@/lib/auth/session";

interface Props {
  searchParams: Promise<{ token?: string }>;
}

export default async function VerifyPage({ searchParams }: Props) {
  const { token } = await searchParams;

  if (!token) redirect("/login");

  const result = await consumeMagicToken(token);
  if (!result) {
    redirect("/login?error=expired");
  }

  const jwt = await signJWT({
    customerId: result.customerId,
    email: result.email,
  });
  const cookieOptions = getSessionCookieOptions();
  const cookieStore = await cookies();
  cookieStore.set(cookieOptions.name, jwt, cookieOptions);

  redirect("/dashboard");
}

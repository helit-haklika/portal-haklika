import { redirect } from "next/navigation";

interface Props {
  searchParams: Promise<{ token?: string }>;
}

export default async function VerifyPage({ searchParams }: Props) {
  const { token } = await searchParams;
  if (token) {
    redirect(`/api/auth/verify?token=${token}`);
  }
  redirect("/login");
}

import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminMagicLinkVerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    redirect("/admin/login?error=expired");
  }

  const consumeUrl =
    `/admin/login/verify/consume?token=${encodeURIComponent(token)}` as const;
  redirect(consumeUrl as never);
}

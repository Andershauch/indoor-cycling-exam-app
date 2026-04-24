import { NextResponse } from "next/server";

import { consumeAdminMagicLink } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/admin/login?error=expired", url));
  }

  const adminUser = await consumeAdminMagicLink(token);

  if (!adminUser) {
    return NextResponse.redirect(new URL("/admin/login?error=expired", url));
  }

  return NextResponse.redirect(new URL("/admin", url));
}

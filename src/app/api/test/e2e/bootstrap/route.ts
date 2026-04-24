import { NextResponse } from "next/server";

import { assertE2EAccess, ensureE2EAdminSession } from "@/lib/e2e/auth";
import { ensureE2EExamSet, resetE2EInvitations } from "@/lib/e2e/seed";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      secret?: string;
      reset?: boolean;
    };

    assertE2EAccess(body.secret ?? null);
    const adminUser = await ensureE2EAdminSession();
    await ensureE2EExamSet(adminUser.id);

    if (body.reset) {
      await resetE2EInvitations();
    }

    return NextResponse.json({
      ok: true,
      adminEmail: adminUser.email,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Kunne ikke bootstrappe e2e-flow.",
      },
      { status: 400 },
    );
  }
}

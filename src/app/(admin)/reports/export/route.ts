import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/auth";
import { buildAdminReportsCsv } from "@/lib/admin/data";

export async function GET(request: Request) {
  await requireAdminSession();

  const { searchParams } = new URL(request.url);
  const csv = await buildAdminReportsCsv({
    examSessionId: searchParams.get("examSessionId") ?? undefined,
    query: searchParams.get("query") ?? undefined,
    outcome:
      (searchParams.get("outcome") as "all" | "passed" | "failed" | null) ?? undefined,
    status:
      (searchParams.get("status") as
        | "all"
        | "submitted"
        | "auto_submitted"
        | "in_progress"
        | null) ?? undefined,
  });

  if (!csv) {
    return new NextResponse("Ingen aktiv prøve.", { status: 404 });
  }

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="rapport-forsog.csv"',
      "Cache-Control": "no-store",
    },
  });
}

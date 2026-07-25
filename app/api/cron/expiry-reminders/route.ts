import { NextRequest, NextResponse } from "next/server";

import { env } from "@/env";
import { sendExpiryReminders } from "@/lib/expiry-reminders";

// Plain bearer-token-authenticated HTTP endpoint — deliberately has no
// dependency on any specific host or scheduler. Trigger it however suits
// your deployment:
//   - Vercel: vercel.json's "crons" entry calls this automatically and
//     sends `Authorization: Bearer $CRON_SECRET` for you.
//   - Anywhere else: .github/workflows/expiry-reminders-cron.yml hits this
//     URL on a schedule via GitHub Actions (works regardless of host), or
//     point any scheduler you already run (crontab + curl, a Kubernetes
//     CronJob, Render/Railway's own cron, cron-job.org, etc.) at
//     `GET /api/cron/expiry-reminders` with the same header.
// Whichever trigger you use, requests without the correct bearer token are
// rejected — this can't be used to mass-email on demand by a random caller.
export async function GET(request: NextRequest) {
  if (!env.CRON_SECRET) {
    return NextResponse.json(
      { message: "Cron not configured" },
      { status: 500 },
    );
  }

  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await sendExpiryReminders();

  return NextResponse.json({ success: true });
}

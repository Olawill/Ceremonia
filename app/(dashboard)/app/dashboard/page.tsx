import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import Link from "next/link";

import { db } from "@/db";
import { weddings } from "@/db/schema";
import { SparklesIcon } from "lucide-react";

export default async function DashboardPage() {
  const { userId } = await auth();

  // Direct DB read in server component — no fetch, no loading state
  const myWeddings = userId
    ? await db.select().from(weddings).where(eq(weddings.userId, userId))
    : [];

  return (
    <div className="w-full">
      <div className="mb-10 space-y-2">
        <p
          className="font-label text-sm font-bold tracking-[0.5em] uppercase"
          style={{ color: "#D4AF3770" }}
        >
          Dashboard
        </p>
        <h1
          className="font-display font-light"
          style={{ fontSize: "clamp(28px,4vw,42px)", letterSpacing: "0.04em" }}
        >
          Your Weddings
        </h1>
      </div>

      {myWeddings.length === 0 ? (
        <div className="rounded-2xl p-16! text-center border border-[#D4AF3720] bg-[#D4AF3706] space-y-4!">
          <p className="font-display italic font-semibold text-2xl mb-6 text-[#F5F0E8]">
            No weddings yet
          </p>
          <Link
            href="/app/editor/new"
            className="font-label text-sm tracking-[0.4em] font-semibold h-12 uppercase px-8! py-3! rounded-full border transition-all border-[#D4AF3760] text-[#D4AF37] flex items-center! justify-center! w-full"
          >
            <span className="flex items-center gap-2 w-fit">
              <SparklesIcon className="size-4" /> Create Your First Wedding
            </span>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {myWeddings.map((w) => (
            <Link
              key={w.id}
              href={`/app/editor/${w.slug}`}
              className="rounded-2xl p-8 border transition-all hover:border-[#D4AF3740] group"
              style={{ borderColor: "#D4AF3718", background: "#D4AF3705" }}
            >
              <p
                className="font-display font-light mb-1"
                style={{ fontSize: "clamp(18px,2.5vw,24px)", color: "#F5F0E8" }}
              >
                {w.bride} <span style={{ color: "#D4AF37" }}>&</span> {w.groom}
              </p>
              <p
                className="font-label text-xs tracking-widest mb-4"
                style={{ color: "#D4AF3760" }}
              >
                {w.slug}.ceremonia.app
              </p>
              <div className="flex gap-3">
                <span
                  className="font-label text-[10px] tracking-widest uppercase px-3 py-1 rounded-full"
                  style={{
                    background: w.published ? "#D4AF3715" : "#ffffff08",
                    color: w.published ? "#D4AF37" : "#F5F0E840",
                    border: `1px solid ${w.published ? "#D4AF3730" : "#ffffff10"}`,
                  }}
                >
                  {w.published ? "Live" : "Draft"}
                </span>
                <span
                  className="font-label text-[10px] tracking-widest uppercase px-3 py-1 rounded-full"
                  style={{
                    background: "#ffffff08",
                    color: "#F5F0E840",
                    border: "1px solid #ffffff10",
                  }}
                >
                  {w.viewCount ?? 0} views
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {myWeddings.length > 0 && (
        <Link
          href="/app/editor/new"
          className="inline-flex items-center gap-2 mt-8! font-label text-xs
                  tracking-[0.4em] uppercase transition-all rounded-lg border-[#D4AF3760] text-[#D4AF37]"
        >
          <span className="flex items-center gap-2 w-fit">
            <SparklesIcon className="size-4" /> Add another wedding
          </span>
        </Link>
      )}
    </div>
  );
}

import { eq } from "drizzle-orm";
import { SparklesIcon } from "lucide-react";
import Link from "next/link";

import { db } from "@/db";
import { customThemes } from "@/db/schema";

export default async function ThemeMarketplacePage() {
  const publicThemes = await db
    .select({
      id: customThemes.id,
      name: customThemes.name,
      theme: customThemes.theme,
      userId: customThemes.userId,
    })
    .from(customThemes)
    .where(eq(customThemes.isPublic, true));

  return (
    <div className="min-h-screen bg-dash-bg text-[#F5F0E8] px-8 py-16 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-12">
        <div>
          <p className="font-label text-[11px] tracking-[0.5em] uppercase text-[#D4AF3780] mb-2">
            Community
          </p>
          <h1 className="font-display font-light text-[clamp(32px,5vw,56px)]">
            Theme Marketplace
          </h1>
        </div>
        <Link
          href="/app/dashboard"
          className="font-label text-[11px] tracking-[0.3em] uppercase px-5 py-2.5 rounded-full border border-[#D4AF3740] text-[#D4AF37] hover:bg-[#D4AF3710] transition-colors"
        >
          Dashboard
        </Link>
      </div>

      {publicThemes.length === 0 ? (
        <div className="text-center py-32">
          <SparklesIcon className="size-8 text-[#D4AF3740] mx-auto mb-4" />
          <p className="font-display italic text-xl text-[#F5F0E860]">
            No public themes yet — be the first to share one.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {publicThemes.map((t) => {
            const theme = t.theme as any;
            return (
              <div
                key={t.id}
                className="rounded-2xl border border-[#D4AF3720] bg-[#D4AF3703] p-6 space-y-4"
              >
                {/* Color swatches */}
                <div className="flex gap-2">
                  {[theme.curtain, theme.gold, theme.bg, theme.text].map(
                    (c: string) => (
                      <div
                        key={c}
                        className="w-8 h-8 rounded-full border border-white/10"
                        style={{ background: c }}
                      />
                    ),
                  )}
                </div>
                <p className="font-display italic text-lg text-[#F5F0E8]">
                  {t.name}
                </p>
                <Link
                  href={`/app/editor?applyTheme=${t.id}`}
                  className="block text-center font-label text-[10px] tracking-[0.3em] uppercase py-2.5 rounded-xl border border-[#D4AF3730] text-[#D4AF3780] hover:text-[#D4AF37] hover:border-[#D4AF3750] transition-colors"
                >
                  Apply to my wedding
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

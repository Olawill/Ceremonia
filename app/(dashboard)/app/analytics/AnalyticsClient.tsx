"use client";

interface Wedding {
  id: string;
  bride: string;
  groom: string;
  slug: string;
  viewCount: number | null;
  published: boolean | null;
  createdAt: Date | null;
}

interface RSVP {
  weddingId: string | null;
  attendance: string;
  guests: number | null;
}

interface Props {
  weddings: Wedding[];
  rsvps: RSVP[];
}

export function AnalyticsClient({ weddings, rsvps }: Props) {
  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8!">
      <div>
        <h1 className="text-[clamp(28px,4vw,42px)] font-display font-light text-[#F5F0E8]">
          Analytics
        </h1>
        <p className="text-lg font-semibold font-display italic text-[#F5F0E880] mt-1">
          Views and RSVP performance across your weddings
        </p>
      </div>

      <div className="space-y-4!">
        {weddings.length === 0 && (
          <div className="text-center py-20! rounded-xl border border-[#ffffff80]">
            <p className="font-display font-semibold text-2xl text-[#F5F0E880]">
              No weddings yet
            </p>
          </div>
        )}

        {weddings.map((w) => {
          const wRsvps = rsvps.filter((r) => r.weddingId === w.id);
          const attending = wRsvps.filter((r) => r.attendance === "yes");
          const totalGuests = attending.reduce(
            (s, r) => s + (r.guests ?? 1),
            0,
          );

          return (
            <div
              key={w.id}
              className="rounded-xl border border-[#D4AF3720] bg-[#D4AF3705] p-6"
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="font-display text-lg text-[#F5F0E8]">
                    {w.bride} & {w.groom}
                  </h2>
                  <p className="font-label text-[10px] tracking-[0.3em] uppercase text-[#D4AF3780] mt-1">
                    {w.slug}.ceremonia.app
                  </p>
                </div>
                <span
                  className={`font-label text-[10px] tracking-[0.3em] uppercase px-2 py-1 rounded-full ${
                    w.published
                      ? "bg-[#D4AF3720] text-[#D4AF37]"
                      : "bg-[#ffffff10] text-[#F5F0E860]"
                  }`}
                >
                  {w.published ? "Published" : "Draft"}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: "Page Views", value: w.viewCount ?? 0 },
                  { label: "RSVPs", value: wRsvps.length },
                  { label: "Attending", value: attending.length },
                  { label: "Total Guests", value: totalGuests },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <p className="font-display text-3xl font-light text-[#F5F0E8]">
                      {stat.value}
                    </p>
                    <p className="font-label text-[10px] tracking-[0.3em] uppercase text-[#D4AF3780] mt-1">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { formattedDate } from "@/lib/helper";

interface Props {
  expiresAt: Date;
}

export function EventExpiredPage({ expiresAt }: Props) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 bg-[#0a0a0a]">
      <p className="font-label text-[11px] tracking-[0.5em] uppercase text-[#D4AF37]/60 mb-4">
        This invitation has expired
      </p>
      <h1 className="font-display font-light text-[clamp(32px,5vw,56px)] text-[#F5F0E8] mb-4 max-w-lg">
        This event page is no longer active
      </h1>
      <p className="font-display italic text-[#F5F0E8]/50 text-lg max-w-md mb-8">
        This invitation was hosted with a one-time plan that expired on{" "}
        {formattedDate(expiresAt)}. The event organiser can reactivate it by
        upgrading to a monthly plan.
      </p>
      <a
        href="https://ceremonia.app"
        className="font-label text-[11px] tracking-[0.4em] uppercase px-6 py-3 rounded-full border border-[#D4AF3740] text-[#D4AF37]/70 hover:border-[#D4AF37] hover:text-[#D4AF37] transition-colors"
      >
        Create your own invitation
      </a>
    </div>
  );
}

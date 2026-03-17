import { auth } from "@clerk/nextjs/server";
import { SparklesIcon } from "lucide-react";
import Link from "next/link";

const MarketingLayout = async ({ children }: { children: React.ReactNode }) => {
  const { userId } = await auth();

  return (
    <div className="min-h-screen bg-dash-bg">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8! py-5! border-b border-[#D4AF37] bg-dash-bg/90 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-2">
          <SparklesIcon className="size-4 text-[#D4AF37]" />
          <span className="font-label font-bold text-[14px] tracking-[0.4em] uppercase text-[#D4AF37]">
            Ceremonia
          </span>
        </Link>
        <div className="flex items-center gap-4">
          {userId ? (
            <Link
              href="/app/dashboard"
              className="font-label font-bold text-[11px] tracking-[0.3em] uppercase px-5! py-2.5! rounded-full border border-[#D4AF3770] text-[#D4AF37] hover:bg-[#D4AF3710] transition-colors"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="hidden md:inline-flex font-label font-bold text-[11px] tracking-[0.3em] uppercase text-[#F5F0E890] hover:text-[#F5F0E8] transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="font-label font-bold text-[11px] tracking-[0.3em] uppercase px-5! py-2.5! rounded-full border border-[#D4AF3770] text-[#D4AF37] hover:bg-[#D4AF3710] transition-colors"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </nav>
      {children}

      {/* Footer */}
      <footer className="border-t border-[#D4AF3720] px-8! py-8! flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <SparklesIcon className="size-3.5 text-[#D4AF37]" />
          <span className="font-label font-bold text-[14px] tracking-[0.4em] uppercase text-[#D4AF37]">
            Ceremonia
          </span>
        </div>
        <p className="font-display italic text-base text-[#F5F0E860]">
          © {new Date().getFullYear()} Ceremonia. All rights reserved.
        </p>
        <div className="flex items-center gap-6">
          <Link
            href="/privacy"
            className="font-label text-[11px] font-semibold tracking-[0.3em] uppercase text-[#F5F0E890] hover:text-[#D4AF37] transition-colors"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="font-label text-[11px] font-semibold tracking-[0.3em] uppercase text-[#F5F0E890] hover:text-[#D4AF37] transition-colors"
          >
            Terms
          </Link>
          <Link
            href="/themes"
            className="font-label text-[11px] font-semibold tracking-[0.3em] uppercase text-[#F5F0E890] hover:text-[#D4AF37] transition-colors"
          >
            Themes
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default MarketingLayout;

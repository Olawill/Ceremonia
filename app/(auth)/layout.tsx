import { Cinzel, Cormorant_Garamond } from "next/font/google";

const cormorant = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["300", "400", "600"],
  style: ["normal", "italic"],
});

const cinzel = Cinzel({
  variable: "--font-label",
  subsets: ["latin"],
  weight: ["400", "600"],
});

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${cormorant.variable} ${cinzel.variable} min-h-screen grid lg:grid-cols-2`}
      style={{ background: "#0A0A0A" }}
    >
      {/* Left panel — branding */}
      <div
        className="hidden lg:flex flex-col justify-between items-center p-16 relative overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #3D0610 0%, #0A0A0A 60%)",
          borderRight: "1px solid #D4AF3720",
          paddingBlock: "48px",
        }}
      >
        {/* Subtle noise texture overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-5"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 80%, #D4AF37 0%, transparent 50%),
                              radial-gradient(circle at 80% 20%, #6A0D17 0%, transparent 50%)`,
          }}
        />

        {/* Logo */}
        <div className="relative z-10">
          <p
            className="font-label font-bold text-3xl tracking-[0.5em] uppercase"
            style={{ color: "#D4AF3780" }}
          >
            ✦ Ceremonia
          </p>
        </div>

        {/* Centre copy */}
        <div className="relative z-10 space-y-8 flex-1 flex flex-col justify-center">
          <div
            className="w-12 h-px"
            style={{
              background: "linear-gradient(90deg, #D4AF37, transparent)",
            }}
          />
          <h1
            className="font-display font-light leading-tight"
            style={{
              fontSize: "clamp(36px, 4vw, 56px)",
              color: "#F5F0E8",
              letterSpacing: "0.04em",
            }}
          >
            Beautiful event
            <br />
            <span style={{ color: "#D4AF37", fontStyle: "italic" }}>
              invitations,
            </span>
            <br />
            hosted forever.
          </h1>
          <p
            className="font-display italic text-xl leading-relaxed max-w-xs"
            style={{ color: "#F5F0E880", marginBottom: "12px" }}
          >
            Create a cinematic, personalised invitation your guests will never
            forget — in minutes.
          </p>

          {/* Feature list */}
          <ul className="flex flex-col gap-4">
            {[
              "Velvet curtain reveal experience",
              "Live theme & colour customisation",
              "RSVP management & email notifications",
              "Your own subdomain — forever",
            ].map((feat) => (
              <li
                key={feat}
                className="flex items-center gap-3 font-label text-xs tracking-widest"
                style={{ color: "#D4AF3790" }}
              >
                <span style={{ color: "#D4AF37" }}>◈</span>
                {feat.toUpperCase()}
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom quote */}
        <p
          className="relative z-10 font-display italic text-xl font-bold"
          style={{ color: "#babad3" }}
        >
          &ldquo;The finest invitation is the one that feels like a glimpse of
          the day itself.&rdquo;
        </p>
      </div>

      {/* Right panel — auth form */}
      <div className="flex items-center justify-center p-8">
        {/* Mobile logo */}
        <div className="absolute top-40 left-6 lg:hidden w-full">
          <p
            className="font-label text-2xl tracking-[0.5em] text-center uppercase"
            style={{ color: "#D4AF3780" }}
          >
            ✦ Ceremonia
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}

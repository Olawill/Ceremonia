import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Ceremonia",
  description:
    "How Ceremonia collects, uses, and protects your personal data. Read our full privacy policy.",
  openGraph: {
    title: "Privacy Policy — Ceremonia",
    description:
      "How Ceremonia collects, uses, and protects your personal data.",
    url: "https://ceremonia.app/privacy",
    type: "website",
  },
  robots: { index: true, follow: false },
};

const LAST_UPDATED = "16 March 2026";

export default function PrivacyPage() {
  return (
    <main className="w-full text-[#F5F0E8] max-w-6xl mx-auto px-8! pt-36! pb-24!">
      <p className="font-label text-[11px] font-bold tracking-[0.5em] uppercase text-[#D4AF3790] mb-4!">
        Legal
      </p>
      <h1 className="font-display font-light text-[clamp(36px,5vw,60px)] leading-tight mb-3!">
        Privacy Policy
      </h1>
      <p className="font-label text-[11px] font-semibold tracking-[0.3em] uppercase text-[#F5F0E890] mb-16!">
        Last updated: {LAST_UPDATED}
      </p>

      <div className="space-y-12! font-display text-[#F5F0E8CC] text-[17px] leading-relaxed">
        <section>
          <h2 className="font-label font-bold text-[12px] tracking-[0.4em] uppercase text-[#D4AF37] mb-4!">
            1. Who we are
          </h2>
          <p>
            Ceremonia ("we", "us", "our") is a event invitation SaaS platform
            operated by Ceremonia Inc. Our registered address is available on
            request. You can reach us at{" "}
            <a
              href="mailto:privacy@ceremonia.app"
              className="text-[#D4AF37] hover:underline"
            >
              privacy@ceremonia.app
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="font-label font-bold text-[12px] tracking-[0.4em] uppercase text-[#D4AF37] mb-4!">
            2. Data we collect
          </h2>
          <p className="mb-4!">
            We collect information you provide directly and information
            generated as you use our service:
          </p>
          <ul className="list-disc list-inside space-y-2! text-[#F5F0E8AA]">
            <li>
              <strong className="text-[#F5F0E8]">Account data</strong> — name,
              email address, and authentication credentials managed by Clerk.
            </li>
            <li>
              <strong className="text-[#F5F0E8]">Event data</strong> — names,
              dates, venues, photos, audio, and any other content you add to
              your invitation.
            </li>
            <li>
              <strong className="text-[#F5F0E8]">RSVP data</strong> — guest
              names, attendance responses, dietary requirements, and messages
              submitted through your invitation.
            </li>
            <li>
              <strong className="text-[#F5F0E8]">Payment data</strong> — billing
              details are processed by Stripe and never stored on our servers.
            </li>
            <li>
              <strong className="text-[#F5F0E8]">Usage data</strong> — page
              views, invitation view counts, and feature interactions collected
              via PostHog.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-label font-bold text-[12px] tracking-[0.4em] uppercase text-[#D4AF37] mb-4!">
            3. How we use your data
          </h2>
          <ul className="list-disc list-inside space-y-2! text-[#F5F0E8AA]">
            <li>To provide, operate, and improve the Ceremonia platform.</li>
            <li>To send RSVP notification emails to couples via Resend.</li>
            <li>
              To process payments and manage your subscription through Stripe.
            </li>
            <li>To respond to support requests and account enquiries.</li>
            <li>To detect and prevent fraud or abuse.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-label font-bold text-[12px] tracking-[0.4em] uppercase text-[#D4AF37] mb-4!">
            4. Third-party services
          </h2>
          <p className="mb-4!">
            We use the following third-party sub-processors who may handle your
            data:
          </p>
          <ul className="list-disc list-inside space-y-2! text-[#F5F0E8AA]">
            <li>
              <strong className="text-[#F5F0E8]">Clerk</strong> — authentication
              and user management.
            </li>
            <li>
              <strong className="text-[#F5F0E8]">Stripe</strong> — payment
              processing.
            </li>
            <li>
              <strong className="text-[#F5F0E8]">Neon</strong> — database
              hosting (Postgres).
            </li>
            <li>
              <strong className="text-[#F5F0E8]">Vercel</strong> — application
              hosting and file storage.
            </li>
            <li>
              <strong className="text-[#F5F0E8]">Resend</strong> — transactional
              email delivery.
            </li>
            <li>
              <strong className="text-[#F5F0E8]">PostHog</strong> — product
              analytics.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-label font-bold text-[12px] tracking-[0.4em] uppercase text-[#D4AF37] mb-4!">
            5. Data retention
          </h2>
          <p>
            We retain your account and event data for as long as your account is
            active. If you delete your account, we will permanently delete your
            data within 30 days, except where we are required to retain it for
            legal or accounting purposes. RSVP data is retained for the same
            period as the associated event.
          </p>
        </section>

        <section>
          <h2 className="font-label font-bold text-[12px] tracking-[0.4em] uppercase text-[#D4AF37] mb-4!">
            6. Your rights
          </h2>
          <p className="mb-4!">
            Depending on your location, you may have the right to:
          </p>
          <ul className="list-disc list-inside space-y-2! text-[#F5F0E8AA]">
            <li>Access a copy of the personal data we hold about you.</li>
            <li>Correct inaccurate or incomplete data.</li>
            <li>Request deletion of your data ("right to be forgotten").</li>
            <li>Object to or restrict certain processing activities.</li>
            <li>Export your data in a portable format.</li>
          </ul>
          <p className="mt-4!">
            To exercise any of these rights, email us at{" "}
            <a
              href="mailto:privacy@ceremonia.app"
              className="text-[#D4AF37] hover:underline"
            >
              privacy@ceremonia.app
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="font-label font-bold text-[12px] tracking-[0.4em] uppercase text-[#D4AF37] mb-4!">
            7. Cookies
          </h2>
          <p>
            We use strictly necessary cookies for authentication sessions
            (Clerk) and analytics cookies (PostHog, proxied to avoid ad
            blockers). You can disable analytics cookies in your browser
            settings. We do not use advertising or tracking cookies.
          </p>
        </section>

        <section>
          <h2 className="font-label font-bold text-[12px] tracking-[0.4em] uppercase text-[#D4AF37] mb-4!">
            8. Changes to this policy
          </h2>
          <p>
            We may update this policy from time to time. We will notify you of
            material changes by email or by posting a notice on the dashboard.
            Continued use of Ceremonia after changes constitutes acceptance of
            the updated policy.
          </p>
        </section>

        <section>
          <h2 className="font-label font-bold text-[12px] tracking-[0.4em] uppercase text-[#D4AF37] mb-4!">
            9. Contact
          </h2>
          <p>
            Questions about this policy? Contact us at{" "}
            <a
              href="mailto:privacy@ceremonia.app"
              className="text-[#D4AF37] hover:underline"
            >
              privacy@ceremonia.app
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — Ceremonia",
  description:
    "The terms and conditions governing your use of the Ceremonia event invitation platform.",
  openGraph: {
    title: "Terms of Service — Ceremonia",
    description:
      "The terms and conditions governing your use of the Ceremonia platform.",
    url: "https://ceremonia.app/terms",
    type: "website",
  },
  robots: { index: true, follow: false },
};

const LAST_UPDATED = "16 March 2026";

export default function TermsPage() {
  return (
    <main className="text-[#F5F0E8] w-full max-w-6xl mx-auto px-8! pt-36! pb-24!">
      <p className="font-label text-[11px] font-bold tracking-[0.5em] uppercase text-[#D4AF3780] mb-4!">
        Legal
      </p>
      <h1 className="font-display font-light text-[clamp(36px,5vw,60px)] leading-tight mb-3!">
        Terms of Service
      </h1>
      <p className="font-label text-[11px] font-semibold tracking-[0.3em] uppercase text-[#F5F0E840] mb-16!">
        Last updated: {LAST_UPDATED}
      </p>

      <div className="space-y-12! font-display text-[#F5F0E8CC] text-[17px] leading-relaxed">
        <section>
          <h2 className="font-label font-bold text-[12px] tracking-[0.4em] uppercase text-[#D4AF37] mb-4!">
            1. Acceptance
          </h2>
          <p>
            By creating an account or using any part of the Ceremonia platform,
            you agree to be bound by these Terms of Service ("Terms"). If you do
            not agree, do not use Ceremonia. These Terms apply to all users,
            including couples, event planners, and Agency subscribers.
          </p>
        </section>

        <section>
          <h2 className="font-label font-bold text-[12px] tracking-[0.4em] uppercase text-[#D4AF37] mb-4!">
            2. The service
          </h2>
          <p>
            Ceremonia provides a hosted event invitation platform including an
            invitation editor, RSVP collection, subdomain hosting, theme
            customisation, and related features. We reserve the right to modify,
            suspend, or discontinue any part of the service with reasonable
            notice.
          </p>
        </section>

        <section>
          <h2 className="font-label font-bold text-[12px] tracking-[0.4em] uppercase text-[#D4AF37] mb-4!">
            3. Accounts and eligibility
          </h2>
          <ul className="list-disc list-inside space-y-2 text-[#F5F0E8AA]">
            <li>You must be at least 18 years old to create an account.</li>
            <li>
              You are responsible for maintaining the security of your account
              credentials.
            </li>
            <li>One person may not maintain more than one free account.</li>
            <li>
              You must provide accurate and complete information when
              registering.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-label font-bold text-[12px] tracking-[0.4em] uppercase text-[#D4AF37] mb-4!">
            4. Subscriptions and billing
          </h2>
          <p className="mb-4!">
            Paid plans are billed monthly or as a one-time payment via Stripe.
            Subscriptions renew automatically unless cancelled before the
            renewal date. Refunds are offered at our discretion within 7 days of
            a charge if the service was not used substantively. One-time
            payments are non-refundable after delivery.
          </p>
          <p>
            We may change pricing with 30 days' notice. Continued use after the
            notice period constitutes acceptance of the new pricing.
          </p>
        </section>

        <section>
          <h2 className="font-label font-bold text-[12px] tracking-[0.4em] uppercase text-[#D4AF37] mb-4!">
            5. Your content
          </h2>
          <p className="mb-4!">
            You retain ownership of all content you upload or create on
            Ceremonia — photos, audio, names, and invitation text. By uploading
            content, you grant us a limited licence to host, display, and serve
            that content solely to operate the platform on your behalf.
          </p>
          <p>
            You are solely responsible for ensuring you have the rights to any
            content you upload, including music, photographs, and written
            material. We reserve the right to remove content that violates
            third-party rights or these Terms.
          </p>
        </section>

        <section>
          <h2 className="font-label font-bold text-[12px] tracking-[0.4em] uppercase text-[#D4AF37] mb-4!">
            6. Acceptable use
          </h2>
          <p className="mb-4!">You agree not to:</p>
          <ul className="list-disc list-inside space-y-2! text-[#F5F0E8AA]">
            <li>Use Ceremonia for any unlawful purpose.</li>
            <li>
              Upload content that is defamatory, obscene, or infringes
              third-party rights.
            </li>
            <li>
              Attempt to reverse-engineer, scrape, or exploit the platform's
              infrastructure.
            </li>
            <li>
              Resell or sublicence access to the platform without our written
              consent (except as permitted under the Agency tier).
            </li>
            <li>
              Collect or harvest guest RSVP data for purposes other than your
              own event management.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-label font-bold text-[12px] tracking-[0.4em] uppercase text-[#D4AF37] mb-4!">
            7. RSVP data and guest privacy
          </h2>
          <p>
            When guests submit RSVPs through your invitation, you become the
            data controller for that guest data. You agree to use RSVP data only
            for managing your event and to handle it in compliance with
            applicable privacy laws (including GDPR where applicable). Ceremonia
            acts as a data processor on your behalf for RSVP collection.
          </p>
        </section>

        <section>
          <h2 className="font-label font-bold text-[12px] tracking-[0.4em] uppercase text-[#D4AF37] mb-4!">
            8. Theme marketplace (Agency)
          </h2>
          <p>
            Agency subscribers may publish custom themes to the Ceremonia
            marketplace. By publishing a theme, you confirm it does not infringe
            any third-party intellectual property and you grant Ceremonia a
            non-exclusive licence to display and distribute it to other users
            within the platform. Ceremonia takes no commission on themes at this
            time.
          </p>
        </section>

        <section>
          <h2 className="font-label font-bold text-[12px] tracking-[0.4em] uppercase text-[#D4AF37] mb-4!">
            9. Limitation of liability
          </h2>
          <p>
            Ceremonia is provided "as is". To the maximum extent permitted by
            law, we exclude all implied warranties and shall not be liable for
            indirect, incidental, or consequential damages arising from your use
            of the platform — including lost data, missed RSVPs, or service
            downtime. Our aggregate liability is limited to the fees you paid in
            the 3 months preceding the claim.
          </p>
        </section>

        <section>
          <h2 className="font-label font-bold text-[12px] tracking-[0.4em] uppercase text-[#D4AF37] mb-4!">
            10. Termination
          </h2>
          <p>
            You may close your account at any time from the dashboard settings.
            We may suspend or terminate accounts that violate these Terms, with
            or without notice. On termination, your invitation pages will be
            taken offline and your data deleted within 30 days.
          </p>
        </section>

        <section>
          <h2 className="font-label font-bold text-[12px] tracking-[0.4em] uppercase text-[#D4AF37] mb-4!">
            11. Governing law
          </h2>
          <p>
            These Terms are governed by the laws of the Province of Ontario,
            Canada. Any disputes shall be resolved in the courts of Toronto,
            Ontario, unless otherwise required by applicable consumer protection
            law in your jurisdiction.
          </p>
        </section>

        <section>
          <h2 className="font-label font-bold text-[12px] tracking-[0.4em] uppercase text-[#D4AF37] mb-4!">
            12. Contact
          </h2>
          <p>
            Questions about these Terms? Email us at{" "}
            <a
              href="mailto:legal@ceremonia.app"
              className="text-[#D4AF37] hover:underline"
            >
              legal@ceremonia.app
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}

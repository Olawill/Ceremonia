# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the Ceremonia wedding invitation platform. The setup covers client-side event tracking via `posthog-js` (initialized in `instrumentation-client.ts`), server-side tracking via `posthog-node` (in `lib/posthog-server.ts`), a reverse proxy through Next.js rewrites, and automatic error capture. Events span the full user journey: guest RSVPs, editor activity, billing upgrades, subscription lifecycle (via Stripe webhooks), and account management.

## Events instrumented

| Event                    | Description                                                                        | File                                              |
| ------------------------ | ---------------------------------------------------------------------------------- | ------------------------------------------------- |
| `rsvp_submitted`         | Guest submits RSVP form on a wedding invitation page (acceptance or decline)       | `components/sections/RSVP.tsx`                    |
| `event_created`          | User creates a new wedding invitation and saves it for the first time              | `components/dashboard/editor/EditorShell.tsx`     |
| `event_saved`            | User saves changes to an existing wedding invitation in the editor                 | `components/dashboard/editor/EditorShell.tsx`     |
| `checkout_initiated`     | User clicks to upgrade their plan and is redirected to Stripe checkout             | `app/(dashboard)/app/billing/BillingClient.tsx`   |
| `billing_portal_opened`  | User opens the Stripe billing portal to manage their subscription                  | `app/(dashboard)/app/billing/BillingClient.tsx`   |
| `account_deleted`        | User permanently deletes their account and all weddings                            | `app/(dashboard)/app/settings/SettingsClient.tsx` |
| `brand_name_updated`     | Agency plan user saves a custom white-label brand name                             | `app/(dashboard)/app/settings/SettingsClient.tsx` |
| `user_signed_out`        | User signs out of their account                                                    | `app/(dashboard)/app/settings/SettingsClient.tsx` |
| `subscription_created`   | Stripe webhook confirms a new subscription was created (server-side)               | `app/api/webhooks/stripe/route.ts`                |
| `subscription_cancelled` | Stripe webhook confirms a user's subscription was cancelled (server-side)          | `app/api/webhooks/stripe/route.ts`                |
| `payment_completed`      | Stripe webhook confirms a one-time payment was completed (server-side)             | `app/api/webhooks/stripe/route.ts`                |
| `event_unlocked`         | Guest successfully unlocks a password-protected wedding invitation (server action) | `app/event/[slug]/actions.ts`                     |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard — Analytics basics**: https://us.posthog.com/project/333899/dashboard/1337935
  - **Upgrade funnel: Wedding created → Checkout → Payment**: https://us.posthog.com/project/333899/insights/ywW4FnEW
  - **RSVP submissions & acceptance rate**: https://us.posthog.com/project/333899/insights/5Yv10son
  - **Subscription growth & churn**: https://us.posthog.com/project/333899/insights/aNTdNier
  - **Wedding creation & editor activity**: https://us.posthog.com/project/333899/insights/JMiHFKQp

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/posthog-integration-nextjs-app-router/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

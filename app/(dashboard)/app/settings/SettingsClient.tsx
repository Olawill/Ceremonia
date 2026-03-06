"use client";

import { useClerk } from "@clerk/nextjs";
import { LogOutIcon, Trash2Icon, UserIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import { useState } from "react";

import { useApi } from "@/hooks/useApi";
import type { Plan } from "@/lib/plans";
import { toast } from "sonner";

interface Props {
  email: string;
  plan: Plan;
  clerkFirstName: string;
  clerkLastName: string;
  clerkImageUrl: string;
  brandName?: string;
}

export function SettingsClient({
  email,
  plan,
  clerkFirstName,
  clerkLastName,
  clerkImageUrl,
  brandName,
}: Props) {
  const { signOut } = useClerk();
  const { api } = useApi();
  const router = useRouter();
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== "DELETE") return;
    setDeleting(true);
    try {
      await api.settings.account.delete();
      posthog.capture("account_deleted", { plan });
      posthog.reset();
      await signOut();
      router.push("/");
    } catch (err) {
      posthog.captureException(err, { event_name: "account_deletion_failed" });
      setDeleting(false);
      toast.error("Failed to delete account. Please try again.");
    }
  };

  return (
    <div className="w-full max-w-4xl space-y-10!">
      {/* Header */}
      <div>
        <p className="font-label text-lg font-bold tracking-[0.5em] uppercase text-dash-gold/70">
          Settings
        </p>
        <h1 className="font-display font-light text-[clamp(28px,4vw,42px)] tracking-[0.04em] text-dash-text mt-1">
          Account
        </h1>
      </div>

      {/* Profile card */}
      <section className="rounded-2xl border border-dash-border bg-dash-gold/2 p-8! space-y-6!">
        <p className="font-label font-semibold text-[11px] tracking-[0.4em] uppercase text-dash-gold">
          Profile
        </p>

        <div className="flex items-center gap-5">
          {clerkImageUrl ? (
            <img
              src={clerkImageUrl}
              alt="Avatar"
              className="size-14 rounded-full object-cover border border-dash-border-md"
            />
          ) : (
            <div className="size-14 rounded-full border border-dash-border-md bg-dash-gold/10 flex items-center justify-center">
              <UserIcon className="size-6 text-dash-gold/60" />
            </div>
          )}
          <div>
            <p className="font-display font-semibold text-lg text-dash-text">
              {clerkFirstName} {clerkLastName}
            </p>
            <p className="font-display font-semibold italic text-sm text-dash-text/50">
              {email}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2! border-t border-dash-border">
          <div>
            <p className="font-label font-semibold text-[12px] tracking-[0.3em] uppercase text-dash-gold/60">
              Current plan
            </p>
            <p className="font-display font-semibold italic text-dash-text capitalize mt-0.5">
              {plan}
            </p>
          </div>
          <a
            href="/app/billing"
            className="font-label text-[11px] font-semibold tracking-[0.3em] uppercase px-4! py-2! rounded-full border border-dash-border-md text-dash-gold/70 hover:text-dash-gold hover:border-dash-border-hi transition-colors"
          >
            Manage billing
          </a>
        </div>
      </section>

      {plan === "agency" && (
        <section className="rounded-2xl border border-dash-border bg-dash-gold/2 p-8 space-y-4">
          <p className="font-label text-[11px] tracking-[0.4em] uppercase text-dash-gold">
            White-label
          </p>
          <p className="font-display italic text-sm text-dash-text/50">
            Replace "Ceremonia" branding on all your clients' invitations.
          </p>
          <BrandNameForm initialBrandName={brandName} />
        </section>
      )}

      {/* Sign out */}
      <section className="rounded-2xl border border-dash-border bg-dash-gold/2 p-8! space-y-4!">
        <p className="font-label text-[11px] font-semibold tracking-[0.4em] uppercase text-dash-gold">
          Session
        </p>
        <p className="font-display italic font-semibold text-sm text-dash-text/50">
          Sign out of your Ceremonia account on this device.
        </p>
        <button
          onClick={() => {
            posthog.capture("user_signed_out");
            posthog.reset();
            signOut(() => router.push("/"));
          }}
          className="flex items-center gap-2 font-label text-[11px] font-semibold tracking-[0.3em] uppercase px-5! py-2.5! rounded-full border border-dash-border-md text-dash-text/90 hover:text-dash-text hover:border-dash-border-hi transition-colors"
        >
          <LogOutIcon className="size-3.5" /> Sign out
        </button>
      </section>

      {/* Danger zone */}
      <section className="rounded-2xl border border-red-900/30 bg-red-950/10 p-8! space-y-4!">
        <p className="font-label font-semibold text-[11px] tracking-[0.4em] uppercase text-red-400">
          Danger zone
        </p>
        <p className="font-display font-semibold italic text-sm text-dash-text/50">
          Permanently delete your account and all weddings. This cannot be
          undone.
        </p>
        <div className="space-y-3!">
          <input
            type="text"
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder='Type "DELETE" to confirm'
            className="w-full bg-transparent border border-red-700/70 rounded-lg px-4! py-2.5! font-mono text-sm text-dash-text outline-none focus:border-red-500/50 placeholder:text-dash-text/70!"
          />
          <button
            onClick={handleDeleteAccount}
            disabled={deleteConfirm !== "DELETE" || deleting}
            className="flex items-center gap-2 font-label text-[11px] font-semibold tracking-[0.3em] uppercase px-5! py-2.5! rounded-full border border-red-700/70! text-red-600! hover:text-red-600! hover:border-red-70/90! transition-colors disabled:opacity-30 disabled:cursor-not-allowed justify-self-end"
          >
            <Trash2Icon className="size-3.5" />
            {deleting ? "Deleting…" : "Delete my account"}
          </button>
        </div>
      </section>
    </div>
  );
}

function BrandNameForm({ initialBrandName }: { initialBrandName?: string }) {
  const { api } = useApi();
  const [value, setValue] = useState(initialBrandName ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await api.settings.patch({ brandName: value });
    posthog.capture("brand_name_updated", { brand_name: value });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex gap-3">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Your Studio Name"
        className="flex-1 bg-transparent border border-dash-border-md rounded-lg px-4! py-2.5! font-display text-sm text-dash-text outline-none focus:border-dash-border-hi placeholder:text-dash-text/20"
      />
      <button
        onClick={handleSave}
        disabled={saving}
        className="font-label text-[11px] font-semibold tracking-[0.3em] uppercase px-5! py-2.5! rounded-full border border-dash-border-hi text-dash-gold hover:bg-dash-gold/10 transition-colors disabled:opacity-50"
      >
        {saved ? "Saved ✓" : saving ? "Saving…" : "Save"}
      </button>
    </div>
  );
}

"use client";

import {
  ChevronDownIcon,
  ChevronUpIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { nanoid } from "nanoid";
import { useState } from "react";

import { SectionToggle } from "@/components/dashboard/editor/SectionToggle";
import { Field, Input } from "@/components/ui/FormPrimitives";

import { ImageUploadField } from "@/components/ui/ImageUploadField";
import type {
  WeddingConfig,
  WeddingPartyMember,
  WeddingPartyRole,
} from "@/types/wedding";

interface Props {
  config: WeddingConfig;
  onChange: (patch: Partial<WeddingConfig>) => void;
}

const ROLES: { value: WeddingPartyRole; label: string }[] = [
  { value: "maid-of-honour", label: "Maid of Honour" },
  { value: "best-man", label: "Best Man" },
  { value: "bridesmaid", label: "Bridesmaid" },
  { value: "groomsman", label: "Groomsman" },
  { value: "flower-girl", label: "Flower Girl" },
  { value: "ring-bearer", label: "Ring Bearer" },
  { value: "usher", label: "Usher" },
  { value: "mother-of-bride", label: "Mother of Bride" },
  { value: "father-of-bride", label: "Father of Bride" },
  { value: "mother-of-groom", label: "Mother of Groom" },
  { value: "father-of-groom", label: "Father of Groom" },
  { value: "custom", label: "Custom…" },
];

const DEFAULT_MEMBER = (): WeddingPartyMember => ({
  id: nanoid(8),
  name: "",
  role: "bridesmaid",
  side: "bride",
});

function MemberEditor({
  member,
  onUpdate,
  onDelete,
}: {
  member: WeddingPartyMember;
  onUpdate: (patch: Partial<WeddingPartyMember>) => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(!member.name);

  return (
    <div className="rounded-xl border border-[#D4AF3760] overflow-hidden">
      {/* Collapsed header */}
      <div
        className="flex items-center justify-between px-4! py-3! cursor-pointer"
        style={{ background: "#D4AF3708" }}
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="flex flex-col">
          <p className="font-display font-bold italic text-sm text-[#F5F0E8]">
            {member.name || "New Member"}
          </p>
          <p className="font-label font-semibold text-[9px] tracking-widest uppercase text-[#D4AF3770]">
            {member.role === "custom"
              ? member.customRole || "Custom Role"
              : ROLES.find((r) => r.value === member.role)?.label}
            {" · "}
            {member.side === "both"
              ? "Both sides"
              : `${member.side === "bride" ? "Bride" : "Groom"}'s side`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="text-[#D4AF3770] hover:text-dash-error transition-colors"
          >
            <Trash2Icon className="size-3.5" />
          </button>
          {expanded ? (
            <ChevronUpIcon className="size-4 text-[#D4AF3760]" />
          ) : (
            <ChevronDownIcon className="size-4 text-[#D4AF3760]" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="px-4! py-4! space-y-3! border-t border-[#D4AF3715]">
          <Field label="Name">
            <Input
              value={member.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              placeholder="Sophia Clarke"
            />
          </Field>

          {/* Role picker */}
          <div className="flex flex-col gap-1.5">
            <label className="font-label font-semibold text-[10px] tracking-[0.4em] uppercase text-[#D4AF3780]">
              Role
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {ROLES.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => onUpdate({ role: value })}
                  className="px-2! py-2! rounded-lg border font-display italic text-sm text-left transition-all"
                  style={{
                    borderColor:
                      member.role === value ? "#D4AF3790" : "#D4AF3720",
                    background:
                      member.role === value ? "#D4AF3712" : "transparent",
                    color: member.role === value ? "#D4AF37" : "#F5F0E890",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom role label */}
          {member.role === "custom" && (
            <Field label="Custom Role Title">
              <Input
                value={member.customRole ?? ""}
                onChange={(e) => onUpdate({ customRole: e.target.value })}
                placeholder="e.g. Officiant, Cantor…"
              />
            </Field>
          )}

          {/* Side */}
          <div className="flex flex-col gap-1.5">
            <label className="font-label font-semibold text-[10px] tracking-[0.4em] uppercase text-[#D4AF3780]">
              Side
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["bride", "groom", "both"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => onUpdate({ side: s })}
                  className="py-2! rounded-lg border font-label text-[10px] tracking-widest uppercase transition-all"
                  style={{
                    borderColor: member.side === s ? "#D4AF3790" : "#D4AF3750",
                    background: member.side === s ? "#D4AF3712" : "transparent",
                    color: member.side === s ? "#D4AF37" : "#F5F0E890",
                  }}
                >
                  {s === "both" ? "Both" : s === "bride" ? "Bride" : "Groom"}
                </button>
              ))}
            </div>
          </div>

          <Field label="Relation" hint="e.g. Childhood best friend, Sister">
            <Input
              value={member.relation ?? ""}
              onChange={(e) => onUpdate({ relation: e.target.value })}
              placeholder="University roommate"
            />
          </Field>

          <Field label="Photo URL" hint="Square photo works best">
            <ImageUploadField
              value={member.photoUrl}
              onChange={(url) => onUpdate({ photoUrl: url })}
              hint="Upload or pick a photo"
            />
          </Field>
        </div>
      )}
    </div>
  );
}

export function WeddingPartyEditor({ config, onChange }: Props) {
  const members = config.weddingParty ?? [];

  const update = (updated: WeddingPartyMember[]) =>
    onChange({ weddingParty: updated });

  const addMember = () => update([...members, DEFAULT_MEMBER()]);

  const updateMember = (id: string, patch: Partial<WeddingPartyMember>) =>
    update(members.map((m) => (m.id === id ? { ...m, ...patch } : m)));

  const deleteMember = (id: string) =>
    update(members.filter((m) => m.id !== id));

  return (
    <div className="space-y-6!">
      {/* Enable toggle */}
      <SectionToggle
        label="Wedding Party"
        enabled={config.weddingPartyEnabled ?? false}
        onToggle={() =>
          onChange({ weddingPartyEnabled: !config.weddingPartyEnabled })
        }
      />
      {config.weddingPartyEnabled && (
        <>
          {members.length === 0 && (
            <div className="rounded-xl border border-dashed py-8! flex flex-col items-center gap-2 border-[#D4AF3760]">
              <p className="font-display italic text-sm text-[#D4AF3790]">
                No members added yet
              </p>
              <p className="font-label text-[9px] tracking-widest uppercase text-[#D4AF3770]">
                Add your bridal party below
              </p>
            </div>
          )}

          <div className="space-y-3!">
            {members.map((member) => (
              <MemberEditor
                key={member.id}
                member={member}
                onUpdate={(patch) => updateMember(member.id, patch)}
                onDelete={() => deleteMember(member.id)}
              />
            ))}
          </div>

          <button
            onClick={addMember}
            className="w-full flex items-center justify-center gap-2 py-3! rounded-xl border border-dashed font-label text-[11px] tracking-[0.3em] uppercase transition-all border-[#D4AF3770] text-[#D4AF3770] hover:text-[#D4AF3790] hover:border-[#D4AF3790] cursor-pointer"
          >
            <PlusIcon className="size-3.5" />
            Add Member
          </button>
        </>
      )}
    </div>
  );
}

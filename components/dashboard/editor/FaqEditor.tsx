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
import { Field, Input, Textarea } from "@/components/ui/FormPrimitives";

import type { FaqItem, WeddingConfig } from "@/types/wedding";

interface Props {
  config: WeddingConfig;
  onChange: (patch: Partial<WeddingConfig>) => void;
}

const DEFAULT_ITEM = (): FaqItem => ({
  id: nanoid(8),
  question: "",
  answer: "",
});

function ItemEditor({
  item,
  onUpdate,
  onDelete,
}: {
  item: FaqItem;
  onUpdate: (patch: Partial<FaqItem>) => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(!item.question);

  return (
    <div className="rounded-xl border border-[#D4AF3720] overflow-hidden">
      <div
        className="flex items-center justify-between px-4! py-3! cursor-pointer"
        style={{ background: "#D4AF3708" }}
        onClick={() => setExpanded((e) => !e)}
      >
        <p className="font-display italic text-sm text-[#F5F0E8] truncate pr-4">
          {item.question || "New Question"}
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="text-[#D4AF3750] hover:text-dash-error transition-colors cursor-pointer"
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
          <Field label="Question">
            <Input
              value={item.question}
              onChange={(e) => onUpdate({ question: e.target.value })}
              placeholder="Is there a dress code?"
            />
          </Field>
          <Field label="Answer">
            <Textarea
              value={item.answer}
              onChange={(e) => onUpdate({ answer: e.target.value })}
              placeholder="We kindly request black tie attire…"
              rows={4}
            />
          </Field>
        </div>
      )}
    </div>
  );
}

export function FaqEditor({ config, onChange }: Props) {
  const items = config.faq ?? [];

  const update = (updated: FaqItem[]) => onChange({ faq: updated });

  const addItem = () => update([...items, DEFAULT_ITEM()]);

  const updateItem = (id: string, patch: Partial<FaqItem>) =>
    update(
      items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );

  const deleteItem = (id: string) =>
    update(items.filter((item) => item.id !== id));

  return (
    <div className="space-y-6!">
      {/* Enable toggle */}
      <SectionToggle
        label="FAQ"
        enabled={config.faqEnabled ?? false}
        onToggle={() => onChange({ faqEnabled: !config.faqEnabled })}
      />

      {config.faqEnabled && (
        <>
          {items.length === 0 && (
            <div className="rounded-xl border border-dashed py-8! flex flex-col items-center gap-2 text-[#D4AF3760]">
              <p className="font-display italic text-sm text-[#D4AF3750]">
                No questions yet
              </p>
              <p className="font-label text-[9px] tracking-widest uppercase text-[#D4AF3770]">
                Add common guest questions below
              </p>
            </div>
          )}
          <div className="space-y-3!">
            {items.map((item) => (
              <ItemEditor
                key={item.id}
                item={item}
                onUpdate={(patch) => updateItem(item.id, patch)}
                onDelete={() => deleteItem(item.id)}
              />
            ))}
          </div>

          <button
            onClick={addItem}
            className="w-full flex items-center justify-center gap-2 py-3! rounded-xl border border-dashed font-label text-[11px] tracking-[0.3em] uppercase transition-all border-[#D4AF3760] text-[#D4AF3760] hover:text-[#D4AF3790] hover:border-[#D4AF3790] cursor-pointer"
          >
            <PlusIcon className="size-3.5" />
            Add Question
          </button>
        </>
      )}
    </div>
  );
}

"use client";

import { Loader2Icon, Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useApi } from "@/hooks/useApi";
import { useToast } from "@/hooks/useToast";
import { Tooltip } from "../ui/Tooltip";

interface Props {
  slug: string;
  eventLabel: string;
}

export function DeleteEventButton({ slug, eventLabel }: Props) {
  const { api } = useApi();
  const { toast } = useToast();
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    const { error } = await api.events({ slug }).delete();
    if (error) {
      toast.error(`Failed to delete ${eventLabel.toLowerCase()}`);
      setDeleting(false);
      setConfirming(false);
      return;
    }
    toast.success(`${eventLabel} deleted`);
    router.refresh();
  };

  if (confirming) {
    return (
      <div
        className="flex items-center gap-2"
        onClick={(e) => e.preventDefault()} // prevent the card Link from firing
      >
        <span className="font-label text-[9px] tracking-widest uppercase text-[#F5F0E860]">
          Sure?
        </span>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="font-label text-[9px] tracking-widest uppercase px-2! py-1! rounded border border-[#ff444440] text-dash-error hover:bg-[#ff444415] transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1"
        >
          {deleting ? (
            <Loader2Icon className="size-3 animate-spin" />
          ) : (
            "Delete"
          )}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="font-label text-[9px] tracking-widest uppercase px-2! py-1! rounded border border-[#D4AF3730] text-[#D4AF3780] hover:text-[#D4AF37] transition-all cursor-pointer"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <Tooltip
      content={`Delete ${eventLabel.toLowerCase()}`}
      position="left"
      delay={200}
    >
      <button
        onClick={(e) => {
          e.preventDefault(); // prevent the card Link from firing
          setConfirming(true);
        }}
        className="opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 group-hover:opacity-100 transition-opacity text-[#D4AF3750] hover:text-dash-error cursor-pointer p-1!"
      >
        <Trash2Icon className="size-3.5" />
      </button>
    </Tooltip>
  );
}

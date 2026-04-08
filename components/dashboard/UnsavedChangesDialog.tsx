"use client";

import clsx from "clsx";

interface Props {
  open: boolean;
  onConfirm: () => void;
  onDismiss: () => void;
}

export function UnsavedChangesDialog({ open, onConfirm, onDismiss }: Props) {
  return (
    <div
      className={clsx(
        "fixed inset-0 z-99999 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-150",
        open
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none invisible",
      )}
      onClick={onDismiss}
    >
      <div
        className="bg-[#1a1408] border border-[#D4AF3760] rounded-xl p-8! max-w-sm w-[90vw] text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-4xl mb-3!">⚠️</div>
        <h2 className="font-display text-xl font-bold text-dash-text mb-2!">
          Unsaved Changes
        </h2>
        <div className="h-px w-12 mx-auto bg-[#D4AF37] mb-4!" />
        <p className="font-display italic text-[17px] text-[#f5f0e880] leading-relaxed mb-7!">
          You have unsaved changes that will be lost if you leave. Are you sure
          you want to continue?
        </p>
        <div className="flex gap-3">
          <button
            onClick={onDismiss}
            className="flex-1 py-2.5! px-0.5! rounded-lg border border-[#D4AF3780] text-[#D4AF37] font-label text-xs tracking-widest uppercase hover:border-[#D4AF37] transition-colors cursor-pointer bg-transparent"
          >
            Stay &amp; Keep Editing
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5! px-0.5! rounded-lg border border-[#cc2222] bg-[#8b1a1a] text-dash-text font-label text-xs tracking-widest uppercase hover:bg-[#a01f1f] transition-colors cursor-pointer"
          >
            Leave Anyway
          </button>
        </div>
      </div>
    </div>
  );
}

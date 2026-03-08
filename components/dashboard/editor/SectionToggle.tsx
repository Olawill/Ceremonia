interface Props {
  label: string;
  enabled: boolean;
  onToggle: () => void;
}

export function SectionToggle({ label, enabled, onToggle }: Props) {
  return (
    <div className="flex items-center justify-between">
      <p className="font-label text-[12px] text-[#D4AF37] font-bold tracking-[0.5em] uppercase">
        {label}
      </p>
      <button
        onClick={onToggle}
        className="font-label text-[10px] tracking-widest uppercase px-3! py-1.5! rounded-full border transition-all cursor-pointer"
        style={{
          borderColor: enabled ? "#D4AF3790" : "#D4AF3730",
          background: enabled ? "#D4AF3715" : "transparent",
          color: enabled ? "#D4AF37" : "#D4AF3760",
        }}
      >
        {enabled ? "Enabled" : "Disabled"}
      </button>
    </div>
  );
}

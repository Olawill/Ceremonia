"use client";

import clsx from "clsx";
import { format, isValid, parse } from "date-fns";
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";

interface DatePickerProps {
  value: string; // "YYYY-MM-DD"
  onChange: (value: string) => void;
  hasError?: boolean;
  placeholder?: string;
}

export function DatePicker({
  value,
  onChange,
  hasError,
  placeholder = "Select a date",
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const parsed = value ? parse(value, "yyyy-MM-dd", new Date()) : undefined;
  const selected = parsed && isValid(parsed) ? parsed : undefined;

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={clsx(
          "dash-input w-full flex items-center justify-between text-left cursor-pointer",
          hasError && "has-error",
          !selected && "text-dash-text/40",
        )}
      >
        <span>{selected ? format(selected, "d MMMM yyyy") : placeholder}</span>
        <CalendarIcon className="size-4 text-dash-gold/50 shrink-0" />
      </button>

      {/* Popover */}
      {open && (
        <div
          className="absolute top-full left-0 mt-2 z-50 rounded-xl border border-dash-border bg-dash-surface shadow-2xl p-3!"
          style={{ minWidth: "280px" }}
        >
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={(day) => {
              if (day) {
                onChange(format(day, "yyyy-MM-dd"));
                setOpen(false);
              }
            }}
            defaultMonth={selected ?? new Date()}
            classNames={{
              root: "font-display text-dash-text",
              months: "flex flex-col gap-4",
              month: "w-full",
              month_caption: "flex items-center justify-between px-1 pb-2",
              caption_label:
                "font-label text-xs tracking-[0.3em] uppercase text-dash-gold",
              nav: "flex items-center gap-1",
              button_previous:
                "p-1 rounded hover:bg-dash-border text-dash-gold/70 hover:text-dash-gold transition-colors",
              button_next:
                "p-1 rounded hover:bg-dash-border text-dash-gold/70 hover:text-dash-gold transition-colors",
              month_grid: "w-full border-collapse",
              weekdays: "flex",
              weekday:
                "flex-1 text-center font-label text-[9px] tracking-widest uppercase text-dash-text/40 pb-2",
              weeks: "flex flex-col gap-1",
              week: "flex",
              day: "flex-1 aspect-square flex items-center justify-center",
              day_button:
                "w-full h-full flex items-center justify-center rounded-lg text-sm font-display transition-all hover:bg-dash-gold/10 hover:text-dash-gold cursor-pointer",
              selected:
                "[&>button]:bg-dash-gold/20 [&>button]:text-dash-gold [&>button]:border [&>button]:border-dash-gold/40",
              today: "[&>button]:font-bold [&>button]:text-dash-gold/80",
              outside: "[&>button]:text-dash-text/20",
              disabled: "[&>button]:opacity-30 [&>button]:cursor-not-allowed",
            }}
            components={{
              Chevron: ({ orientation }) =>
                orientation === "left" ? (
                  <ChevronLeftIcon className="size-3.5" />
                ) : (
                  <ChevronRightIcon className="size-3.5" />
                ),
            }}
          />
        </div>
      )}
    </div>
  );
}

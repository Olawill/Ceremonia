"use client";

import clsx from "clsx";
import { format, isValid, parse } from "date-fns";
import {
  CalendarIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  DayPicker,
  getDefaultClassNames,
  useDayPicker,
} from "react-day-picker";

import "react-day-picker/style.css";

interface DatePickerProps {
  value: string; // "YYYY-MM-DD"
  onChange: (value: string) => void;
  hasError?: boolean;
  placeholder?: string;
}

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  value: i,
  label: new Date(2000, i, 1).toLocaleString(undefined, { month: "short" }),
}));

export function DatePicker({
  value,
  onChange,
  hasError,
  placeholder = "Select a date",
}: DatePickerProps) {
  const defaultClassNames = getDefaultClassNames();

  const START_YEAR = 1950;
  const END_YEAR = new Date().getFullYear() + 10;

  const yearOptions = useMemo(
    () =>
      Array.from({ length: END_YEAR - START_YEAR + 1 }, (_, i) => ({
        value: START_YEAR + i,
        label: String(START_YEAR + i),
      })),
    [],
  );

  const [open, setOpen] = useState(false);
  const [openAbove, setOpenAbove] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

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

  // Measure available space when opening
  const handleOpen = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      // calendar is ~320px tall
      setOpenAbove(spaceBelow < 340 && spaceAbove > spaceBelow);
    }
    setOpen((o) => !o);
  };

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        ref={triggerRef}
        onClick={handleOpen}
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
          className={clsx(
            "absolute left-0 z-50 rounded-xl border border-dash-border bg-dash-surface shadow-2xl p-3!",
            openAbove ? "bottom-full mb-2" : "top-full mt-2",
          )}
          style={{ minWidth: "280px" }}
        >
          <DayPicker
            mode="single"
            captionLayout="label"
            hideNavigation
            startMonth={new Date(START_YEAR, 0)}
            endMonth={new Date(END_YEAR, 11)}
            selected={selected}
            onSelect={(day) => {
              if (day) {
                onChange(format(day, "yyyy-MM-dd"));
                setOpen(false);
              }
            }}
            defaultMonth={selected ?? new Date()}
            formatters={{
              formatMonthDropdown: (date) =>
                date.toLocaleString(undefined, { month: "short" }),
            }}
            classNames={{
              root: `${defaultClassNames.root} font-display text-dash-text`,
              months: `${defaultClassNames.months} flex flex-col gap-4`,
              month: `${defaultClassNames.month} flex w-full flex-col gap-4`,
              nav: `${defaultClassNames.nav} absolute inset-x-0 top-0 flex w-full items-center justify-between`,
              button_previous: `${defaultClassNames.button_previous} size-7 p-0 text-dash-gold/70 hover:text-dash-gold hover:bg-dash-border rounded-lg transition-colors cursor-pointer`,
              button_next: `${defaultClassNames.button_next} size-7 p-0 text-dash-gold/70 hover:text-dash-gold hover:bg-dash-border rounded-lg transition-colors cursor-pointer`,
              month_caption: `${defaultClassNames.month_caption} flex h-7 w-full items-center justify-center px-4`,
              dropdowns: `${defaultClassNames.dropdowns} flex items-center justify-center gap-1.5`,
              dropdown_root: `${defaultClassNames.dropdown_root} relative`,
              dropdown: `${defaultClassNames.dropdown} absolute inset-0 opacity-0 cursor-pointer focus:outline-none focus-visible:outline-none [&]:outline-none`,
              caption_label: `${defaultClassNames.caption_label} flex items-center gap-1 font-label text-[11px] tracking-[0.3em] uppercase text-dash-gold cursor-pointer select-none`,
              month_grid: "w-full border-collapse",
              weekdays: `${defaultClassNames.weekdays} flex`,
              weekday: `${defaultClassNames.weekday} flex-1 text-center font-label text-[9px] tracking-widest uppercase text-dash-gold/80 pb-2`,
              weeks: `${defaultClassNames.weeks} flex flex-col gap-1 mt-2`,
              week: `${defaultClassNames.week} flex w-full`,
              day: `${defaultClassNames.day} relative aspect-square h-full w-full p-0 text-center text-dash-gold/60`,
              day_button: `${defaultClassNames.day_button} w-full h-full flex items-center justify-center rounded-lg text-sm font-display transition-all hover:bg-dash-gold/10 hover:text-dash-gold cursor-pointer`,
              selected: `${defaultClassNames.selected} [&>button]:bg-dash-gold/20 [&>button]:text-dash-gold! [&>button]:border [&>button]:border-dash-gold/40!`,
              today: `${defaultClassNames.today} [&>button]:font-bold [&>button]:text-dash-gold`,
              outside: `${defaultClassNames.outside} [&>button]:text-dash-text/20`,
              disabled: `${defaultClassNames.disabled} [&>button]:opacity-30 [&>button]:cursor-not-allowed`,
            }}
            components={{
              MonthCaption: ({ calendarMonth }) => (
                <CustomMonthCaption
                  calendarMonth={calendarMonth}
                  yearOptions={yearOptions}
                />
              ),
            }}
          />
        </div>
      )}
    </div>
  );
}

function DropdownSelect({
  value,
  options,
  onChange,
}: {
  value: number;
  options: { label: string; value: number }[];
  onChange: (value: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Scroll selected item into view when opened
  useEffect(() => {
    if (open && listRef.current) {
      const selected = listRef.current.querySelector("[data-selected=true]");
      selected?.scrollIntoView({ block: "nearest" });
    }
  }, [open]);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 font-label text-[11px] tracking-[0.3em] uppercase text-dash-gold cursor-pointer hover:text-dash-gold/80 transition-colors focus:outline-none"
      >
        {selected?.label}
        <ChevronDownIcon className="size-3 opacity-60" />
      </button>

      {open && (
        <div
          ref={listRef}
          className="absolute top-full left-1/2 -translate-x-1/2 mt-1 z-60 rounded-lg border border-dash-border bg-dash-surface shadow-xl overflow-y-auto max-h-48 min-w-16"
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              data-selected={opt.value === value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={clsx(
                "w-full text-center px-3! py-1.5! font-label text-[10px] tracking-widest uppercase transition-colors cursor-pointer",
                opt.value === value
                  ? "text-dash-gold bg-dash-gold/10"
                  : "text-dash-text/70 hover:text-dash-gold hover:bg-dash-gold/5",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CustomMonthCaption({
  calendarMonth,
  yearOptions,
}: {
  calendarMonth: { date: Date };
  yearOptions: { value: number; label: string }[];
}) {
  const { goToMonth, nextMonth, previousMonth } = useDayPicker();
  const month = calendarMonth.date.getMonth();
  const year = calendarMonth.date.getFullYear();

  return (
    <div className="flex items-center justify-between w-full pb-2">
      <button
        type="button"
        onClick={() => previousMonth && goToMonth(previousMonth)}
        disabled={!previousMonth}
        className="size-7 p-0 flex items-center justify-center text-dash-gold/70 hover:text-dash-gold hover:bg-dash-border rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronLeftIcon className="size-3.5" />
      </button>

      <div className="flex items-center gap-2">
        <DropdownSelect
          value={month}
          options={MONTH_OPTIONS}
          onChange={(m) => goToMonth(new Date(year, m, 1))}
        />
        <span className="text-dash-gold/30 font-label text-[10px]">·</span>
        <DropdownSelect
          value={year}
          options={yearOptions}
          onChange={(y) => goToMonth(new Date(y, month, 1))}
        />
      </div>

      <button
        type="button"
        onClick={() => nextMonth && goToMonth(nextMonth)}
        disabled={!nextMonth}
        className="size-7 p-0 flex items-center justify-center text-dash-gold/70 hover:text-dash-gold hover:bg-dash-border rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronRightIcon className="size-3.5" />
      </button>
    </div>
  );
}

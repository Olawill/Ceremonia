"use client";

import clsx from "clsx";
import { DownloadIcon } from "lucide-react";
import { useState } from "react";

import type { Plan } from "@/lib/plans";

import { EventType, getVocabulary } from "@/types/event";

interface Event {
  id: string;
  bride: string;
  groom: string | null;
  slug: string;
  eventType: string | null;
}

interface RSVP {
  id: string;
  eventId: string | null;
  name: string;
  attendance: string;
  guests: number | null;
  dietary: string | null;
  message: string | null;
  createdAt: Date | null;
}

interface Props {
  events: Event[];
  rsvpsByEvent: Record<string, RSVP[]>;
  plan: Plan;
  canExport: boolean;
}

export function RSVPsClient({ events, rsvpsByEvent, plan, canExport }: Props) {
  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id ?? "");

  const selectedEvent = events.find((w) => w.id === selectedEventId);
  const rows = rsvpsByEvent[selectedEventId] ?? [];
  const attending = rows.filter((r) => r.attendance === "yes");
  const declining = rows.filter((r) => r.attendance === "no");
  const totalGuests = attending.reduce((sum, r) => sum + (r.guests ?? 1), 0);

  const handleExport = () => {
    window.open(`/api/rsvp/export?eventId=${selectedEventId}`, "_blank");
  };

  return (
    <div className="p-8! w-full mx-auto space-y-8!">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[clamp(28px,4vw,42px)] font-display font-semibold text-[#F5F0E8]">
            RSVPs
          </h1>
          <p className="text-lg font-display italic font-semibold text-[#F5F0E890] mt-1!">
            Guest responses for your{" "}
            {getVocabulary(
              (selectedEvent?.eventType as EventType) ?? "wedding",
            ).eventLabel.toLowerCase()}
          </p>
        </div>

        {canExport && rows.length > 0 && (
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#D4AF3740] text-[#D4AF37] font-label text-[11px] tracking-[0.3em] uppercase hover:border-[#D4AF37] transition-colors"
          >
            <DownloadIcon className="w-3.5 h-3.5" />
            Export CSV
          </button>
        )}
      </div>

      {/* event selector (if multiple) */}
      {events.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {events.map((w) => (
            <button
              key={w.id}
              onClick={() => setSelectedEventId(w.id)}
              className={clsx(
                "px-4 py-2 rounded-lg font-label text-[11px] tracking-[0.3em] uppercase transition-colors border",
                selectedEventId === w.id
                  ? "border-[#D4AF37] text-[#D4AF37] bg-[#D4AF3710]"
                  : "border-[#ffffff15] text-[#F5F0E880] hover:border-[#D4AF3740]",
              )}
            >
              {getVocabulary((w.eventType as EventType) ?? "wedding").emoji}{" "}
              {w.groom ? `${w.bride} & ${w.groom}` : w.bride}
            </button>
          ))}
        </div>
      )}

      {/* Stats row */}
      {rows.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Responses", value: rows.length },
            { label: "Attending", value: attending.length },
            { label: "Total Guests", value: totalGuests },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-[#D4AF3720] bg-[#D4AF3708] px-6 py-5"
            >
              <p className="font-label text-[10px] tracking-[0.4em] uppercase text-[#D4AF3780]">
                {stat.label}
              </p>
              <p className="font-display text-3xl font-light text-[#F5F0E8] mt-2">
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      {rows.length === 0 ? (
        <div className="text-center py-20! rounded-xl border border-[#ffffff90]">
          <p className="text-4xl mb-4 text-[#D4AF3780]">✦</p>
          <p className="font-display text-xl font-semibold text-[#F5F0E880]">
            No RSVPs yet
          </p>
          <p className="font-display italic font-semibold text-base text-[#F5F0E880] mt-1">
            Responses will appear here once guests submit the form
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-[#ffffff10] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#ffffff10]">
                {["Name", "Attendance", "Guests", "Dietary", "Submitted"].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left font-label text-[10px] tracking-[0.3em] uppercase text-[#D4AF3780]"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr
                  key={r.id}
                  className={clsx(
                    "border-b border-[#ffffff08] transition-colors hover:bg-[#D4AF3705]",
                    i % 2 === 0 ? "bg-transparent" : "bg-[#ffffff03]",
                  )}
                >
                  <td className="px-4 py-3 font-display text-[#F5F0E8]">
                    {r.name}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={clsx(
                        "font-label text-[10px] tracking-[0.3em] uppercase px-2 py-1 rounded-full",
                        r.attendance === "yes"
                          ? "bg-[#D4AF3720] text-[#D4AF37]"
                          : "bg-[#ffffff10] text-[#F5F0E860]",
                      )}
                    >
                      {r.attendance === "yes" ? "Attending" : "Declined"}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-display text-[#F5F0E8]">
                    {r.attendance === "yes" ? (r.guests ?? 1) : "—"}
                  </td>
                  <td className="px-4 py-3 font-display italic text-[#F5F0E870] text-xs">
                    {r.dietary || "—"}
                  </td>
                  <td className="px-4 py-3 font-display text-[#F5F0E860] text-xs">
                    {r.createdAt
                      ? new Date(r.createdAt).toLocaleDateString()
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

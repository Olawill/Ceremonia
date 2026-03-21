import { format, parseISO } from "date-fns";

import { VenueEvent } from "@/types/event";

export const formattedDate = (date: string, dotted: boolean = false) => {
  const [year, month, day] = date.split("-").map(Number);
  // Month is 0-indexed in the Date constructor
  const local = new Date(year, month - 1, day);

  return dotted
    ? local
        .toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
        .replace(/ /g, " • ")
    : local.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
};

export const formattedDeadlineDate = (date: string) => {
  const parsed = parseISO(date);
  return format(parsed, "MMMM do, yyyy");
};

export const createCountDownLoaction = ({ value, sub }: VenueEvent) => {
  return `${value}, ${sub.split(",")[0]}`;
};

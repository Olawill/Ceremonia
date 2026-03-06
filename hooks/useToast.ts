import { toast } from "sonner";

// Eden Treaty error shape
type EdenError = {
  status: number;
  value: { message?: string } | string | null | unknown;
};

/** Pulls the message string out of any Eden error shape */
function extractMessage(value: EdenError["value"], fallback: string): string {
  if (!value) return fallback;
  if (typeof value === "string") return value;
  if (typeof value === "object" && "message" in (value as object)) {
    return (value as { message?: string }).message ?? fallback;
  }
  return fallback;
}

export function useToast() {
  const handleApiError = (
    error: EdenError,
    fallback = "Something went wrong",
  ) => {
    const msg = extractMessage(error.value, fallback);

    switch (error.status) {
      case 401:
        toast.error("Session expired", {
          description: "Please sign in again.",
        });
        break;
      case 403:
        toast.warning(msg, {
          description: "Upgrade your plan to unlock this feature.",
          action: {
            label: "Upgrade",
            onClick: () => (window.location.href = "/app/billing"),
          },
        });
        break;
      case 404:
        toast.error(msg);
        break;
      case 409:
        toast.warning(msg);
        break;
      case 422:
        toast.error("Validation error", { description: msg });
        break;
      default:
        toast.error(msg);
    }
  };

  return { toast, handleApiError };
}

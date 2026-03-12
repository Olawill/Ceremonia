import { PreviewClient } from "./PreviewClient";

interface Props {
  searchParams: Promise<{ initial?: string }>;
}

export default async function WeddingPreviewPage({ searchParams }: Props) {
  const { initial } = await searchParams;
  console.log(
    "[PreviewPage] initial param present:",
    !!initial,
    "length:",
    initial?.length,
  );

  let initialConfig = null;
  if (initial) {
    try {
      const bytes = Uint8Array.from(atob(decodeURIComponent(initial)), (c) =>
        c.charCodeAt(0),
      );
      initialConfig = JSON.parse(new TextDecoder().decode(bytes));
      console.log(
        "[PreviewPage] decoded config themeKey:",
        initialConfig?.themeKey,
        "bride:",
        initialConfig?.bride,
      );
    } catch (e) {
      // Invalid base64 — render demo
      console.error("[PreviewPage] decode failed:", e);
    }
  }

  return <PreviewClient initialConfig={initialConfig} />;
}

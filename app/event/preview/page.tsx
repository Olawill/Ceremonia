import { PreviewClient } from "./PreviewClient";

interface Props {
  searchParams: Promise<{ initial?: string }>;
}

export default async function WeddingPreviewPage({ searchParams }: Props) {
  const { initial } = await searchParams;

  let initialConfig = null;
  if (initial) {
    try {
      const bytes = Uint8Array.from(atob(decodeURIComponent(initial)), (c) =>
        c.charCodeAt(0),
      );
      initialConfig = JSON.parse(new TextDecoder().decode(bytes));
    } catch (e) {
      // Invalid base64 — render demo
      console.error("[PreviewPage] decode failed:", e);
    }
  }

  return <PreviewClient initialConfig={initialConfig} />;
}

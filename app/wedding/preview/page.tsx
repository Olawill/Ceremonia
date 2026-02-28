import { PreviewClient } from "./PreviewClient";

interface Props {
  searchParams: Promise<{ initial?: string }>;
}

export default async function WeddingPreviewPage({ searchParams }: Props) {
  const { initial } = await searchParams;

  let initialConfig = null;
  if (initial) {
    try {
      initialConfig = JSON.parse(atob(decodeURIComponent(initial)));
    } catch {
      // Invalid base64 — render demo
    }
  }

  return <PreviewClient initialConfig={initialConfig} />;
}

// Temporary: redirect root to demo wedding
// In production this will be the marketing/pricing page
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/wedding/demo");
}

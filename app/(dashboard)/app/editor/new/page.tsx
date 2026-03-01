import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { EditorShell } from "@/components/dashboard/editor/EditorShell";

export const dynamic = "force-dynamic";

export default async function NewEditorPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return <EditorShell initialConfig={null} isNew />;
}

import { SignUp } from "@clerk/nextjs";

export const metadata = {
  title: "Create Account — Ceremonia",
  description:
    "Create your Ceremonia account and start building your wedding invitation today.",
};

export default function SignUpPage() {
  return (
    <div className="bg-zinc-950 flex items-center justify-center">
      <SignUp />
    </div>
  );
}

import { SignIn } from "@clerk/nextjs";

export const metadata = {
  title: "Sign In — Ceremonia",
  robots: { index: false, follow: false },
};

export default function SignInPage() {
  return (
    <div className="bg-zinc-950 flex items-center justify-center">
      <SignIn />
    </div>
  );
}

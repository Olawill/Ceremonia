import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="bg-zinc-950 flex items-center justify-center">
      <SignUp />
    </div>
  );
}

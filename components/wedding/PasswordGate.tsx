"use client";

import { useState } from "react";

interface Props {
  password: string;
}

export function PasswordGate({ password }: Props) {
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  if (unlocked) return null;

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (input === password) {
      setUnlocked(true);
    } else {
      setError(true);
      setInput("");
    }
  };

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-[#0d0a07]">
      <div className="w-full max-w-sm px-8 py-10 rounded-2xl border border-[#D4AF3730] bg-[#12100c] text-center flex flex-col gap-6">
        <div className="text-[#D4AF37] text-4xl">✦</div>
        <div>
          <h1 className="font-display text-2xl font-light text-[#F5F0E8] mb-1">
            Private Invitation
          </h1>
          <p className="font-display italic text-sm text-[#F5F0E880]">
            Please enter the password to continue
          </p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="password"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setError(false);
            }}
            placeholder="Password"
            className="w-full px-4 py-3 rounded-lg bg-[#F5F0E808] border border-[#D4AF3730] text-[#F5F0E8] font-display text-base outline-none focus:border-[#D4AF37] transition-colors placeholder:text-[#F5F0E840]"
          />
          {error && (
            <p className="text-[#D4AF3780] font-display italic text-sm">
              Incorrect password. Please try again.
            </p>
          )}
          <button
            type="submit"
            className="w-full py-3 rounded-lg border border-[#D4AF37] bg-[#D4AF3715] text-[#D4AF37] font-label text-[12px] tracking-[0.4em] uppercase transition-colors hover:bg-[#D4AF3725]"
          >
            Enter
          </button>
        </form>
      </div>
    </div>
  );
}

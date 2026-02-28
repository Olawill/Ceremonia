"use client";

import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";

const inputStyle = {
  background: "#ffffff08",
  border: "1px solid #D4AF3725",
  color: "#F5F0E8",
  borderRadius: 10,
  padding: "10px 14px",
  fontSize: 13,
  width: "100%",
  outline: "none",
  fontFamily: "var(--font-display)",
} as const;

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ hasError, style, ...props }, ref) => (
    <input
      ref={ref}
      style={{
        background: "#ffffff08",
        border: `1px solid ${hasError ? "#ff6b6b50" : "#D4AF3725"}`,
        color: "#F5F0E8",
        borderRadius: 10,
        padding: "10px 14px",
        fontSize: 13,
        width: "100%",
        outline: "none",
        fontFamily: "var(--font-display)",
        ...style,
      }}
      {...props}
    />
  ),
);

Input.displayName = "Input";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ hasError, style, ...props }, ref) => (
    <textarea
      ref={ref}
      style={{
        background: "#ffffff08",
        border: `1px solid ${hasError ? "#ff6b6b50" : "#D4AF3725"}`,
        color: "#F5F0E8",
        borderRadius: 10,
        padding: "10px 14px",
        fontSize: 13,
        width: "100%",
        outline: "none",
        fontFamily: "var(--font-display)",
        resize: "vertical",
        ...style,
      }}
      {...props}
    />
  ),
);

Textarea.displayName = "Textarea";

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label
        className="font-label text-[10px] tracking-[0.35em] uppercase block"
        style={{ color: error ? "#ff6b6b" : "#D4AF3770" }}
      >
        {label}
      </label>
      {children}
      {error ? (
        <p className="font-display italic text-xs" style={{ color: "#ff6b6b" }}>
          {error}
        </p>
      ) : hint ? (
        <p
          className="font-display italic text-xs"
          style={{ color: "#F5F0E830" }}
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
}

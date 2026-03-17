"use client";

import clsx from "clsx";
import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ hasError, className, ...props }, ref) => (
    <input
      ref={ref}
      className={clsx("dash-input", hasError && "has-error", className)}
      {...props}
    />
  ),
);

Input.displayName = "Input";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ hasError, className, ...props }, ref) => (
    <textarea
      ref={ref}
      rows={props.rows ?? 3}
      className={clsx(
        "dash-input resize-none",
        hasError && "has-error",
        className,
      )}
      {...props}
    />
  ),
);

Textarea.displayName = "Textarea";

interface FieldProps {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}

export function Field({ label, error, hint, children, className }: FieldProps) {
  return (
    <div className={clsx("flex flex-col gap-1.5", className)}>
      <label className="font-label text-[10px] tracking-[0.4em] uppercase text-dash-gold/90">
        {label}
      </label>
      {children}
      {error ? (
        <p className="font-display font-semibold italic text-sm text-dash-error">
          {error}
        </p>
      ) : hint ? (
        <p className="font-display font-semibold italic text-sm text-dash-text/70">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

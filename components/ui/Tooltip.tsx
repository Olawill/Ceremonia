"use client";

import clsx from "clsx";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type TooltipPosition = "top" | "bottom" | "left" | "right";

type AnyElement = React.ReactElement<any>;

interface TooltipProps {
  content: React.ReactNode;
  children: AnyElement | string | number;
  position?: TooltipPosition;
  delay?: number;
  className?: string;
  disabled?: boolean;
  showWhen?: boolean;
}

interface Coords {
  top: number;
  left: number;
}

const OFFSET = 8;

function getPosition(
  triggerRect: DOMRect,
  tooltipRect: DOMRect,
  position: TooltipPosition,
): Coords {
  const scrollY = window.scrollY;
  const scrollX = window.scrollX;

  switch (position) {
    case "top":
      return {
        top: triggerRect.top + scrollY - tooltipRect.height - OFFSET,
        left:
          triggerRect.left +
          scrollX +
          triggerRect.width / 2 -
          tooltipRect.width / 2,
      };
    case "bottom":
      return {
        top: triggerRect.bottom + scrollY + OFFSET,
        left:
          triggerRect.left +
          scrollX +
          triggerRect.width / 2 -
          tooltipRect.width / 2,
      };
    case "left":
      return {
        top:
          triggerRect.top +
          scrollY +
          triggerRect.height / 2 -
          tooltipRect.height / 2,
        left: triggerRect.left + scrollX - tooltipRect.width - OFFSET,
      };
    case "right":
      return {
        top:
          triggerRect.top +
          scrollY +
          triggerRect.height / 2 -
          tooltipRect.height / 2,
        left: triggerRect.right + scrollX + OFFSET,
      };
  }
}

export function Tooltip<T extends React.ElementType = "button">({
  content,
  children,
  position = "top",
  delay = 400,
  className,
  disabled = false,
  showWhen = true,
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState<Coords>({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current || !tooltipRef.current) return;
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    setCoords(getPosition(triggerRect, tooltipRect, position));
  }, [position]);

  const show = useCallback(() => {
    if (disabled || showWhen === false) return;
    timerRef.current = setTimeout(() => setVisible(true), delay);
  }, [disabled, delay, showWhen]);

  const hide = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(false);
  }, []);

  useEffect(() => {
    if (visible) requestAnimationFrame(updatePosition);
  }, [visible, updatePosition]);

  useEffect(() => {
    if (!showWhen) {
      if (timerRef.current) clearTimeout(timerRef.current);
      setVisible(false);
    }
  }, [showWhen]);

  const arrowClasses: Record<TooltipPosition, string> = {
    top: "bottom-[-4px] left-1/2 -translate-x-1/2 border-l border-t border-[var(--dash-border)]",
    bottom:
      "top-[-4px]    left-1/2 -translate-x-1/2 border-r border-b border-[var(--dash-border)]",
    left: "right-[-4px]  top-1/2  -translate-y-1/2 border-r border-t border-[var(--dash-border)]",
    right:
      "left-[-4px]   top-1/2  -translate-y-1/2 border-l border-b border-[var(--dash-border)]",
  };

  type ChildProps = React.ComponentPropsWithRef<T>;

  const childElement: AnyElement =
    typeof children === "string" || typeof children === "number" ? (
      <span>{children}</span>
    ) : (
      children
    );

  const trigger = React.cloneElement<ChildProps>(childElement, {
    ...childElement.props,
    ref: (node: HTMLElement | null) => {
      triggerRef.current = node;
      const existingRef = (
        children as unknown as { ref?: React.Ref<HTMLElement> }
      ).ref;
      if (typeof existingRef === "function") existingRef(node);
      else if (
        existingRef &&
        typeof existingRef === "object" &&
        "current" in existingRef
      ) {
        (existingRef as React.MutableRefObject<HTMLElement | null>).current =
          node;
      }
    },
    onMouseEnter: (e: React.MouseEvent) => {
      show();
      childElement.props.onMouseEnter?.(e);
    },
    onMouseLeave: (e: React.MouseEvent) => {
      hide();
      childElement.props.onMouseLeave?.(e);
    },
    onFocus: (e: React.FocusEvent) => {
      show();
      childElement.props.onFocus?.(e);
    },
    onBlur: (e: React.FocusEvent) => {
      hide();
      childElement.props.onBlur?.(e);
    },
  } as Partial<ChildProps>);

  return (
    <>
      {trigger}
      {mounted &&
        visible &&
        createPortal(
          <div
            ref={tooltipRef}
            role="tooltip"
            style={{ top: coords.top, left: coords.left }}
            className={clsx(
              "pointer-events-none fixed z-9999",
              "max-w-[240px] px-3! py-2! rounded-xl",
              "bg-dash-surface border border-dash-border shadow-xl",
              "font-label text-[11px] tracking-[0.2em] uppercase text-dash-gold",
              "animate-in fade-in zoom-in-95 duration-150",
              className,
            )}
          >
            {content}
            <span
              className={clsx(
                "absolute w-2 h-2 rotate-45 bg-dash-surface",
                arrowClasses[position],
              )}
            />
          </div>,
          document.body,
        )}
    </>
  );
}

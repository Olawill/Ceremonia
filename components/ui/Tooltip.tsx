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
const AUTO_HIDE_DURATION = 2200; // ms before tooltip disappears on its own

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
  const [coords, setCoords] = useState<Coords | null>(null);
  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);

  const triggerRef = useRef<HTMLElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoHideRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const show = useCallback(() => {
    if (disabled || showWhen === false) return;
    timerRef.current = setTimeout(() => setVisible(true), delay);
  }, [disabled, delay, showWhen]);

  const hide = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (autoHideRef.current) clearTimeout(autoHideRef.current);
    setVisible(false);
    setCoords(null);
  }, []);

  useEffect(() => {
    if (!visible) {
      setReady(false);
      setCoords(null);
      if (autoHideRef.current) clearTimeout(autoHideRef.current);
      return;
    }
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!triggerRef.current || !tooltipRef.current) return;
        const triggerRect = triggerRef.current.getBoundingClientRect();
        const tooltipRect = tooltipRef.current.getBoundingClientRect();
        setCoords(getPosition(triggerRect, tooltipRect, position));
        setReady(true);
      });
    });
    // Auto-hide after duration
    autoHideRef.current = setTimeout(() => {
      setVisible(false);
    }, AUTO_HIDE_DURATION);
    return () => {
      if (autoHideRef.current) clearTimeout(autoHideRef.current);
    };
  }, [visible, position]);

  useEffect(() => {
    if (!showWhen) {
      if (timerRef.current) clearTimeout(timerRef.current);
      setVisible(false);
    }
  }, [showWhen]);

  const arrowClasses: Record<TooltipPosition, string> = {
    top: "bottom-[-4px] left-1/2 -translate-x-1/2 border-l border-t border-dash-gold/60",
    bottom:
      "top-[-4px] left-1/2 -translate-x-1/2 border-r border-b border-dash-gold/60",
    left: "right-[-4px] top-1/2 -translate-y-1/2 border-r border-t border-dash-gold/60",
    right:
      "left-[-4px] top-1/2 -translate-y-1/2 border-l border-b border-dash-gold/60",
  };

  const transformOriginClasses: Record<TooltipPosition, string> = {
    top: "origin-bottom",
    bottom: "origin-top",
    left: "origin-right",
    right: "origin-left",
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
            style={{
              position: "fixed",
              top: coords?.top ?? -9999,
              left: coords?.left ?? -9999,
              zIndex: 9999,
              opacity: ready ? 1 : 0,
              transform: ready ? "scale(1)" : "scale(0.92)",
              transformOrigin: {
                top: "bottom center",
                bottom: "top center",
                left: "right center",
                right: "left center",
              }[position],
              transition: ready
                ? "opacity 120ms ease-out, transform 120ms ease-out"
                : "none",
              pointerEvents: "none",
            }}
            className={clsx(
              "max-w-[240px] px-3! py-2! rounded-xl",
              "bg-dash-surface border border-dash-gold/60 shadow-xl",
              "font-label text-[11px] tracking-[0.2em] uppercase text-dash-gold",
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

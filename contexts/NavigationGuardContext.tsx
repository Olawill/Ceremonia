"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";

import { UnsavedChangesDialog } from "@/components/dashboard/UnsavedChangesDialog";

interface NavigationBlockerContextProps {
  isBlocked: boolean;
  setIsBlocked: (blocked: boolean) => void;
  dialogOpen: boolean;
  confirmExit: () => Promise<boolean>;
}

const NavigationBlockerContext = createContext<NavigationBlockerContextProps>({
  isBlocked: false,
  setIsBlocked: () => {},
  dialogOpen: false,
  confirmExit: () => Promise.resolve(true),
});

export function NavigationBlockerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isBlocked, setIsBlocked] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const resolverRef = useRef<((confirmed: boolean) => void) | null>(null);

  const confirmExit = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setDialogOpen(true);
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setDialogOpen(false);
    resolverRef.current?.(true);
    resolverRef.current = null;
  }, []);

  const handleDismiss = useCallback(() => {
    setDialogOpen(false);
    resolverRef.current?.(false);
    resolverRef.current = null;
  }, []);

  return (
    <NavigationBlockerContext.Provider
      value={{ isBlocked, setIsBlocked, dialogOpen, confirmExit }}
    >
      {/* Always mounted — never conditionally rendered */}
      <UnsavedChangesDialog
        open={dialogOpen}
        onConfirm={handleConfirm}
        onDismiss={handleDismiss}
      />
      {children}
    </NavigationBlockerContext.Provider>
  );
}

export function useNavigationBlocker() {
  return useContext(NavigationBlockerContext);
}

"use client";

import { createApiClient } from "@/lib/api";
import { useAuth } from "@clerk/nextjs";
import { useMemo } from "react";

export function useApi() {
  const { getToken } = useAuth();
  return useMemo(() => createApiClient(getToken), [getToken]);
}

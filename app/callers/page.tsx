"use client";

import CallerMgmtList from "@/components/caller/caller-mgmt-list";
import { useCallers } from "@/hooks/useCallers";

export default function CallersPage() {
  const { callers, isLoading, error } = useCallers();

  if (isLoading) {
    return <div>Loading...</div>; 
  }

  if (error) {
    return <div>{error}</div>; 
  }

  return <CallerMgmtList callers={callers} />;
}

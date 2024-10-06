"use client";
import { useLiveQuery } from "dexie-react-hooks";
import { CallerService } from "@/lib/services/caller.service";
import { useState } from "react";

export function useCallers() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const callers = useLiveQuery(async () => {
    try {
      const data = await CallerService.getAllCallers();
      setIsLoading(false);
      return data;
    } catch (err) {
      setIsLoading(false);
      setError("Failed to fetch callers");
      console.error(err);
    }
  }, []);

  return { callers, isLoading, error };
}

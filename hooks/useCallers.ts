"use client";
import { useLiveQuery } from "dexie-react-hooks";
import { callerService } from "@/lib/services/caller.service";
import { useState } from "react";

export function useCallers() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  
  const callers = useLiveQuery(async () => {
    console.log("useCallers");
    try {
      const data = await callerService.getAllCallers();
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

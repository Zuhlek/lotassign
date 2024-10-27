"use client";
import { useState, useEffect } from "react";
import { assignmentService } from "@/lib/services/assignment.service";
import { Assignment } from "@/lib/models/assignment.model";
import { Lot } from "@/lib/models/lot.model";

export function useAssignmentsByLot(lot: Lot) {
  const [assignmentsForLot, setAssignmentsForLot] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("useAssignmentsByLot", lot);
    const fetchAssignments = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (!lot.id) {
          setAssignmentsForLot([]);
          setIsLoading(false);
          return;
        }

        // Fetch Assignments using the Assignment Service
        const assignments = await assignmentService.getAssignmentsByLotId(lot.id);
        setAssignmentsForLot(assignments);
        setIsLoading(false);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch assignments");
        setIsLoading(false);
      }
    };

    if (lot) {
      fetchAssignments();
    } else {
      setAssignmentsForLot([]);
      setIsLoading(false);
    }
  }, [lot]);

  return { assignmentsForLot, isLoading, error };
}

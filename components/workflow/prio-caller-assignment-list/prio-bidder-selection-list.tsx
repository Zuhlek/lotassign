"use client";

import React, { useState, useEffect } from "react";
import { Box, Grid } from "@mui/material";
import PrioCallerAssignmentForm from "./prio-caller-assignment-form";
import PrioCallerAssignmentList from "./prio-caller-assignment-list";
import { useBiddersByAuctionId } from "@/hooks/useBiddersByAuctionId"; // Hook für Bidders
import { useCallers } from "@/hooks/useCallers"; // Hook für Callers
import { usePrioAssignments } from "@/hooks/usePrioAssignments"; // Hook für PrioAssignments
import { PrioCallerAssignmentService } from "@/lib/services/prioCallerAssignment.service";

interface PrioBidderSelectionListProps {
  auctionId: number;
}

export default function PrioBidderSelectionList({ auctionId }: PrioBidderSelectionListProps) {

  const { bidders, isLoading: biddersLoading, error: biddersError } = useBiddersByAuctionId(auctionId);
  const { prioAssignments } = usePrioAssignments(auctionId);
  const { callers, isLoading: callersLoading, error: callersError } = useCallers();

  const [prioAssignmentsMap, setPrioAssignmentsMap] = useState<Map<number, number>>(new Map());

  useEffect(() => {
    if (prioAssignments) {
      const assignmentsMap = new Map<number, number>();
      prioAssignments.forEach((assignment) => {
        assignmentsMap.set(assignment.bidderId, assignment.callerId);
      });
      setPrioAssignmentsMap(assignmentsMap);
    }
  }, [prioAssignments]);

  const handleCallerChange = (bidderId: number, callerId: number) => {
    const newPrioAssignments = new Map(prioAssignmentsMap);
    newPrioAssignments.set(bidderId, callerId);
    setPrioAssignmentsMap(newPrioAssignments);
  };

  const saveAssignments = async () => {
    if (prioAssignmentsMap) {
      for (const [bidderId, callerId] of prioAssignmentsMap.entries()) {
        const existingAssignment = prioAssignments?.find(
          (assignment) => assignment.bidderId === bidderId && assignment.callerId === callerId
        );

        if (!existingAssignment) {
          await PrioCallerAssignmentService.createPrioAssignment({
            auctionId,
            bidderId,
            callerId,
          });
        }
      }
    }
    alert("Zuordnungen erfolgreich gespeichert.");
  };

  if (biddersLoading || callersLoading) {
    return <div>Loading...</div>;
  }

  if (biddersError || callersError) {
    return <div>Error: {biddersError || callersError}</div>;
  }

  return (
    <Box sx={{ padding: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={7}>
          <PrioCallerAssignmentForm
            bidders={bidders}
            allCallers={callers || []}
            prioAssignments={prioAssignmentsMap}
            handleCallerChange={handleCallerChange}
            saveAssignments={saveAssignments}
          />
        </Grid>
        <Grid item xs={5}>
          <PrioCallerAssignmentList
            prioAssignments={prioAssignments || []}
            bidders={bidders}
            callers={callers || []}
          />
        </Grid>
      </Grid>
    </Box>
  );
}

"use client";
import { Assignment } from "@/lib/models/assignment.model";
import { Lot } from "@/lib/models/lot.model";
import { AssignmentService } from "@/lib/services/assignment.service";
import { Box, Typography } from "@mui/material";
import { useEffect, useState } from "react";

interface LotAnalysisDashboardProps {
  lots: Lot[];
}

export default function LotAnalysisDashboard({ lots }: LotAnalysisDashboardProps) {
  const [totalAssignments, setTotalAssignments] = useState<number>(0);
  const [assignmentsWithCallers, setAssignmentsWithCallers] = useState<number>(0);

  useEffect(() => {
    async function fetchAssignments() {
      let total = 0;
      let withCallers = 0;

      for (const lot of lots) {
        if (!lot.assignmentIds) continue;
        total += lot.assignmentIds.length;
        const assignments = await Promise.all(lot.assignmentIds.map(id => AssignmentService.getAssignmentById(id)));
        withCallers += assignments.filter((a) => a?.callerId !== undefined).length;
      }

      setTotalAssignments(total);
      setAssignmentsWithCallers(withCallers);
    }

    fetchAssignments();
  }, [lots]);

  const progressPercentage = totalAssignments > 0 ? (assignmentsWithCallers / totalAssignments) * 100 : 0;

  const getBackgroundColor = (percentage: number) => {
    if (percentage === 100) {
      return "green";
    } else if (percentage > 80) {
      return "yellow";
    } else if (percentage > 50) {
      return "orange";
    } else {
      return "red";
    }
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      sx={{ width: "100%", marginTop: 2, paddingTop: 1, paddingBottom: 1, borderRadius: 1 }}
      justifyContent="center"
      alignItems="center"
      bgcolor="thistle"
    >
      <Box
        sx={{
          width: "80%",
          height: 20,
          backgroundColor: "lightgrey",
          borderRadius: 5,
          overflow: "hidden",
          marginBottom: 1,
        }}
      >
        <Box
          sx={{
            height: "100%",
            width: `${progressPercentage}%`,
            backgroundColor: getBackgroundColor(progressPercentage),
            transition: "width 0.5s",
          }}
        />
      </Box>
      <Typography>{totalAssignments - assignmentsWithCallers} missing callers</Typography>
    </Box>
  );
}

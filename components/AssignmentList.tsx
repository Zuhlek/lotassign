"use client";
import {
  AssignmentsWithCallersAndBidders,
  CallerWithDesiredBiddersAndTheirInterestedLots,
  LotWithAssignmentsWithCallersAndBidders,
} from "@/lib/assignment/assignmentFunctions";
import { Box, Divider, Typography } from "@mui/material";
import { Bidder } from "@prisma/client";

interface AssignmentListProps {
  title: string;
  lots: LotWithAssignmentsWithCallersAndBidders[];
}

export default function AssignmentList({ title, lots }: AssignmentListProps) {
  const assignments: AssignmentsWithCallersAndBidders[] = lots.flatMap((l) => l.assignments);

  function getBidderCallerAssignmentComponent(bidder: Bidder, lotId: string) {
    const assignment = assignments?.find((a) => a.bidderId === bidder.id && a.lotId === lotId);
    const assignedCaller = lots.find((l) => l.id === lotId)?.assignments.find((a) => a.callerId === assignment?.callerId)?.caller;

    if (!assignment) {
      return (
        <Box key={bidder.id}>
          <Typography>🧍{bidder.name} no assignment</Typography>
        </Box>
      );
    } else if (!assignedCaller) {
      return (
        <Box key={bidder.id}>
          <Typography>🧍{bidder.name} no 📞 assigned</Typography>
        </Box>
      );
    } else {
      return (
        <Box key={bidder.id}>
          <Typography>
            🧍{bidder.name} 📞{assignedCaller.name}{" "}
          </Typography>
        </Box>
      );
    }
  }

  return (
    <Box display="flex" flexDirection="column" padding={2}>
      <Typography variant="h5">{title}</Typography>
      <Divider sx={{ marginY: 2 }} />
      {lots.map((lot) => (
        <Box key={lot.id}>
          <Typography variant="h6">Lot {lot.number}</Typography>
          {lot.assignments.map((a) => (
            <Box key={a.id}>{getBidderCallerAssignmentComponent(a.bidder, lot.id)}</Box>
          ))}
          <Divider sx={{ marginY: 2 }} />
        </Box>
      ))}
    </Box>
  );
}

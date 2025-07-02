import React from "react";
import { Box, Button, Card, List, ListItem, Typography } from "@mui/material";
import { Bidder } from "@/lib/models/bidder.model";
import { Caller } from "@/lib/models/caller.model";
import { PrioCallerAssignment } from "@/lib/models/lot-bidder.model";
import { prioCallerAssignmentService } from "@/lib/services/prio-caller-assignment.service";

interface PrioCallerAssignmentListProps {
  prioAssignments: PrioCallerAssignment[];
  bidders: Bidder[];
  callers: Caller[];
}

export default function PrioCallerAssignmentList({ prioAssignments, bidders, callers }: PrioCallerAssignmentListProps) {
  const getBidderName = (bidderId: number) => {
    const bidder = bidders.find((b) => b.id === bidderId);
    return bidder ? bidder.name : "Unbekannter Bidder";
  };

  const getCallerName = (callerId: number) => {
    const caller = callers.find((c) => c.id === callerId);
    return caller ? caller.name : "Unbekannter Caller";
  };

  const handleDelete =  (prioAssignmentId: number | undefined) =>  async () => {
    if(!prioAssignmentId) return;
    await prioCallerAssignmentService.deletePrioCallerAssignment(prioAssignmentId);
  }

  return (
    <Box display="flex" justifyContent="start" alignContent="center">
      <List sx={{ padding:0, margin:0}}>
        {prioAssignments.map((assignment) => (
          <ListItem key={`${assignment.bidder.id}-${assignment.caller.id}`} dense sx={{ padding:0, margin:0}}>
            <Card sx={{ paddingLeft:1, paddingRight:1}}>{`${getBidderName(assignment.bidder.id!)} → ${getCallerName(assignment.caller.id!)}`}</Card>
          <Button color="error" onClick={handleDelete(assignment.id)}>X</Button>
          </ListItem>
        ))}
      </List>
    </Box>
  );
}

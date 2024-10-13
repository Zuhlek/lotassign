"use client";
import { Lot } from "@/lib/models/lot.model";
import { Card, CardContent, CardHeader, Grid, Paper, Typography } from "@mui/material";
import LotAssignmentListItemAssignment from "./lot-assignment-list-item-assignment";
import { useAssignmentsByLot } from "@/hooks/useAssignmentsByLot";
import { use, useEffect, useState } from "react";

interface LotAssignmentListItemProps {
  lot: Lot;
}

export default function LotAssignmentListItem({ lot }: LotAssignmentListItemProps) {
  const { assignmentsForLot, isLoading: biddersLoading, error: biddersError } = useAssignmentsByLot(lot);
  const [allBiddersAreAssigned, setAllBiddersAreAssigned] = useState(false);

  let bgcolor = allBiddersAreAssigned ? "#fad1d1" : "#cefdce";

  useEffect(() => {
    if (assignmentsForLot) {
      const assignedBidders = assignmentsForLot.some((a) => !a.callerId);
      setAllBiddersAreAssigned(assignedBidders);
    }
  }, [assignmentsForLot]);

  if (biddersLoading) {
    return <div>Loading...</div>;
  }

  if (biddersError) {
    return <div>Error: {biddersError}</div>;
  }

  return (
    <Card sx={{ padding: 2, height: "100%", bgcolor: bgcolor }}>
      <CardContent>
        <Typography variant="h6" align="center">🖼️ {lot.number}</Typography>
        <Typography variant="body2" align="center">{lot.description}</Typography>
      </CardContent>

      <Grid container>
        <Grid item xs={12}>
          {assignmentsForLot && assignmentsForLot.map((a) => <LotAssignmentListItemAssignment key={a.id} assignment={a} />)}
        </Grid>
      </Grid>
    </Card>
  );
}

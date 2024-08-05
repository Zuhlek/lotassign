"use client";
import { Lot } from "@/lib/models/lot.model";
import { db } from "@/lib/dexie.db";
import { useLiveQuery } from "dexie-react-hooks";
import { Box, Grid, Paper, Typography } from "@mui/material";
import LotAssignmentListItemAssignment from "./lot-assignment-list-item-assignment";

interface LotAssignmentListItemProps {
  lot: Lot;
}

export default function LotAssignmentListItem({ lot }: LotAssignmentListItemProps) {
  const assignments = useLiveQuery(
    () => db.assignments.where("id").anyOf(lot.assignmentIds || []).toArray()
  );

  return (
    <Paper sx={{ padding: 2, marginBottom: 2, marginTop: 2 }}>
      <Grid container>
        <Grid item xs={4}>
          <Typography variant="h6">{lot.number}</Typography>
          <Typography variant="overline">{lot.description}</Typography>
        </Grid>
        <Grid item xs={8}>
          {assignments &&
            assignments.map((assignment) => (
              <LotAssignmentListItemAssignment key={assignment.id} assignment={assignment} />
            ))}
        </Grid>
      </Grid>
    </Paper>
  );
}

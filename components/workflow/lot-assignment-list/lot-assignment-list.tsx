"use client";
import { db } from "@/lib/dexie.db";
import { useLiveQuery } from "dexie-react-hooks";
import { useParams } from "next/navigation";
import LotAssignmentListItem from "./lot-assignment-list-item";
import { Grid } from "@mui/material";

export default function LotAssignmentList() {
  const auctionId = Number(useParams().auctionId);
  const lots = useLiveQuery(() => db.lots.filter((lot) => lot.auctionId === auctionId).toArray());

  return (
    <Grid container spacing={2}>
      {lots &&
        lots.map((l) => (
          <Grid item xs={12} key={l.id}>
            <LotAssignmentListItem lot={l}></LotAssignmentListItem>
          </Grid>
        ))}
    </Grid>
  );
}

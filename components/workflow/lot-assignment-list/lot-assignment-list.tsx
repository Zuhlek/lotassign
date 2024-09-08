"use client";
import { db } from "@/lib/db/dexie.db";
import { useLiveQuery } from "dexie-react-hooks";
import { useParams } from "next/navigation";
import LotAssignmentListItem from "./lot-assignment-list-item";
import { Box, Grid, Typography } from "@mui/material";
import LotAnalysisDashboard from "./lot-analysis-dashboard";

export default function LotAssignmentList() {
  const auctionId = Number(useParams().auctionId);

  // Use live query to get lots
  const lots = useLiveQuery(async () => {
    return await db.lots.filter((lot) => lot.auctionId === auctionId).toArray();
  }, [auctionId]);


  if (!lots) {
    return <div>Loading...</div>;
  }

  return (
    <Box>
      <Grid container spacing={2}>
        {lots.map((lot) => (
          <Grid item xs={12} key={lot.id}>
            <LotAssignmentListItem lot={lot}></LotAssignmentListItem>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

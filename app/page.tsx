import prisma from "@/lib/db";
import { Box, Typography } from "@mui/material";
import React from "react";
import { getLotsForAuction } from "@/lib/assignment/assignmentFunctions";
import AssignmentWrapper from "@/components/AssignmentWrapper";

export default async function HomePage() {
  const auction = await prisma.auction.findFirst();
  if (!auction) {
    return <Typography>No auction found</Typography>;
  }

  const lots = await getLotsForAuction(auction.id);

  return (
    <div>
      <Box display="flex">
        <AssignmentWrapper auctionId={auction.id} lots={lots}></AssignmentWrapper>
      </Box>
    </div>
  );
}

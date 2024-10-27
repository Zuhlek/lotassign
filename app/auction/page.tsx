"use client";

import { Box } from "@mui/material";
import AuctionList from "@/components/auction/auction-list";
import LoadAuctionDummyDataButton from "@/components/buttons/load-auction-dummy-data-button";
import { useAuctions } from "@/hooks/useAuctions";

export default function AuctionPage() {
  const { auctions, searchText, setSearchText, isLoading, error } = useAuctions();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <Box>
      <Box
        display="flex"
        sx={{ width: "100%", marginTop: 4, marginBottom: 4, paddingTop: 1, paddingBottom: 1, borderRadius: 1 }}
        justifyContent="center"
        bgcolor="lightsteelblue"
      >
        <LoadAuctionDummyDataButton></LoadAuctionDummyDataButton>
      </Box>
      <AuctionList auctions={auctions} searchText={searchText} setSearchText={setSearchText} />
    </Box>
  );
}

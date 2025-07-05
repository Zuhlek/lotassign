"use client";

import { useEffect, useState } from "react";
import { Box } from "@mui/material";
import AuctionList from "@/components/auction/auction-list";
import LoadAuctionDummyDataButton from "@/components/buttons/load-auction-dummy-data-button";
import { getAllAuctions } from "@/lib/actions/auction.actions";
import { Auction } from "@/lib/models/auction.model";

export default function AuctionPage() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [searchText, setSearchText] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAuctions = async () => {
      try {
        const data = await getAllAuctions();
        setAuctions(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load auctions.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAuctions();
  }, []);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <Box>
      <Box
        display="flex"
        sx={{ width: "100%", marginTop: 4, marginBottom: 4, paddingTop: 1, paddingBottom: 1, borderRadius: 1 }}
        justifyContent="center"
        bgcolor="lightsteelblue"
      >
        <LoadAuctionDummyDataButton onUploadComplete={(newAuction) => {
          setAuctions(prev => [...prev, newAuction]);
        }} />
      </Box>
      <AuctionList initialAuctions={auctions} searchText={searchText} setSearchText={setSearchText} />
    </Box>
  );
}

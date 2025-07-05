"use client";

import { useState } from "react";
import { Box } from "@mui/material";

import { Auction } from "@/lib/models/auction.model";
import { getAllAuctions, createAuction, updateAuction, deleteAuction } from "@/lib/actions/auction.actions";

import AuctionListItem from "./auction-list-item";
import AuctionCreateUpdateDialog from "./auction-create-update-dialog";
import AuctionListToolbar from "./auction-list-toolbar";

interface AuctionListProps {
  initialAuctions: Auction[];
  searchText: string;
  setSearchText: React.Dispatch<React.SetStateAction<string>>;
}

export default function AuctionList({ initialAuctions, searchText, setSearchText }: AuctionListProps) {
  const [auctions, setAuctions] = useState<Auction[]>(initialAuctions);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(true);
  const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null);

  const refreshAuctions = async () => {
    const fresh = await getAllAuctions();
    setAuctions(fresh); // Already Auction[]
  };

  const handleOpenDialog = (createMode: boolean, auction?: Auction) => {
    setIsCreateMode(createMode);
    setSelectedAuction(createMode ? null : auction ?? null);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedAuction(null);
  };

  const handleCreateAuction = async (auction: Auction): Promise<number | undefined> => {
    const id = await createAuction(auction);
    await refreshAuctions();
    return id;
  };

  const handleUpdateAuction = async (auction: Auction): Promise<number | undefined> => {
    const id = await updateAuction(auction);
    await refreshAuctions();
    return id;
  };

  const handleDeleteAuction = async (auctionId?: number) => {
    if (!auctionId) return;
    await deleteAuction(auctionId);
    await refreshAuctions();
  };

  const handleSelect = (auction: Auction) => {
    setSelectedAuction(auction);
  };

  const filtered = auctions.filter((a) =>
    a.name.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div>
      <AuctionListToolbar
        searchText={searchText}
        setSearchText={setSearchText}
        handleOpen={() => handleOpenDialog(true)}
      />
      <Box display="flex" flexWrap="wrap" gap={2}>
        {filtered.map((auction) => (
          <AuctionListItem
            key={auction.id}
            auction={auction}
            handleOpenDialog={() => handleOpenDialog(false, auction)}
            handleDelete={handleDeleteAuction}
            handleSelection={handleSelect}
          />
        ))}
      </Box>
      <AuctionCreateUpdateDialog
        selectedAuction={selectedAuction ?? undefined}
        isVisible={dialogOpen}
        isCreateMode={isCreateMode}
        handleCloseDialog={handleCloseDialog}
        handleCreate={handleCreateAuction}
        handleUpdate={handleUpdateAuction}
      />
    </div>
  );
}

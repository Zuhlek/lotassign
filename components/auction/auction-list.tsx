"use client";
import { Auction } from "@/lib/models/auction.model";
import { AuctionService } from "@/lib/services/auction.service";
import { useLiveQuery } from "dexie-react-hooks";
import { Box, Button } from "@mui/material";
import { useState } from "react";
import { db } from "@/lib/dexie.db";
import AuctionListItem from "./auction-list-item";
import AuctionCreateUpdateDialog from "./auction-create-update-dialog";
import AuctionListToolbar from "./auction-list-toolbar";

export default function AuctionList() {
  const [searchText, setSearchText] = useState<string>("");
  const auctions = useLiveQuery(
    () =>
      db.auctions
        .filter((auction) => auction.name.toLowerCase().includes(searchText.toLowerCase()))
        .toArray(),
    [searchText]
  );
  const [isDialogVisible, setIsDialogVisible] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [selectedAuction, setSelectedAuction] = useState<Auction>({ name: "", date: new Date() });

  const handleCreateAuction = async (auction: Auction): Promise<number | undefined> => {
    return await AuctionService.createAuction(auction);
  };

  const handleUpdateAuction = async (auction: Auction): Promise<number | undefined> => {
    if (auction.id !== null && auction.id !== undefined) {
      return await AuctionService.updateAuction(auction.id, auction);
    } else {
      console.error(
        "Auction object does not contain auctionId which is required for an update operation"
      );
    }
  };

  const handleOpenDialog = (createMode: boolean) => {
    setIsCreateMode(createMode);
    setIsDialogVisible(true);
  };

  const handleCloseDialog = () => {
    setIsDialogVisible(false);
  };

  const handleDeleteClick = async (auctionId: number | undefined) => {
    if (auctionId) {
      await AuctionService.deleteAuction(auctionId);
    } else {
      console.error("Failed to delete auction: ", auctionId);
    }
  };

  const handleSelection = (auction: Auction) => {
    setSelectedAuction(auction);
  };

  if (!auctions) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <AuctionListToolbar
        searchText={searchText}
        setSearchText={setSearchText}
        handleOpen={handleOpenDialog}
      ></AuctionListToolbar>
      <Box display="flex">
        {auctions.map((a) => (
          <AuctionListItem
            key={a.id}
            auction={a}
            handleOpenDialog={() => handleOpenDialog(false)}
            handleDelete={handleDeleteClick}
            handleSelection={handleSelection}
          ></AuctionListItem>
        ))}
      </Box>{" "}
      <AuctionCreateUpdateDialog
        selectedAuction={selectedAuction}
        isVisible={isDialogVisible}
        handleCloseDialog={handleCloseDialog}
        isCreateMode={isCreateMode}
        handleCreate={handleCreateAuction}
        handleUpdate={handleUpdateAuction}
      ></AuctionCreateUpdateDialog>
    </div>
  );
}

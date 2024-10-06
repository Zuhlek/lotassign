"use client";
import { Auction } from "@/lib/models/auction.model";
import { Box } from "@mui/material";
import { useState } from "react";
import AuctionListItem from "./auction-list-item";
import AuctionCreateUpdateDialog from "./auction-create-update-dialog";
import AuctionListToolbar from "./auction-list-toolbar";
import { AuctionService } from "@/lib/services/auction.service";

interface AuctionListProps {
  auctions: Auction[] | undefined;
  searchText: string;
  setSearchText: React.Dispatch<React.SetStateAction<string>>;
}

export default function AuctionList({ auctions, searchText, setSearchText }: AuctionListProps) {
  const [isDialogVisible, setIsDialogVisible] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [selectedAuction, setSelectedAuction] = useState<Auction>({ name: "", date: new Date() });


  const handleCreateAuction = async (auction: Auction): Promise<number | undefined> => {
    return await AuctionService.createAuction(auction);
  };

  const handleUpdateAuction = async (auction: Auction): Promise<number | undefined> => {
      return await AuctionService.updateAuction(auction.id, auction);
  };

  const handleOpenDialog = (createMode: boolean) => {
    setIsCreateMode(createMode);
    setIsDialogVisible(true);
  };

  const handleCloseDialog = () => {
    setIsDialogVisible(false);
  };

  const handleDeleteClick = async (auctionId: number | undefined) => {
    await AuctionService.deleteAuction(auctionId);
  };

  const handleSelection = (auction: Auction) => {
    setSelectedAuction(auction);
  };

  return (
    <div>
      <AuctionListToolbar
        searchText={searchText}
        setSearchText={setSearchText}
        handleOpen={handleOpenDialog}
      ></AuctionListToolbar>
      <Box display="flex">
        {auctions && auctions.map((a) => (
          <AuctionListItem
            key={a.id}
            auction={a}
            handleOpenDialog={() => handleOpenDialog(false)}
            handleDelete={handleDeleteClick}
            handleSelection={handleSelection}
          ></AuctionListItem>
        ))}
      </Box>
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

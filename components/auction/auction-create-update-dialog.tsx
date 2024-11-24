"use client";
import { Auction } from "@/lib/models/auction.model";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Modal,
  TextField,
} from "@mui/material";
import { useEffect, useState } from "react";

interface AuctionCreateUpdateDialogProps {
  selectedAuction: Auction | undefined;
  isVisible: boolean;
  isCreateMode: boolean;
  handleCloseDialog: () => void;
  handleCreate: (auction: Auction) => Promise<number | undefined>;
  handleUpdate: (auction: Auction) => Promise<number | undefined>;
}

export default function AuctionCreateUpdateDialog({
  selectedAuction,
  isVisible,
  isCreateMode,
  handleCloseDialog,
  handleCreate,
  handleUpdate,
}: AuctionCreateUpdateDialogProps) {
  const [name, setName] = useState(selectedAuction ? selectedAuction.name : "");
  const [date, setDate] = useState(selectedAuction ? selectedAuction.date : new Date());

  useEffect(() => {
    if (!isCreateMode && selectedAuction) {
      setName(selectedAuction.name);
      setDate(selectedAuction.date);
    }
  }, [selectedAuction, isCreateMode]);

  const handleCreateClick = async () => {
    const auction = new Auction(undefined, name, new Date());
    const createdAuctionId = await handleCreate(auction);
    if (createdAuctionId) {
      handleCloseDialog();
      setName("");
    } else {
      console.error("Unable to create new auction.");
    }
  };

  const handleUpdateClick = async () => {
    if (!selectedAuction) return;
    const auction = new Auction(selectedAuction.id, name, date);
    const updateAuctionId = await handleUpdate(auction);
    if (updateAuctionId) {
      handleCloseDialog();
      setName("");
      setDate(new Date())
    } else {
      console.error("Unable to update auction.");
    }
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  if (isVisible) {
    return (
      <Dialog open={isVisible} onClose={handleCloseDialog}>
        <DialogTitle>{isCreateMode ? "Create Auction" : "Edit Auction"}</DialogTitle>
        <DialogContent>
          <TextField label="name" value={name} onChange={(event) => setName(event.target.value)}></TextField>
          {!isCreateMode && (
            <TextField type="date" value={formatDate(date)} onChange={(event) => setDate(new Date(event.target.value))}></TextField>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={isCreateMode ? handleCreateClick : handleUpdateClick}>
            {isCreateMode ? "Create" : "Update"}
          </Button>
        </DialogActions>
      </Dialog>
    );
  } else {
    <></>;
  }
}

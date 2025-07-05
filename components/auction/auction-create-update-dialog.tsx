"use client";

import { Auction } from "@/lib/models/auction.model";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
  const [name, setName] = useState("");
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    if (isCreateMode) {
      setName("");
      setDate(new Date());
    } else if (selectedAuction) {
      setName(selectedAuction.name);
      setDate(selectedAuction.date);
    }
  }, [isVisible, isCreateMode, selectedAuction]);

  const handleCreateClick = async () => {
    const auction = new Auction(name, date);
    const createdId = await handleCreate(auction);
    if (createdId) handleCloseDialog();
    else console.error("Unable to create new auction.");
  };

  const handleUpdateClick = async () => {
    if (!selectedAuction) return;
    const updated = new Auction(name, date, selectedAuction.lots, selectedAuction.id);
    const updatedId = await handleUpdate(updated);
    if (updatedId) handleCloseDialog();
    else console.error("Unable to update auction.");
  };


  const formatDate = (date: Date) => date.toISOString().split("T")[0];

  return (
    <Dialog open={isVisible} onClose={handleCloseDialog}>
      <DialogTitle>{isCreateMode ? "Create Auction" : "Edit Auction"}</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
        <TextField
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        {!isCreateMode && (
          <TextField
            type="date"
            value={formatDate(date)}
            onChange={(e) => setDate(new Date(e.target.value))}
            label="Date"
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={isCreateMode ? handleCreateClick : handleUpdateClick}>
          {isCreateMode ? "Create" : "Update"}
        </Button>
        <Button onClick={handleCloseDialog}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
}

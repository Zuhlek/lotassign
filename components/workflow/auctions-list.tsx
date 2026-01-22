"use client"

import { useState } from "react"
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Alert,
} from "@mui/material"
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material"
import { Auction } from "@/lib/models/auction.model"

interface AuctionListProps {
  auctions: Auction[]
  selectedAuction: Auction | null
  onSelectAuction: (a: Auction) => void
  onSaveAuction: (data: { id?: number; name: string; date: string }) => Promise<void>
  onDeleteAuction: (a: Auction) => void
}

export default function AuctionList({
  auctions,
  selectedAuction,
  onSelectAuction,
  onSaveAuction,
  onDeleteAuction
}: AuctionListProps) {
  const [open, setOpen] = useState(false)

  const toDateString = (date: Date): string => {
    return date.toISOString().split("T")[0] ?? ""
  }

  const [form, setForm] = useState<{ id?: number; name: string; date: string }>({
    id: undefined,
    name: "",
    date: toDateString(new Date())
  })
  const [dialogError, setDialogError] = useState<string | null>(null)

  const openDialog = (auction?: Auction) => {
    setForm(
      auction
        ? { id: auction.id, name: auction.name, date: toDateString(auction.date) }
        : { id: undefined, name: "", date: toDateString(new Date()) }
    )
    setDialogError(null)
    setOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      setDialogError("Name is required.")
      return
    }
    await onSaveAuction(form)
    setOpen(false)
  }

  return (
    <>
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h4">Auctions</Typography>
        <Button variant="contained" onClick={() => openDialog()} startIcon={<AddIcon />}>
          Add
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Date</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {auctions.map(a => (
              <TableRow
                key={a.id}
                hover
                onClick={() => onSelectAuction(a)}
                selected={selectedAuction?.id === a.id}
                sx={{ cursor: "pointer" }}
              >
                <TableCell>{a.name}</TableCell>
                <TableCell>{new Date(a.date).toLocaleDateString()}</TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={e => {
                      e.stopPropagation()
                      openDialog(a)
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={e => {
                      e.stopPropagation()
                      onDeleteAuction(a)
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{form.id ? "Edit Auction" : "Add Auction"}</DialogTitle>
        <DialogContent>
          <TextField
            label="Name"
            fullWidth
            margin="normal"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          />
          <TextField
            type="date"
            label="Date"
            fullWidth
            margin="normal"
            value={form.date}
            onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          {dialogError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {dialogError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            {form.id ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

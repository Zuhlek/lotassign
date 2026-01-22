"use client"

import { useState } from "react"
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Typography, Divider, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Alert } from "@mui/material"
import { Add as AddIcon, Edit as EditIcon } from "@mui/icons-material"
import DeleteIcon from "@mui/icons-material/Delete"
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
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ my: 4 }}>
        <Typography variant="h4">Auctions</Typography>
        <Button variant="contained" onClick={() => openDialog()}>
          <AddIcon />
        </Button>
      </Box>
      <Divider />
      <TableContainer component={Paper}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell><Typography variant="h6">Name</Typography></TableCell>
              <TableCell><Typography variant="h6">Date</Typography></TableCell>
              <TableCell align="right"><Typography variant="h6">Actions</Typography></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {auctions.map(a => (
              <TableRow
                key={a.id}
                hover
                onClick={() => onSelectAuction(a)}
                sx={{
                  cursor: "pointer",
                  backgroundColor: selectedAuction?.id === a.id ? "action.selected" : undefined
                }}
              >
                <TableCell>{a.name}</TableCell>
                <TableCell>{new Date(a.date).toLocaleDateString()}</TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    sx={{ p: 0, ml: 1 }}
                    onClick={e => {
                      e.stopPropagation()
                      openDialog(a)
                    }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    sx={{ p: 0, ml: 1 }}
                    onClick={e => {
                      e.stopPropagation()
                      onDeleteAuction(a)
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)}>
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
            fullWidth
            margin="normal"
            value={form.date}
            onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
          />
        </DialogContent>
        {dialogError && (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={50}>
            <Alert severity="error">{dialogError}</Alert>
          </Box>
        )}
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

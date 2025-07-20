"use client"

import { useState } from "react"
import {
  Box,
  Button,
  List,
  ListItem,
  ListItemText,
  Paper,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ListItemButton,
  Checkbox
} from "@mui/material"
import { Caller } from "@/lib/models/caller.model"
import { Auction } from "@/lib/models/auction.model"

interface AuctionCallersProps {
  selectedAuction: Auction | null
  callers: Caller[]
  selectedCallerIds: number[]
  onSaveCallers: (ids: number[]) => Promise<void>
}

export default function AuctionCallers({
  selectedAuction,
  callers,
  selectedCallerIds,
  onSaveCallers
}: AuctionCallersProps) {
  const [open, setOpen] = useState(false)
  const [localIds, setLocalIds] = useState<number[]>(selectedCallerIds)

  const toggleCaller = (id: number) => {
    setLocalIds(prev => (prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]))
  }

  const handleSave = async () => {
    await onSaveCallers(localIds)
    setOpen(false)
  }

  return (
    <>
      <Box mt={4} display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h4">Auction Callers</Typography>
        <Button
          variant="contained"
          component="span"
          onClick={() => {
            setLocalIds(selectedCallerIds)
            setOpen(true)
          }}
          disabled={!selectedAuction}
        >
          Manage
        </Button>
      </Box>

      {selectedAuction ? (
        <Paper>
          <List dense>
            {callers.filter(c => selectedCallerIds.includes(c.id!)).map(c => (
              <ListItem key={c.id}>
                <ListItemText primary={c.name} />
              </ListItem>
            ))}
          </List>
        </Paper>
      ) : (
        <Typography variant="body2" mt={2}>
          Select an auction to view details.
        </Typography>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Manage Auction Callers</DialogTitle>
        <DialogContent dividers>
          <List>
            {callers.map(c => (
              <ListItem key={c.id} disablePadding>
                <ListItemButton onClick={() => toggleCaller(c.id!)}>
                  <Checkbox edge="start" checked={localIds.includes(c.id!)} tabIndex={-1} />
                  <ListItemText primary={`${c.abbreviation || ""} ${c.name}`.trim()} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>Save</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

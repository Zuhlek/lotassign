"use client"

import { useState, useMemo } from "react"
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Typography,
} from "@mui/material"
import { Caller } from "@/lib/models/caller.model"
import { Bidder } from "@/lib/models/bidder.model"
import { Auction } from "@/lib/models/auction.model"

interface AuctionCallersProps {
  selectedAuction: Auction | null
  callers: Caller[]
  selectedCallerIds: number[]
  bidders: Bidder[]
  assignments: Record<number, number | undefined>
  onSave: (
    callerIds: number[],
    assignments: Record<number, number | undefined>
  ) => Promise<void>
}

export default function AuctionCallers({
  selectedAuction,
  callers,
  selectedCallerIds,
  bidders,
  assignments,
  onSave
}: AuctionCallersProps) {
  const [open, setOpen] = useState(false)
  const [localIds, setLocalIds] = useState<number[]>(selectedCallerIds)
  const [localAssign, setLocalAssign] =
    useState<Record<number, number | undefined>>(assignments)

  const bidderAvailable = (bidderId: number, callerId: number) =>
    localAssign[callerId] === bidderId ||
    Object.values(localAssign).every(id => id !== bidderId)

  const toggleCaller = (id: number) => {
    setLocalIds(prev =>
      prev.includes(id)
        ? prev.filter(c => c !== id)
        : [...prev, id]
    )
    setLocalAssign(prev => {
      const next = { ...prev }
      if (next[id] !== undefined) delete next[id]
      return next
    })
  }

  const handleBidderSelect = (callerId: number, value: string) => {
    setLocalAssign(prev => {
      const next = { ...prev }
      next[callerId] = value === "" ? undefined : Number(value)
      return next
    })
  }

  const handleSave = async () => {
    await onSave(localIds, localAssign)
    setOpen(false)
  }

  const callersInAuction = useMemo(
    () => callers.filter(c => selectedCallerIds.includes(c.id!)),
    [callers, selectedCallerIds]
  )

  return (
    <>
      <Box sx={{ mb: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h4">Callers</Typography>
        <Button
          variant="contained"
          disabled={!selectedAuction}
          onClick={() => {
            setLocalIds(selectedCallerIds)
            setLocalAssign(assignments)
            setOpen(true)
          }}
        >
          Manage
        </Button>
      </Box>

      {selectedAuction ? (
        <Paper sx={{ p: 2 }}>
          {callersInAuction.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 2 }}>
              No callers assigned. Click Manage to add callers.
            </Typography>
          ) : (
            <List dense disablePadding>
              {callersInAuction.map(c => {
                const bid = bidders.find(
                  b => assignments[c.id!] !== undefined && b.id === assignments[c.id!]
                )
                return (
                  <ListItem key={c.id} disablePadding>
                    <ListItemText
                      primary={c.name}
                      secondary={bid ? `Preferred: ${bid.name}` : undefined}
                    />
                  </ListItem>
                )
              })}
            </List>
          )}
        </Paper>
      ) : (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="body2" color="text.secondary">
            Select an auction to manage callers.
          </Typography>
        </Paper>
      )}

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Manage Auction Callers</DialogTitle>

        <DialogContent dividers>
          <List>
            {callers.map(c => (
              <ListItem key={c.id} disablePadding sx={{ py: 0.5 }}>
                <ListItemButton onClick={() => toggleCaller(c.id!)}>
                  <Checkbox edge="start" checked={localIds.includes(c.id!)} />
                  <ListItemText primary={`${c.abbreviation || ""} ${c.name}`.trim()} />
                </ListItemButton>

                {localIds.includes(c.id!) && (
                  <FormControl size="small" sx={{ ml: 2, minWidth: 220 }}>
                    <InputLabel>Preferred Bidder</InputLabel>
                    <Select
                      label="Preferred Bidder"
                      value={localAssign[c.id!] !== undefined ? String(localAssign[c.id!]) : ""}
                      onChange={e => handleBidderSelect(c.id!, e.target.value)}
                    >
                      <MenuItem value="">
                        <em>No preference</em>
                      </MenuItem>
                      {bidders
                        .filter(b => bidderAvailable(b.id!, c.id!))
                        .map(b => (
                          <MenuItem key={b.id} value={String(b.id)}>
                            {b.name}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                )}
              </ListItem>
            ))}
          </List>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

"use client"

import { useEffect, useState } from "react"
import {
  Box,
  Button,
  Collapse,
  FormControl,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Typography,
} from "@mui/material"
import {
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  Add as AddIcon,
} from "@mui/icons-material"
import { Caller } from "@/lib/models/caller.model"
import { Bidder } from "@/lib/models/bidder.model"
import { CallerPriority } from "@/lib/models/caller-priority.model"
import {
  getCallerPrioritiesByAuctionId,
  setCallerPriority,
} from "@/lib/actions/caller-priority.actions"

interface CallerPrioritiesProps {
  auctionId: number
  callers: Caller[]
  bidders: Bidder[]
}

export default function CallerPriorities({ auctionId, callers, bidders }: CallerPrioritiesProps) {
  const [priorities, setPriorities] = useState<Map<number, number[]>>(new Map())
  const [expandedCallers, setExpandedCallers] = useState<Set<number>>(new Set())
  const [addingTo, setAddingTo] = useState<number | null>(null)

  useEffect(() => {
    loadPriorities()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auctionId])

  const loadPriorities = async () => {
    const data = await getCallerPrioritiesByAuctionId(auctionId)
    const map = new Map<number, number[]>()
    data.forEach(cp => map.set(cp.callerId, cp.bidderIds))
    setPriorities(map)
  }

  const toggleExpanded = (callerId: number) => {
    setExpandedCallers(prev => {
      const next = new Set(prev)
      if (next.has(callerId)) next.delete(callerId)
      else next.add(callerId)
      return next
    })
  }

  const handleAddBidder = async (callerId: number, bidderId: number) => {
    const current = priorities.get(callerId) || []
    if (current.includes(bidderId)) return

    const updated = [...current, bidderId]
    await setCallerPriority(auctionId, callerId, updated)
    setPriorities(prev => new Map(prev).set(callerId, updated))
    setAddingTo(null)
  }

  const handleRemoveBidder = async (callerId: number, bidderId: number) => {
    const current = priorities.get(callerId) || []
    const updated = current.filter(id => id !== bidderId)
    await setCallerPriority(auctionId, callerId, updated)
    setPriorities(prev => new Map(prev).set(callerId, updated))
  }

  const handleMoveBidder = async (callerId: number, fromIndex: number, toIndex: number) => {
    const current = [...(priorities.get(callerId) || [])]
    const removed = current.splice(fromIndex, 1)[0]
    if (removed !== undefined) {
      current.splice(toIndex, 0, removed)
      await setCallerPriority(auctionId, callerId, current)
      setPriorities(prev => new Map(prev).set(callerId, current))
    }
  }

  const getBidderName = (bidderId: number) => {
    const bidder = bidders.find(b => b.id === bidderId)
    return bidder?.name || `Bidder #${bidderId}`
  }

  const getAvailableBidders = (callerId: number) => {
    const current = priorities.get(callerId) || []
    return bidders.filter(b => !current.includes(b.id!))
  }

  if (callers.length === 0) {
    return (
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Caller Priorities</Typography>
        <Typography color="text.secondary" sx={{ textAlign: "center", py: 2 }}>
          No callers assigned to this auction.
        </Typography>
      </Paper>
    )
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>Caller Priorities</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Set preferred bidders for each caller. The algorithm will try to honor these preferences.
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {callers.map(caller => {
          const isExpanded = expandedCallers.has(caller.id!)
          const callerPriorities = priorities.get(caller.id!) || []
          const availableBidders = getAvailableBidders(caller.id!)

          return (
            <Box
              key={caller.id}
              sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1 }}
            >
              {/* Caller header */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  p: 1.5,
                  cursor: "pointer",
                  bgcolor: isExpanded ? "grey.50" : "transparent",
                  "&:hover": { bgcolor: "grey.50" },
                }}
                onClick={() => toggleExpanded(caller.id!)}
              >
                <IconButton size="small" sx={{ mr: 1 }}>
                  {isExpanded ? <CollapseIcon /> : <ExpandIcon />}
                </IconButton>
                <Box sx={{ flex: 1 }}>
                  <Typography fontWeight={500}>
                    {caller.abbreviation || caller.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {callerPriorities.length} priorit{callerPriorities.length === 1 ? "y" : "ies"}
                  </Typography>
                </Box>
              </Box>

              {/* Expanded priority list */}
              <Collapse in={isExpanded}>
                <Box sx={{ borderTop: "1px solid", borderColor: "divider", p: 1.5 }}>
                  {callerPriorities.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      No priorities set.
                    </Typography>
                  ) : (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mb: 1 }}>
                      {callerPriorities.map((bidderId, index) => (
                        <Box
                          key={bidderId}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            p: 1,
                            bgcolor: "grey.50",
                            borderRadius: 1,
                          }}
                        >
                          <DragIcon fontSize="small" color="disabled" sx={{ cursor: "grab" }} />
                          <Typography
                            variant="body2"
                            sx={{
                              width: 20,
                              textAlign: "center",
                              fontWeight: 600,
                              color: "text.secondary",
                            }}
                          >
                            {index + 1}
                          </Typography>
                          <Typography variant="body2" sx={{ flex: 1 }}>
                            {getBidderName(bidderId)}
                          </Typography>
                          <Box sx={{ display: "flex", gap: 0.5 }}>
                            {index > 0 && (
                              <Button
                                size="small"
                                variant="text"
                                sx={{ minWidth: 0, p: 0.5 }}
                                onClick={() => handleMoveBidder(caller.id!, index, index - 1)}
                              >
                                ↑
                              </Button>
                            )}
                            {index < callerPriorities.length - 1 && (
                              <Button
                                size="small"
                                variant="text"
                                sx={{ minWidth: 0, p: 0.5 }}
                                onClick={() => handleMoveBidder(caller.id!, index, index + 1)}
                              >
                                ↓
                              </Button>
                            )}
                            <IconButton
                              size="small"
                              onClick={() => handleRemoveBidder(caller.id!, bidderId)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  )}

                  {/* Add bidder */}
                  {addingTo === caller.id ? (
                    <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                      <FormControl size="small" sx={{ flex: 1 }}>
                        <Select
                          displayEmpty
                          defaultValue=""
                          onChange={(e) => {
                            if (e.target.value) {
                              handleAddBidder(caller.id!, Number(e.target.value))
                            }
                          }}
                        >
                          <MenuItem value="" disabled>
                            Select bidder...
                          </MenuItem>
                          {availableBidders.map(bidder => (
                            <MenuItem key={bidder.id} value={bidder.id}>
                              {bidder.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <Button size="small" onClick={() => setAddingTo(null)}>
                        Cancel
                      </Button>
                    </Box>
                  ) : (
                    <Button
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={() => setAddingTo(caller.id!)}
                      disabled={availableBidders.length === 0}
                    >
                      Add Priority
                    </Button>
                  )}
                </Box>
              </Collapse>
            </Box>
          )
        })}
      </Box>
    </Paper>
  )
}

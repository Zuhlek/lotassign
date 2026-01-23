"use client"

import { useEffect, useState, useMemo, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  Grid,
  IconButton,
  LinearProgress,
  Link,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  Alert,
  Backdrop,
} from "@mui/material"
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CalendarMonth as CalendarIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  Lock as LockIcon,
  LockOpen as UnlockIcon,
  Info as InfoIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Upload as UploadIcon,
  PlayArrow as AssignIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material"
import ExcelJS from "exceljs"
import { Auction } from "@/lib/models/auction.model"
import { Lot } from "@/lib/models/lot.model"
import { LotBidder } from "@/lib/models/lot-bidder.model"
import { Bidder } from "@/lib/models/bidder.model"
import { Caller } from "@/lib/models/caller.model"
import {
  getAllAuctions,
  getAuctionById,
  createAuction,
  updateAuction,
  deleteAuction,
} from "@/lib/actions/auction.actions"
import { getLotsByAuctionId, createLot, deleteLotsByAuctionId } from "@/lib/actions/lot.actions"
import {
  getLotBiddersByAuctionId,
  createLotBidder,
  updateLotBidder,
  deleteLotBiddersByAuctionId,
} from "@/lib/actions/lot-bidder.actions"
import { getAllBidders, createBidder } from "@/lib/actions/bidder.actions"
import { getAllCallers } from "@/lib/actions/caller.actions"
import { getAuctionCallersByAuctionId, setAuctionCallers } from "@/lib/actions/auction-caller.actions"
import { languagesToLanguageArray, Language } from "@/lib/models/language.enum"
import { computeAssignments } from "@/lib/assignment.service"
import { getPlanningSnapshot, persistCallerAssignments } from "@/lib/actions/assignment-logic.actions"
import CallerPriorities from "@/components/workflow/caller-priorities"
import { parseConstraintNote, IndicatorSeverity } from "@/lib/algorithm/assignment-status"

interface AuctionStats {
  totalLots: number
  assignedLots: number
  unassignedCount: number
  callersCount: number
  lastModified: Date | null
}

function AuctionPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const auctionIdParam = searchParams.get("id")
  const selectedAuctionId = auctionIdParam ? parseInt(auctionIdParam, 10) : null

  // Overview state
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [auctionStats, setAuctionStats] = useState<Map<number, AuctionStats>>(new Map())
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState<{ id?: number; name: string; date: string }>({
    name: "",
    date: new Date().toISOString().split("T")[0] ?? "",
  })
  const [dialogError, setDialogError] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<Auction | null>(null)

  // Detail state
  const [auction, setAuction] = useState<Auction | null>(null)
  const [lots, setLots] = useState<Lot[]>([])
  const [lotBidders, setLotBidders] = useState<LotBidder[]>([])
  const [bidders, setBidders] = useState<Map<number, Bidder>>(new Map())
  const [callers, setCallers] = useState<Caller[]>([])
  const [selectedCallerIds, setSelectedCallerIds] = useState<number[]>([])
  const [expandedLots, setExpandedLots] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [uploadMessage, setUploadMessage] = useState<string | null>(null)
  const [confirmUploadOpen, setConfirmUploadOpen] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [callerDialogOpen, setCallerDialogOpen] = useState(false)
  const [infoDialog, setInfoDialog] = useState<{ bidderName: string; note: string } | null>(null)

  const callerMap = useMemo(() => new Map(callers.map(c => [c.id!, c])), [callers])
  const auctionCallers = useMemo(
    () => callers.filter(c => selectedCallerIds.includes(c.id!)),
    [callers, selectedCallerIds]
  )

  useEffect(() => {
    if (selectedAuctionId) {
      loadAuctionDetail(selectedAuctionId)
    } else {
      loadAuctions()
    }
  }, [selectedAuctionId])

  // Overview functions
  const loadAuctions = async () => {
    setLoading(true)
    const all = await getAllAuctions()
    setAuctions(all)
    setCallers(await getAllCallers())

    const stats = new Map<number, AuctionStats>()
    for (const a of all) {
      if (a.id) {
        const [aLots, aLotBidders, aCallers] = await Promise.all([
          getLotsByAuctionId(a.id),
          getLotBiddersByAuctionId(a.id),
          getAuctionCallersByAuctionId(a.id),
        ])
        const assigned = aLotBidders.filter(lb => lb.callerId !== undefined)
        const lotsWithAssignments = new Set(assigned.map(lb => lb.lotId))
        let lastModified: Date | null = null
        for (const lb of aLotBidders) {
          const d = new Date(lb.updatedAt)
          if (!lastModified || d > lastModified) lastModified = d
        }
        stats.set(a.id, {
          totalLots: aLots.length,
          assignedLots: lotsWithAssignments.size,
          unassignedCount: aLotBidders.length - assigned.length,
          callersCount: aCallers.length,
          lastModified,
        })
      }
    }
    setAuctionStats(stats)
    setLoading(false)
  }

  const openDialog = (a?: Auction) => {
    setForm(
      a
        ? { id: a.id, name: a.name, date: a.date.toISOString().split("T")[0] ?? "" }
        : { name: "", date: new Date().toISOString().split("T")[0] ?? "" }
    )
    setDialogError(null)
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      setDialogError("Name is required.")
      return
    }
    const date = new Date(form.date)
    if (form.id !== undefined) {
      await updateAuction(new Auction(form.name.trim(), date, form.id))
    } else {
      await createAuction(new Auction(form.name.trim(), date))
    }
    setDialogOpen(false)
    loadAuctions()
  }

  const handleDelete = async () => {
    if (!deleteConfirm?.id) return
    await deleteAuction(deleteConfirm.id)
    setDeleteConfirm(null)
    loadAuctions()
  }

  // Detail functions
  const loadAuctionDetail = async (id: number) => {
    setLoading(true)
    const [auctionData, lotsData, lotBiddersData, allBidders, allCallers, auctionCallersData] = await Promise.all([
      getAuctionById(id),
      getLotsByAuctionId(id),
      getLotBiddersByAuctionId(id),
      getAllBidders(),
      getAllCallers(),
      getAuctionCallersByAuctionId(id),
    ])
    setAuction(auctionData || null)
    setLots(lotsData)
    setLotBidders(lotBiddersData)
    setBidders(new Map(allBidders.map(b => [b.id!, b])))
    setCallers(allCallers)
    setSelectedCallerIds(auctionCallersData.map(ac => ac.callerId))
    setLoading(false)
  }

  const refreshLotsAndBidders = async () => {
    if (!selectedAuctionId) return
    const [lotsData, lotBiddersData] = await Promise.all([
      getLotsByAuctionId(selectedAuctionId),
      getLotBiddersByAuctionId(selectedAuctionId),
    ])
    setLots(lotsData)
    setLotBidders(lotBiddersData)
  }

  const toggleLotExpanded = (lotId: number) => {
    setExpandedLots(prev => {
      const next = new Set(prev)
      if (next.has(lotId)) next.delete(lotId)
      else next.add(lotId)
      return next
    })
  }

  const handleCallerChange = async (lb: LotBidder, newCallerId: number | "") => {
    const callerId = newCallerId === "" ? undefined : newCallerId
    const updated = new LotBidder(
      lb.auctionId, lb.lotId, lb.bidderId,
      callerId ? "assigned" : "planned",
      lb.preferredCallerId, callerId, lb.id, lb.createdAt, new Date(), true, undefined
    )
    await updateLotBidder(updated)
    await refreshLotsAndBidders()
  }

  const handleToggleFinal = async (lb: LotBidder) => {
    const newStatus = lb.status === "final" ? "assigned" : "final"
    const updated = new LotBidder(
      lb.auctionId, lb.lotId, lb.bidderId, newStatus,
      lb.preferredCallerId, lb.callerId, lb.id, lb.createdAt, new Date(), lb.isManual, lb.constraintNote
    )
    await updateLotBidder(updated)
    await refreshLotsAndBidders()
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPendingFile(file)
      setConfirmUploadOpen(true)
    }
  }

  const handleConfirmedUpload = async () => {
    if (!pendingFile || !selectedAuctionId) return
    setConfirmUploadOpen(false)
    try {
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.load(await pendingFile.arrayBuffer())
      const sheet = workbook.worksheets[0]
      if (!sheet) { setUploadMessage("No worksheet found."); return }

      const expectedHeaders = ["LotNumber", "LotName", "BidderName", "BidderPhoneNumber", "BidderLanguages"]
      const actualHeaders = ["A1", "B1", "C1", "D1", "E1"].map(cell => {
        const val = sheet.getCell(cell).value
        return typeof val === "string" ? val.trim() : ""
      })
      if (!expectedHeaders.every((h, i) => h === actualHeaders[i])) {
        setUploadMessage("Invalid Excel format.")
        return
      }

      await deleteLotBiddersByAuctionId(selectedAuctionId)
      await deleteLotsByAuctionId(selectedAuctionId)

      const lotMap = new Map<number, { title: string; bidders: { name: string; phone: string; languages: string[] }[] }>()
      sheet.eachRow((row, idx) => {
        if (idx === 1) return
        const lotNum = Number(row.getCell(1).value)
        const lotTitle = String(row.getCell(2).value || "").trim()
        const bidderName = String(row.getCell(3).value || "").trim()
        const bidderPhone = String(row.getCell(4).value || "").trim()
        const bidderLangs = String(row.getCell(5).value || "").split(",").map(l => l.trim()).filter(Boolean)
        if (!lotMap.has(lotNum)) lotMap.set(lotNum, { title: lotTitle, bidders: [] })
        lotMap.get(lotNum)!.bidders.push({ name: bidderName, phone: bidderPhone, languages: bidderLangs })
      })

      const newLotBidders: LotBidder[] = []
      for (const [lotNum, { title, bidders: bidArr }] of lotMap.entries()) {
        const lotId = await createLot(new Lot(selectedAuctionId, lotNum, title))
        for (const b of bidArr) {
          const bidderId = await createBidder(new Bidder(b.name, b.phone, languagesToLanguageArray(b.languages)))
          if (bidderId !== undefined) newLotBidders.push(new LotBidder(selectedAuctionId, lotId, bidderId, "planned"))
        }
      }
      for (const lb of newLotBidders) await createLotBidder(lb)

      const allBidders = await getAllBidders()
      setBidders(new Map(allBidders.map(b => [b.id!, b])))
      await refreshLotsAndBidders()
      setUploadMessage(`Imported ${lotMap.size} lots.`)
    } catch {
      setUploadMessage("Failed to process Excel.")
    } finally {
      setPendingFile(null)
    }
  }

  const handleAutoAssign = async () => {
    if (!selectedAuctionId) return
    const snapshot = await getPlanningSnapshot(selectedAuctionId)
    const result = computeAssignments(snapshot, 5)
    await persistCallerAssignments(selectedAuctionId, result.map)
    await refreshLotsAndBidders()
    setUploadMessage(result.unscheduled.length > 0
      ? `Done. ${result.unscheduled.length} unassigned.`
      : "All assigned.")
  }

  const handleDeleteAll = async () => {
    if (!selectedAuctionId) return
    await deleteLotBiddersByAuctionId(selectedAuctionId)
    await deleteLotsByAuctionId(selectedAuctionId)
    await refreshLotsAndBidders()
  }

  const handleSaveCallers = async (ids: number[]) => {
    if (!selectedAuctionId) return
    await setAuctionCallers(selectedAuctionId, ids)
    setSelectedCallerIds(ids)
    setCallerDialogOpen(false)
  }

  const getLotStatus = (lotId: number) => {
    const lbs = lotBidders.filter(lb => lb.lotId === lotId)
    if (lbs.length === 0) return "empty"
    const assigned = lbs.filter(lb => lb.callerId !== undefined)
    if (assigned.length === lbs.length) return "complete"
    if (assigned.length > 0) return "partial"
    return "pending"
  }

  const formatLanguages = (languages: Language[]) => languages.length === 0 ? "—" : languages.join(", ")
  const formatDate = (date: Date) => new Date(date).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
  const formatRelativeTime = (date: Date | null) => {
    if (!date) return "No activity"
    const diffMs = Date.now() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  if (loading) {
    return <Box sx={{ maxWidth: 1200, mx: "auto", py: 3 }}><Typography>Loading...</Typography></Box>
  }

  // DETAIL VIEW
  if (selectedAuctionId) {
    if (!auction) {
      return (
        <Box sx={{ maxWidth: 1200, mx: "auto", py: 3 }}>
          <Typography>Auction not found.</Typography>
          <Button onClick={() => router.push("/auction")} sx={{ mt: 2 }}>Back</Button>
        </Box>
      )
    }

    return (
      <Box sx={{ maxWidth: 1200, mx: "auto", py: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Breadcrumbs sx={{ mb: 1 }}>
            <Link component="button" underline="hover" color="inherit" onClick={() => router.push("/auction")} sx={{ cursor: "pointer" }}>
              Auctions
            </Link>
            <Typography color="text.primary">{auction.name}</Typography>
          </Breadcrumbs>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h5" fontWeight={600}>{auction.name}</Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              <input type="file" accept=".xlsx,.xls" onChange={handleFileSelect} style={{ display: "none" }} id="upload-excel" />
              <label htmlFor="upload-excel">
                <Button variant="outlined" component="span" startIcon={<UploadIcon />}>Upload</Button>
              </label>
              <Tooltip title="Run the algorithm to automatically assign callers to bidders based on language, availability, and priorities">
                <span>
                  <Button variant="contained" startIcon={<AssignIcon />} onClick={handleAutoAssign} disabled={lots.length === 0 || selectedCallerIds.length === 0}>
                    Auto-Assign
                  </Button>
                </span>
              </Tooltip>
              <Button variant="outlined" startIcon={<SettingsIcon />} onClick={() => setCallerDialogOpen(true)}>
                Callers ({selectedCallerIds.length})
              </Button>
              <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={handleDeleteAll} disabled={lots.length === 0}>
                Clear
              </Button>
            </Box>
          </Box>
        </Box>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                <Typography variant="h6">Lots</Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, fontSize: "0.75rem" }}>
                  <Tooltip title="User-locked assignment - algorithm will not change this"><Chip size="small" label="Locked" sx={{ bgcolor: "info.light", fontSize: "0.7rem" }} icon={<LockIcon sx={{ fontSize: 14 }} />} /></Tooltip>
                  <Tooltip title="Manually changed by user - may differ from algorithm suggestion"><Chip size="small" label="Manual" sx={{ bgcolor: "warning.light", fontSize: "0.7rem" }} /></Tooltip>
                  <Tooltip title="No caller could be assigned - check language or availability"><Chip size="small" label="Failed" sx={{ bgcolor: "error.light", fontSize: "0.7rem" }} /></Tooltip>
                  <Tooltip title="Optimal assignment - preferred caller or priority match"><Chip size="small" icon={<CheckIcon sx={{ fontSize: 14, color: "success.main" }} />} sx={{ fontSize: "0.7rem" }} /></Tooltip>
                  <Tooltip title="Suboptimal - assigned but preferred caller was unavailable"><Chip size="small" icon={<WarningIcon sx={{ fontSize: 14, color: "warning.main" }} />} sx={{ fontSize: "0.7rem" }} /></Tooltip>
                </Box>
              </Box>
              {lots.length === 0 ? (
                <Typography color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
                  No lots yet. Upload an Excel file to add lots and bidders.
                </Typography>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {lots.map(lot => {
                    const status = getLotStatus(lot.id!)
                    const isExpanded = expandedLots.has(lot.id!)
                    const lbs = lotBidders.filter(lb => lb.lotId === lot.id)
                    return (
                      <Box key={lot.id} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
                        <Box
                          sx={{ display: "flex", alignItems: "center", p: 1.5, cursor: "pointer", bgcolor: isExpanded ? "grey.50" : "transparent", "&:hover": { bgcolor: "grey.50" } }}
                          onClick={() => toggleLotExpanded(lot.id!)}
                        >
                          <IconButton size="small" sx={{ mr: 1 }}>{isExpanded ? <CollapseIcon /> : <ExpandIcon />}</IconButton>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1 }}>
                            {status === "complete" && <CheckIcon fontSize="small" color="success" />}
                            {status === "partial" && <WarningIcon fontSize="small" color="warning" />}
                            <Typography fontWeight={500}>Lot {lot.number}</Typography>
                            <Typography color="text.secondary" sx={{ flex: 1 }}>{lot.title}</Typography>
                            <Chip label={`${lbs.length} bidder${lbs.length !== 1 ? "s" : ""}`} size="small" variant="outlined" />
                          </Box>
                        </Box>
                        <Collapse in={isExpanded}>
                          <Box sx={{ borderTop: "1px solid", borderColor: "divider" }}>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Bidder</TableCell>
                                  <TableCell>Languages</TableCell>
                                  <TableCell>Caller</TableCell>
                                  <TableCell width={80} align="center">Actions</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {lbs.map(lb => {
                                  const bidder = bidders.get(lb.bidderId)
                                  const isFinal = lb.status === "final"
                                  const isManual = lb.isManual
                                  const isUnassigned = !lb.callerId && lb.status !== "planned"
                                  const rowBgColor = isUnassigned ? "error.light" : isManual ? "warning.light" : isFinal ? "info.light" : "transparent"
                                  return (
                                    <TableRow key={lb.id} sx={{ bgcolor: rowBgColor, opacity: isUnassigned ? 0.8 : 1 }}>
                                      <TableCell><Typography variant="body2">{bidder?.name || `#${lb.bidderId}`}</Typography></TableCell>
                                      <TableCell><Typography variant="body2" color="text.secondary">{formatLanguages(bidder?.languages || [])}</Typography></TableCell>
                                      <TableCell>
                                        <FormControl size="small" sx={{ minWidth: 120 }}>
                                          <Select value={lb.callerId ?? ""} onChange={(e) => handleCallerChange(lb, e.target.value as number | "")} displayEmpty disabled={isFinal}>
                                            <MenuItem value=""><em>Unassigned</em></MenuItem>
                                            {auctionCallers.map(c => <MenuItem key={c.id} value={c.id}>{c.abbreviation || c.name}</MenuItem>)}
                                          </Select>
                                        </FormControl>
                                      </TableCell>
                                      <TableCell align="center">
                                        <Box sx={{ display: "flex", gap: 0.5, justifyContent: "center" }}>
                                          <Tooltip title={isFinal ? "Unlock" : "Lock"}>
                                            <span>
                                              <IconButton size="small" onClick={() => handleToggleFinal(lb)} disabled={!lb.callerId} color={isFinal ? "primary" : "default"}>
                                                {isFinal ? <LockIcon fontSize="small" /> : <UnlockIcon fontSize="small" />}
                                              </IconButton>
                                            </span>
                                          </Tooltip>
                                          {lb.constraintNote && (() => {
                                            const indicators = parseConstraintNote(lb.constraintNote)
                                            const severity = indicators[0]?.severity || "info"
                                            const iconColor = severity === "success" ? "success" : severity === "warning" ? "warning" : severity === "error" ? "error" : "info"
                                            return (
                                              <Tooltip title={lb.constraintNote}>
                                                <IconButton size="small" onClick={() => setInfoDialog({ bidderName: bidder?.name || `#${lb.bidderId}`, note: lb.constraintNote! })}>
                                                  {severity === "success" ? <CheckIcon fontSize="small" color="success" /> :
                                                   severity === "warning" ? <WarningIcon fontSize="small" color="warning" /> :
                                                   severity === "error" ? <WarningIcon fontSize="small" color="error" /> :
                                                   <InfoIcon fontSize="small" color={iconColor} />}
                                                </IconButton>
                                              </Tooltip>
                                            )
                                          })()}
                                        </Box>
                                      </TableCell>
                                    </TableRow>
                                  )
                                })}
                              </TableBody>
                            </Table>
                          </Box>
                        </Collapse>
                      </Box>
                    )
                  })}
                </Box>
              )}
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <CallerPriorities auctionId={selectedAuctionId} callers={auctionCallers} bidders={Array.from(bidders.values())} />
          </Grid>
        </Grid>

        <Dialog open={callerDialogOpen} onClose={() => setCallerDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Manage Callers</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Select callers for this auction.</Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {callers.map(c => {
                const isSelected = selectedCallerIds.includes(c.id!)
                return (
                  <Box key={c.id} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", p: 1.5, border: "1px solid", borderColor: isSelected ? "primary.main" : "divider", borderRadius: 1, cursor: "pointer", bgcolor: isSelected ? "primary.light" : "transparent", "&:hover": { bgcolor: isSelected ? "primary.light" : "grey.50" } }}
                    onClick={() => setSelectedCallerIds(prev => isSelected ? prev.filter(id => id !== c.id) : [...prev, c.id!])}
                  >
                    <Box>
                      <Typography fontWeight={500}>{c.name}</Typography>
                      <Typography variant="body2" color="text.secondary">{c.abbreviation} · {formatLanguages(c.languages)}</Typography>
                    </Box>
                    {isSelected && <CheckIcon color="primary" />}
                  </Box>
                )
              })}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCallerDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => handleSaveCallers(selectedCallerIds)} variant="contained">Save</Button>
          </DialogActions>
        </Dialog>

        <Dialog open={confirmUploadOpen} onClose={() => setConfirmUploadOpen(false)}>
          <DialogTitle>Confirm Upload</DialogTitle>
          <DialogContent><Typography>This will <strong>delete all existing data</strong> for this auction. Continue?</Typography></DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmUploadOpen(false)}>Cancel</Button>
            <Button onClick={handleConfirmedUpload} variant="contained">Upload</Button>
          </DialogActions>
        </Dialog>

        <Dialog open={!!infoDialog} onClose={() => setInfoDialog(null)}>
          <DialogTitle>Assignment Info</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{infoDialog?.bidderName}</Typography>
            {infoDialog?.note && (() => {
              const indicators = parseConstraintNote(infoDialog.note)
              if (indicators.length === 0) {
                return <Typography>{infoDialog.note}</Typography>
              }
              return (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {indicators.map((ind, idx) => (
                    <Alert key={idx} severity={ind.severity} sx={{ py: 0.5 }}>
                      {ind.message}
                      {ind.details && <Typography variant="caption" display="block">{ind.details}</Typography>}
                    </Alert>
                  ))}
                </Box>
              )
            })()}
          </DialogContent>
          <DialogActions><Button onClick={() => setInfoDialog(null)}>Close</Button></DialogActions>
        </Dialog>

        <Backdrop open={!!uploadMessage} sx={{ zIndex: 1300, backdropFilter: "blur(2px)" }} onClick={() => setUploadMessage(null)}>
          <Paper sx={{ p: 4, maxWidth: 400, textAlign: "center" }}>
            <Typography variant="h6" gutterBottom>{uploadMessage}</Typography>
            <Button onClick={() => setUploadMessage(null)} variant="contained">Close</Button>
          </Paper>
        </Backdrop>
      </Box>
    )
  }

  // OVERVIEW VIEW
  return (
    <Box sx={{ maxWidth: 1000, mx: "auto", py: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>Auctions</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => openDialog()}>New Auction</Button>
      </Box>

      {auctions.length === 0 ? (
        <Card sx={{ p: 4, textAlign: "center" }}>
          <Typography color="text.secondary" sx={{ mb: 2 }}>No auctions yet. Create your first auction to get started.</Typography>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={() => openDialog()}>Create Auction</Button>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {auctions.map(a => {
            const stats = auctionStats.get(a.id!) || { totalLots: 0, assignedLots: 0, unassignedCount: 0, callersCount: 0, lastModified: null }
            const progress = stats.totalLots > 0 ? (stats.assignedLots / stats.totalLots) * 100 : 0
            return (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={a.id}>
                <Card sx={{ cursor: "pointer", transition: "box-shadow 0.2s", "&:hover": { boxShadow: 2 } }} onClick={() => router.push(`/auction?id=${a.id}`)}>
                  <CardContent sx={{ pb: 1 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
                      <Typography variant="h6" fontWeight={600} sx={{ lineHeight: 1.2 }}>{a.name}</Typography>
                      <Box sx={{ display: "flex", gap: 0.5 }}>
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); openDialog(a) }}><EditIcon fontSize="small" /></IconButton>
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); setDeleteConfirm(a) }}><DeleteIcon fontSize="small" /></IconButton>
                      </Box>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "text.secondary", mb: 2 }}>
                      <CalendarIcon fontSize="small" />
                      <Typography variant="body2">{formatDate(a.date)}</Typography>
                    </Box>
                    <Box sx={{ mb: 1.5 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">Progress</Typography>
                        <Typography variant="caption" fontWeight={500}>{stats.assignedLots}/{stats.totalLots} lots</Typography>
                      </Box>
                      <LinearProgress variant="determinate" value={progress} sx={{ height: 6, borderRadius: 1, bgcolor: "grey.200", "& .MuiLinearProgress-bar": { bgcolor: progress === 100 ? "success.main" : "primary.main" } }} />
                    </Box>
                    <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                      <Box><Typography variant="caption" color="text.secondary">Callers</Typography><Typography variant="body2" fontWeight={500}>{stats.callersCount}</Typography></Box>
                      <Box><Typography variant="caption" color="text.secondary">Unassigned</Typography><Typography variant="body2" fontWeight={500} color={stats.unassignedCount > 0 ? "warning.main" : "text.primary"}>{stats.unassignedCount}</Typography></Box>
                      <Box><Typography variant="caption" color="text.secondary">Modified</Typography><Typography variant="body2" fontWeight={500}>{formatRelativeTime(stats.lastModified)}</Typography></Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            )
          })}
        </Grid>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{form.id ? "Edit Auction" : "New Auction"}</DialogTitle>
        <DialogContent>
          <TextField label="Name" fullWidth margin="normal" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} autoFocus />
          <TextField type="date" label="Date" fullWidth margin="normal" value={form.date} onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))} slotProps={{ inputLabel: { shrink: true } }} />
          {dialogError && <Alert severity="error" sx={{ mt: 2 }}>{dialogError}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">{form.id ? "Update" : "Create"}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Delete Auction</DialogTitle>
        <DialogContent><Typography>Delete &quot;{deleteConfirm?.name}&quot;? This removes all lots and assignments.</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default function AuctionPage() {
  return (
    <Suspense fallback={<Box sx={{ maxWidth: 1200, mx: "auto", py: 3 }}><Typography>Loading...</Typography></Box>}>
      <AuctionPageContent />
    </Suspense>
  )
}

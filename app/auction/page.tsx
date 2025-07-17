"use client"

import { useEffect, useState } from "react"
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Typography,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Paper, Alert,
  Backdrop, Divider, Grid, List, ListItem, ListItemButton, ListItemText, Checkbox
} from "@mui/material"
import { Add as AddIcon, Edit as EditIcon } from "@mui/icons-material"
import DeleteIcon from "@mui/icons-material/Delete"
import ExcelJS from "exceljs"

import { Auction } from "@/lib/models/auction.model"
import { Lot } from "@/lib/models/lot.model"
import { LotBidder } from "@/lib/models/lot-bidder.model"
import { Caller } from "@/lib/models/caller.model"
import { getAllAuctions, getAuctionById, createAuction, updateAuction, deleteAuction } from "@/lib/actions/auction.actions"
import { createLot, getLotsByAuctionId, deleteLotsByAuctionId } from "@/lib/actions/lot.actions"
import { createLotBidder, getLotBiddersByAuctionId, deleteLotBiddersByAuctionId } from "@/lib/actions/lot-bidder.actions"
import { getAllCallers } from "@/lib/actions/caller.actions"
import { getAuctionCallersByAuctionId, setAuctionCallers } from "@/lib/actions/auction-caller.actions"
import { createBidder, getAllBidders } from "@/lib/actions/bidder.actions"
import { languagesToLanguageArray } from "@/lib/models/language.enum"
import { Bidder } from "@/lib/models/bidder.model"

export default function AuctionPage() {
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null)
  const [lots, setLots] = useState<Lot[]>([])
  const [lotBidders, setLotBidders] = useState<LotBidder[]>([])
  const [bidders, setBidders] = useState<Map<number, Bidder>>(new Map())
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: "", date: new Date().toISOString().split("T")[0], id: undefined as number | undefined })
  const [dialogError, setDialogError] = useState<string | null>(null)
  const [uploadMessage, setUploadMessage] = useState<string | null>(null)
  const [confirmUploadOpen, setConfirmUploadOpen] = useState(false)
  const [pendingUploadFile, setPendingUploadFile] = useState<File | null>(null)
  const [callers, setCallers] = useState<Caller[]>([])
  const [selectedCallerIds, setSelectedCallerIds] = useState<number[]>([])
  const [callerDialogOpen, setCallerDialogOpen] = useState(false)

  useEffect(() => {
    getAllAuctions().then(setAuctions)
    getAllCallers().then(setCallers)
  }, [])

  const handleSelectAuction = async (auction: Auction) => {
    setSelectedAuction(auction)
    const fetchedLots = await getLotsByAuctionId(auction.id!)
    const fetchedLotBidders = await getLotBiddersByAuctionId(auction.id!)
    const allBidders = await getAllBidders()
    const bidderMap = new Map(allBidders.map(b => [b.id!, b]))
    setLots(fetchedLots)
    setLotBidders(fetchedLotBidders)
    setBidders(bidderMap)
    const auctionCallers = await getAuctionCallersByAuctionId(auction.id!)
    setSelectedCallerIds(auctionCallers.map(c => c.callerId))
  }

  const handleOpenDialog = (auction?: Auction) => {
    setForm(auction
      ? { name: auction.name, date: auction.date.toISOString().split("T")[0], id: auction.id }
      : { name: "", date: new Date().toISOString().split("T")[0], id: undefined }
    )
    setDialogError(null)
    setOpen(true)
  }

  const handleCloseDialog = () => {
    setOpen(false)
    setForm({ name: "", date: new Date().toISOString().split("T")[0], id: undefined })
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      setDialogError("Name is required.")
      return
    }
    const date = new Date(form.date)
    if (form.id !== undefined) {
      await updateAuction(new Auction(form.name.trim(), date, form.id))
      setAuctions(prev => prev.map(a => a.id === form.id ? new Auction(form.name.trim(), date, form.id) : a))
    } else {
      const id = await createAuction(new Auction(form.name.trim(), date))
      const created = await getAuctionById(id)
      if (created) setAuctions(prev => [...prev, created])
    }
    handleCloseDialog()
  }

  const handleDelete = async (auction: Auction) => {
    if (!auction.id) return
    await deleteAuction(auction.id)
    setAuctions(prev => prev.filter(a => a.id !== auction.id))
    if (selectedAuction?.id === auction.id) {
      setSelectedAuction(null)
      setLots([])
      setLotBidders([])
      setSelectedCallerIds([])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && selectedAuction) {
      setPendingUploadFile(file)
      setConfirmUploadOpen(true)
    }
  }

  const handleConfirmedUpload = async () => {
    if (!pendingUploadFile || !selectedAuction) return
    setConfirmUploadOpen(false)

    try {
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.load(await pendingUploadFile.arrayBuffer())
      const sheet = workbook.worksheets[0]

      const expectedHeaders = ["LotNumber", "LotName", "BidderName", "BidderPhoneNumber", "BidderLanguages"]
      const actualHeaders = ["A1", "B1", "C1", "D1", "E1"].map(cell => {
        const val = sheet.getCell(cell).value
        return typeof val === "string" ? val.trim() : ""
      })

      if (!expectedHeaders.every((h, i) => h === actualHeaders[i])) {
        setUploadMessage("Invalid Excel format.")
        return
      }

      await deleteLotBiddersByAuctionId(selectedAuction.id!)
      await deleteLotsByAuctionId(selectedAuction.id!)

      const lotMap = new Map<number, {
        title: string,
        bidders: { name: string, phone: string, languages: string[] }[]
      }>()

      sheet.eachRow((row, idx) => {
        if (idx === 1) return

        const lotNum = Number(row.getCell(1).value)
        const lotTitle = String(row.getCell(2).value || "").trim()
        const bidderName = String(row.getCell(3).value || "").trim()
        const bidderPhone = String(row.getCell(4).value || "").trim()
        const bidderLangs = String(row.getCell(5).value || "")
          .split(",")
          .map(l => l.trim())
          .filter(Boolean)

        if (!lotMap.has(lotNum)) {
          lotMap.set(lotNum, { title: lotTitle, bidders: [] })
        }

        lotMap.get(lotNum)!.bidders.push({ name: bidderName, phone: bidderPhone, languages: bidderLangs })
      })

      const newLotBidders: LotBidder[] = []

      for (const [lotNum, { title, bidders }] of lotMap.entries()) {
        const lotId = await createLot(new Lot(selectedAuction.id!, lotNum, title))

        for (const bidder of bidders) {
          const langEnumArray = languagesToLanguageArray(bidder.languages)
          const bidderId = await createBidder(new Bidder(bidder.name, bidder.phone, langEnumArray))

          if (bidderId !== undefined) {
            newLotBidders.push(new LotBidder(selectedAuction.id!, lotId, bidderId, "planned"))
          }
        }
      }

      for (const lb of newLotBidders) {
        await createLotBidder(lb)
      }

      setLots(await getLotsByAuctionId(selectedAuction.id!))
      setLotBidders(await getLotBiddersByAuctionId(selectedAuction.id!))
      setUploadMessage("Lots and bidders imported successfully.")
    } catch (err) {
      console.error("Excel import failed:", err)
      setUploadMessage("Failed to process Excel.")
    } finally {
      setPendingUploadFile(null)
    }
  }

  const handleDeleteLotBiddersAndLots = async () => {
    if (!selectedAuction?.id) return
    await deleteLotBiddersByAuctionId(selectedAuction.id)
    await deleteLotsByAuctionId(selectedAuction.id)
    setLotBidders([])
    setLots([])
  }

  const toggleCaller = (id: number) => {
    setSelectedCallerIds(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  const saveCallers = async () => {
    if (!selectedAuction) return
    await setAuctionCallers(selectedAuction.id!, selectedCallerIds)
    setCallerDialogOpen(false)
  }

  return (
    <>
      <Grid container columnSpacing={4} rowSpacing={2}>
        <Grid size={{ xs: 12, md: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ my: 4 }}>
            <Typography variant="h4">Auctions</Typography>
            <Button variant="contained" onClick={() => handleOpenDialog()}>
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
                    onClick={() => handleSelectAuction(a)}
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
                          handleOpenDialog(a)
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        sx={{ p: 0, ml: 1 }}
                        onClick={e => {
                          e.stopPropagation()
                          handleDelete(a)
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
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Box mt={4} display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h4">Auction Details</Typography>
            <Box>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                style={{ display: "none" }}
                id="upload-auction-excel"
              />
              <label htmlFor="upload-auction-excel">
                <Button
                  variant="contained"
                  component="span"
                  sx={{ mr: 1 }}
                  disabled={!selectedAuction}
                >
                  Upload Lots & Bidders
                </Button>
              </label>
              <Button
                variant="outlined"
                color="error"
                onClick={handleDeleteLotBiddersAndLots}
                disabled={!selectedAuction}
              >
                Delete Lots & Bidders
              </Button>
            </Box>
          </Box>

          {selectedAuction ? (

                <Paper sx={{ p: 2 }}>
                  {lots.map(lot => (
                    <Box key={lot.id} mb={2}>
                      <Typography variant="subtitle1">
                        Lot {lot.number}: {lot.title}
                      </Typography>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Bidder Name</TableCell>
                            <TableCell>Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {lotBidders
                            .filter(lb => lb.lotId === lot.id)
                            .map(lb => (
                              <TableRow key={lb.id}>
                                <TableCell>
                                  {bidders.get(lb.bidderId)?.name || `#${lb.bidderId}`}
                                </TableCell>
                                <TableCell>{lb.status}</TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </Box>
                  ))}
                </Paper>


          ) : (
            <Typography variant="body2" mt={2}>
              Select an auction to view details.
            </Typography>
          )}
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Box mt={4} display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h4">Auction Callers</Typography>
            <Button
              variant="contained"
              component="span"
              onClick={() => setCallerDialogOpen(true)}
              disabled={!selectedAuction}
            >
              Manage
            </Button>
          </Box>
          <Paper>
            <List dense>
              {callers
                .filter(c => selectedCallerIds.includes(c.id!))
                .map(c => (
                  <ListItem key={c.id}>
                    <ListItemText primary={c.name} />
                  </ListItem>
                ))}
            </List>
          </Paper>
        </Grid>
        {selectedAuction ? (

          <Paper>
            <List dense>
              {callers
                .filter(c => selectedCallerIds.includes(c.id!))
                .map(c => (
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
      </Grid>

      {/* Auction create/edit dialog */}
      <Dialog open={open} onClose={handleCloseDialog}>
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
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            {form.id ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Upload confirmation dialog */}
      <Dialog open={confirmUploadOpen} onClose={() => setConfirmUploadOpen(false)}>
        <DialogTitle>Confirm Upload</DialogTitle>
        <DialogContent>
          <Typography>
            Uploading will <strong>delete all existing lots and bidders</strong> for this auction. Are you sure?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmUploadOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleConfirmedUpload}>Proceed</Button>
        </DialogActions>
      </Dialog>
      {/* Caller management dialog */}
      <Dialog open={callerDialogOpen} onClose={() => setCallerDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Manage Auction Callers</DialogTitle>
        <DialogContent dividers>
          <List>
            {callers.map(c => (
              <ListItem key={c.id} disablePadding>
                <ListItemButton onClick={() => toggleCaller(c.id!)}>
                  <Checkbox
                    edge="start"
                    checked={selectedCallerIds.includes(c.id!)}
                    tabIndex={-1}
                  />
                  <ListItemText primary={`${c.abbreviation || ""} ${c.name}`.trim()} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCallerDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={saveCallers}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Upload result feedback */}
      <Backdrop
        open={!!uploadMessage}
        sx={{ zIndex: 1300, backdropFilter: "blur(2px)" }}
        onClick={() => setUploadMessage(null)}
      >
        <Paper elevation={4} sx={{ p: 4, maxWidth: 500, textAlign: "center" }}>
          <Typography variant="h6" gutterBottom>
            {uploadMessage}
          </Typography>
          <Button onClick={() => setUploadMessage(null)} variant="contained">
            Close
          </Button>
        </Paper>
      </Backdrop>
    </>
  )
}


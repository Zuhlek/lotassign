"use client"

import { useEffect, useState } from "react"
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Paper, Alert, Backdrop, Divider, Grid, } from "@mui/material"
import { Add as AddIcon, Edit as EditIcon } from "@mui/icons-material"
import ExcelJS from "exceljs"
import { Auction } from "@/lib/models/auction.model"
import { Lot } from "@/lib/models/lot.model"
import { LotBidder } from "@/lib/models/lot-bidder.model"
import { getAllAuctions, getAuctionById, createAuction, updateAuction } from "@/lib/actions/auction.actions"
import { createLot, getLotsByAuctionId, deleteLotsByAuctionId } from "@/lib/actions/lot.actions"
import { createLotBidder, getLotBiddersByAuctionId, deleteLotBiddersByAuctionId } from "@/lib/actions/lot-bidder.actions"
import { loadAuctionAndCallerDummyData } from "@/lib/utils/db-helpers"

export default function AuctionPage() {
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null)
  const [lots, setLots] = useState<Lot[]>([])
  const [lotBidders, setLotBidders] = useState<LotBidder[]>([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: "", date: new Date().toISOString().split("T")[0], id: undefined as number | undefined })
  const [dialogError, setDialogError] = useState<string | null>(null)
  const [uploadMessage, setUploadMessage] = useState<string | null>(null)

  useEffect(() => {
    getAllAuctions().then(setAuctions)
  }, [])

  const handleSelectAuction = async (auction: Auction) => {
    setSelectedAuction(auction)
    const fetchedLots = await getLotsByAuctionId(auction.id!)
    const fetchedLotBidders = await getLotBiddersByAuctionId(auction.id!)
    setLots(fetchedLots)
    setLotBidders(fetchedLotBidders)
  }

  const handleOpenDialog = (auction?: Auction) => {
    setForm(auction ? { name: auction.name, date: auction.date.toISOString().split("T")[0], id: auction.id } : { name: "", date: new Date().toISOString().split("T")[0], id: undefined })
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || !files[0] || !selectedAuction) return
    try {
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.load(await files[0].arrayBuffer())
      const sheet = workbook.worksheets[0]
      if (sheet.getCell("A1").value !== "Lot" || sheet.getCell("B1").value !== "Title" || sheet.getCell("C1").value !== "BidderId") {
        setUploadMessage("Invalid Excel format.")
        return
      }

      const lotMap = new Map<string, { number: number, title: string, bidders: number[] }>()
      sheet.eachRow((row, idx) => {
        if (idx === 1) return
        const lotNum = Number(row.getCell(1).value)
        const title = row.getCell(2).value?.toString().trim()
        const bidderId = Number(row.getCell(3).value)
        if (!lotMap.has(`${lotNum}`)) lotMap.set(`${lotNum}`, { number: lotNum, title: title || "", bidders: [] })
        lotMap.get(`${lotNum}`)!.bidders.push(bidderId)
      })

      await deleteLotsByAuctionId(selectedAuction.id!)
      await deleteLotBiddersByAuctionId(selectedAuction.id!)

      const newLotBidders: LotBidder[] = []
      for (const { number, title, bidders } of lotMap.values()) {
        const lotId = await createLot(new Lot(selectedAuction.id!, number, title))
        for (const bidderId of bidders) {
          newLotBidders.push(new LotBidder(selectedAuction.id!, lotId, bidderId, "planned"))
        }
      }

      for (const lb of newLotBidders) await createLotBidder(lb)

      setLots(await getLotsByAuctionId(selectedAuction.id!))
      setLotBidders(await getLotBiddersByAuctionId(selectedAuction.id!))
      setUploadMessage("Lots and bidders imported successfully.")
    } catch {
      setUploadMessage("Failed to process Excel.")
    }
  }

  const handleLoadDummyData = async () => {
    const id = await loadAuctionAndCallerDummyData()
    const created = await getAuctionById(id)
    if (created) setAuctions(prev => [...prev, created])
  }

  return (
    <>
      <Grid container>
        <Grid size={{ xs: 12, md: 6 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ my: 4 }}>
            <Typography variant="h4">Auctions</Typography>
            <Box>
              <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} style={{ display: "none" }} id="upload-auction-excel" />
              <label htmlFor="upload-auction-excel">
                <Button variant="contained" component="span" sx={{ mr: 1 }} disabled={!selectedAuction}>Upload Lots</Button>
              </label>
              <Button variant="outlined" onClick={handleLoadDummyData} sx={{ mr: 1 }}>Load Dummy</Button>
              <Button variant="contained" onClick={() => handleOpenDialog()}><AddIcon /></Button>
            </Box>
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
                {auctions.map((a) => (
                  <TableRow key={a.id} hover selected={selectedAuction?.id === a.id} onClick={() => handleSelectAuction(a)} sx={{ cursor: "pointer" }}>
                    <TableCell>{a.name}</TableCell>
                    <TableCell>{new Date(a.date).toLocaleDateString()}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" sx={{ p: 0, mx: 2 }} onClick={(e) => { e.stopPropagation(); handleOpenDialog(a) }}><EditIcon /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
        <Box mt={4}>
          <Typography variant="h5" gutterBottom>Lots & Bidders</Typography>
          {selectedAuction ? (
            <Paper sx={{ p: 2 }}>
              {lots.map(lot => (
                <Box key={lot.id} mb={2}>
                  <Typography variant="subtitle1">Lot {lot.number}: {lot.title}</Typography>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Bidder ID</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {lotBidders.filter(lb => lb.lotId === lot.id).map(lb => (
                        <TableRow key={lb.id}>
                          <TableCell>{lb.bidderId}</TableCell>
                          <TableCell>{lb.status}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              ))}
            </Paper>
          ) : (
            <Typography variant="body2">Select an auction to view lots and bidders.</Typography>
          )}
        </Box>
        </Grid>
      </Grid>
      <Dialog open={open} onClose={handleCloseDialog}>
        <DialogTitle>{form.id ? "Edit Auction" : "Add Auction"}</DialogTitle>
        <DialogContent>
          <TextField label="Name" fullWidth margin="normal" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
          <TextField type="date" fullWidth margin="normal" value={form.date} onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))} InputLabelProps={{ shrink: true }} />
        </DialogContent>
        {dialogError && <Box display="flex" justifyContent="center" alignItems="center" minHeight={50}><Alert severity="error">{dialogError}</Alert></Box>}
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">{form.id ? "Update" : "Create"}</Button>
        </DialogActions>
      </Dialog>

      <Backdrop open={!!uploadMessage} sx={{ zIndex: 1300, backdropFilter: "blur(2px)" }} onClick={() => setUploadMessage(null)}>
        <Paper elevation={4} sx={{ p: 4, maxWidth: 500, textAlign: "center" }}>
          <Typography variant="h6" gutterBottom>{uploadMessage}</Typography>
          <Button onClick={() => setUploadMessage(null)} variant="contained">Close</Button>
        </Paper>
      </Backdrop>
    </>
  )
}

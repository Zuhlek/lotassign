"use client"

import { useMemo, useState } from "react"
import { Box, Button, Paper, Typography, Table, TableHead, TableRow, TableCell, TableBody, Dialog, DialogTitle, DialogContent, DialogActions, Backdrop, } from "@mui/material"
import ExcelJS from "exceljs"
import { Auction } from "@/lib/models/auction.model"
import { Lot } from "@/lib/models/lot.model"
import { LotBidder } from "@/lib/models/lot-bidder.model"
import { Bidder } from "@/lib/models/bidder.model"
import { createLot, getLotsByAuctionId, deleteLotsByAuctionId } from "@/lib/actions/lot.actions"
import { createLotBidder, getLotBiddersByAuctionId, deleteLotBiddersByAuctionId } from "@/lib/actions/lot-bidder.actions"
import { languagesToLanguageArray } from "@/lib/models/language.enum"
import { createBidder } from "@/lib/actions/bidder.actions"
import { Caller } from "@/lib/models/caller.model"

interface LotsBiddersProps {
  selectedAuction: Auction | null
  lots: Lot[]
  lotBidders: LotBidder[]
  bidders: Map<number, Bidder>
  callers: Caller[]
  onLotsUpdate: (lots: Lot[]) => void
  onLotBiddersUpdate: (lotBidders: LotBidder[]) => void
  onDeleteLots: () => Promise<void>
  onAutoAssign: () => Promise<void>
}

export default function LotsBidders({
  selectedAuction,
  lots,
  lotBidders,
  bidders,
  callers,
  onLotsUpdate,
  onLotBiddersUpdate,
  onDeleteLots,
  onAutoAssign,
}: LotsBiddersProps) {
  const [confirmUploadOpen, setConfirmUploadOpen] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [uploadMessage, setUploadMessage] = useState<string | null>(null)

  const callerMap = useMemo(
    () => new Map(callers.map(c => [c.id!, c])),
    [callers],
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && selectedAuction) {
      setPendingFile(file)
      setConfirmUploadOpen(true)
    }
  }

  const handleConfirmedUpload = async () => {
    if (!pendingFile || !selectedAuction) return
    setConfirmUploadOpen(false)

    try {
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.load(await pendingFile.arrayBuffer())
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
        bidders: { name: string; phone: string; languages: string[] }[]
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

        if (!lotMap.has(lotNum)) lotMap.set(lotNum, { title: lotTitle, bidders: [] })
        lotMap.get(lotNum)!.bidders.push({ name: bidderName, phone: bidderPhone, languages: bidderLangs })
      })

      const newLotBidders: LotBidder[] = []

      for (const [lotNum, { title, bidders: bidArr }] of lotMap.entries()) {
        const lotId = await createLot(new Lot(selectedAuction.id!, lotNum, title))
        for (const b of bidArr) {
          const bidderId = await createBidder(new Bidder(b.name, b.phone, languagesToLanguageArray(b.languages)))
          if (bidderId !== undefined) newLotBidders.push(new LotBidder(selectedAuction.id!, lotId, bidderId, "planned"))
        }
      }

      for (const lb of newLotBidders) await createLotBidder(lb)

      onLotsUpdate(await getLotsByAuctionId(selectedAuction.id!))
      onLotBiddersUpdate(await getLotBiddersByAuctionId(selectedAuction.id!))
      setUploadMessage("Lots and bidders imported successfully.")
    } catch {
      setUploadMessage("Failed to process Excel.")
    } finally {
      setPendingFile(null)
    }
  }

  return (
    <>
      <Box mt={4} display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h4">Auction Details</Typography>
        <Box>
          <Button
            variant="outlined"
            color="error"
            onClick={onAutoAssign}
            disabled={!selectedAuction}
          >
            Assign Callers
          </Button>
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
            onClick={onDeleteLots}
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
                    <TableCell>Caller</TableCell>  
                  </TableRow>
                </TableHead>

                <TableBody>
                  {lotBidders
                    .filter(lb => lb.lotId === lot.id)
                    .map(lb => {
                      const caller =
                        lb.callerId !== undefined
                          ? callerMap.get(lb.callerId)?.abbreviation ??
                          callerMap.get(lb.callerId)?.name ??
                          `#${lb.callerId}`
                          : "—";

                      return (
                        <TableRow key={lb.id}>
                          <TableCell>{bidders.get(lb.bidderId)?.name || `#${lb.bidderId}`}</TableCell>
                          <TableCell>{lb.status}</TableCell>
                          <TableCell>{caller}</TableCell>        
                        </TableRow>
                      );
                    })}
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

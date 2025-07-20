"use client"

import { useEffect, useState } from "react"
import { Grid } from "@mui/material"
import { Auction } from "@/lib/models/auction.model"
import { Lot } from "@/lib/models/lot.model"
import { LotBidder } from "@/lib/models/lot-bidder.model"
import { Caller } from "@/lib/models/caller.model"
import { Bidder } from "@/lib/models/bidder.model"
import { getAllAuctions, getAuctionById, createAuction, updateAuction, deleteAuction } from "@/lib/actions/auction.actions"
import { getLotsByAuctionId } from "@/lib/actions/lot.actions"
import { getLotBiddersByAuctionId } from "@/lib/actions/lot-bidder.actions"
import { getAllCallers } from "@/lib/actions/caller.actions"
import { getAuctionCallersByAuctionId, setAuctionCallers } from "@/lib/actions/auction-caller.actions"
import { getAllBidders } from "@/lib/actions/bidder.actions"

import AuctionCallers from "@/components/workflow/auction-callers-list"
import AuctionList from "@/components/workflow/auctions-list"
import LotsBidders from "@/components/workflow/lots-bidders-list"

export default function AuctionPage() {
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null)
  const [lots, setLots] = useState<Lot[]>([])
  const [lotBidders, setLotBidders] = useState<LotBidder[]>([])
  const [bidders, setBidders] = useState<Map<number, Bidder>>(new Map())
  const [callers, setCallers] = useState<Caller[]>([])
  const [selectedCallerIds, setSelectedCallerIds] = useState<number[]>([])

  useEffect(() => {
    getAllAuctions().then(setAuctions)
    getAllCallers().then(setCallers)
  }, [])

  const refreshLotsAndBidders = async (auctionId: number) => {
    setLots(await getLotsByAuctionId(auctionId))
    setLotBidders(await getLotBiddersByAuctionId(auctionId))
  }

  const handleSelectAuction = async (auction: Auction) => {
    setSelectedAuction(auction)
    await refreshLotsAndBidders(auction.id!)
    const allBidders = await getAllBidders()
    setBidders(new Map(allBidders.map(b => [b.id!, b])))
    const auctionCallers = await getAuctionCallersByAuctionId(auction.id!)
    setSelectedCallerIds(auctionCallers.map(c => c.callerId))
  }

  const saveAuction = async (data: { id?: number; name: string; date: string }) => {
    const date = new Date(data.date)
    if (data.id !== undefined) {
      await updateAuction(new Auction(data.name.trim(), date, data.id))
      setAuctions(prev => prev.map(a => (a.id === data.id ? new Auction(data.name.trim(), date, data.id) : a)))
    } else {
      const id = await createAuction(new Auction(data.name.trim(), date))
      const created = await getAuctionById(id)
      if (created) setAuctions(prev => [...prev, created])
    }
  }

  const handleDeleteAuction = async (auction: Auction) => {
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

  const handleDeleteLotsBidders = async () => {
    if (!selectedAuction?.id) return
    await refreshLotsAndBidders(selectedAuction.id)
  }

  const handleSaveCallers = async (ids: number[]) => {
    if (!selectedAuction) return
    await setAuctionCallers(selectedAuction.id!, ids)
    setSelectedCallerIds(ids)
  }

  return (
    <Grid container columnSpacing={4} rowSpacing={2}>
      <Grid size={{ xs: 12, md: 3 }}>
        <AuctionList
          auctions={auctions}
          selectedAuction={selectedAuction}
          onSelectAuction={handleSelectAuction}
          onSaveAuction={saveAuction}
          onDeleteAuction={handleDeleteAuction}
        />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <LotsBidders
          selectedAuction={selectedAuction}
          lots={lots}
          lotBidders={lotBidders}
          bidders={bidders}
          onLotsUpdate={setLots}
          onLotBiddersUpdate={setLotBidders}
          onDeleteLots={handleDeleteLotsBidders}
        />
      </Grid>

      <Grid size={{ xs: 12, md: 3 }}>
        <AuctionCallers
          selectedAuction={selectedAuction}
          callers={callers}
          selectedCallerIds={selectedCallerIds}
          onSaveCallers={handleSaveCallers}
        />
      </Grid>
    </Grid>
  )
}

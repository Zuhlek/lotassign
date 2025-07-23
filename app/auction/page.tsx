"use client"

import { useEffect, useMemo, useState } from "react"
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
import { updateLotBidder } from "@/lib/actions/lot-bidder.actions"
import AuctionList from "@/components/workflow/auctions-list"
import LotsBidders from "@/components/workflow/lots-bidders-list"
import { AssignmentService } from "@/lib/assignment.service"

export default function AuctionPage() {
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null)
  const [lots, setLots] = useState<Lot[]>([])
  const [lotBidders, setLotBidders] = useState<LotBidder[]>([])
  const [bidders, setBidders] = useState<Map<number, Bidder>>(new Map())
  const [callers, setCallers] = useState<Caller[]>([])
  const [selectedCallerIds, setSelectedCallerIds] = useState<number[]>([])
  const preferredAssignments = useMemo(() => {
    const map: Record<number, number | undefined> = {}
    lotBidders.forEach(lb => {
      if (lb.preferredCallerId !== undefined) map[lb.preferredCallerId] = lb.bidderId
    })
    return map
  }, [lotBidders])

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

  const handleSaveCallers = async (
    ids: number[],
    assignments: Record<number, number | undefined>
  ) => {
    if (!selectedAuction) return

    await setAuctionCallers(selectedAuction.id!, ids)
    setSelectedCallerIds(ids)

    const bidderToCaller: Record<number, number | undefined> = {}
    Object.entries(assignments).forEach(([cId, bId]) => {
      if (bId !== undefined) bidderToCaller[bId] = Number(cId)
    })

    for (const lb of lotBidders) {
      const desired = bidderToCaller[lb.bidderId]
      if (lb.preferredCallerId !== desired) {
        await updateLotBidder(
          new LotBidder(
            lb.auctionId,
            lb.lotId,
            lb.bidderId,
            lb.status,
            desired,
            lb.callerId,
            lb.id
          )
        )
      }
    }

    setLotBidders(await getLotBiddersByAuctionId(selectedAuction.id!))
  }

const handleAutoAssign = async () => {
  if (!selectedAuction?.id) return;

  const { unscheduled } = await AssignmentService.run(selectedAuction.id);

  await refreshLotsAndBidders(selectedAuction.id);

  if (unscheduled.length) {
    console.warn("Nicht zugewiesen:", unscheduled);
  }
};

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
          callers={callers}
          onLotsUpdate={setLots}
          onLotBiddersUpdate={setLotBidders}
          onDeleteLots={handleDeleteLotsBidders}
          onAutoAssign={handleAutoAssign}
        />
      </Grid>

      <Grid size={{ xs: 12, md: 3 }}>
        <AuctionCallers
          selectedAuction={selectedAuction}
          callers={callers}
          selectedCallerIds={selectedCallerIds}
          bidders={Array.from(bidders.values())}
          assignments={preferredAssignments}
          onSave={handleSaveCallers}
        />
      </Grid>
    </Grid>
  )
}

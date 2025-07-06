'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Button } from '@mui/material';
import { db } from "@/lib/db/dexie.db";
import { liveQuery } from 'dexie';

type StatusType = "success" | "warning" | "error" | "info";

type TableCounts = {
  auctionsCount: number;
  lotsCount: number;
  biddersCount: number;
  callersCount: number;
  auctionCallerCount: number;
  lotBiddersCount: number;
};

// Direkt integrierte Funktion zur Datenbankintegritätsprüfung
async function getDatabaseCounts(): Promise<TableCounts> {
  const auctionsCount = await db.auctions.count();
  const lotsCount = await db.lots.count();
  const biddersCount = await db.bidders.count();
  const callersCount = await db.callers.count();
  const auctionCallerCount = await db.auctionCallers.count();
  const lotBiddersCount = await db.lotBidders.count();

  return {
    auctionsCount,
    lotsCount,
    biddersCount,
    callersCount,
    auctionCallerCount,
    lotBiddersCount
  };
}

// Funktion zur Ermittlung des Status basierend auf den Tabelleninhalten
function determineStatus(counts: TableCounts): StatusType {
  const { auctionsCount, lotsCount, biddersCount, callersCount, auctionCallerCount, lotBiddersCount } = counts;
  
  if (
    auctionsCount === 0 &&
    lotsCount === 0 &&
    biddersCount === 0 &&
    callersCount === 0 &&
    auctionCallerCount === 0 &&
    lotBiddersCount === 0
  ) {
    return "error";
  } else if (
    auctionsCount !== 0 &&
    lotsCount !== 0 &&
    biddersCount !== 0 &&
    callersCount !== 0 &&
    auctionCallerCount !== 0 &&
    lotBiddersCount !== 0
  ) {
    return "success";
  } else {
    return "warning";
  }
}

export default function DataIntegrityChecker() {
  const [counts, setCounts] = useState<TableCounts>({
    auctionsCount: 0,
    lotsCount: 0,
    biddersCount: 0,
    callersCount: 0,
    auctionCallerCount: 0,
    lotBiddersCount: 0
  });

  const [status, setStatus] = useState<StatusType>('info');

  useEffect(() => {
    const subscription = liveQuery(() => getDatabaseCounts()).subscribe({
      next: (newCounts) => {
        setCounts(newCounts);
        setStatus(determineStatus(newCounts));
      },
      error: (error) => {
        setStatus("error");
        console.error("Error fetching database counts:", error);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const getCardStyle = () => {
    switch (status) {
      case "success":
        return { backgroundColor: "#d4edda", color: "#155724" }; // Green
      case "warning":
        return { backgroundColor: "#fff3cd", color: "#856404" }; // Yellow
      case "error":
        return { backgroundColor: "#f8d7da", color: "#721c24" }; // Red
      default:
        return { backgroundColor: "#cce5ff", color: "#004085" }; // Blue
    }
  };

  return (
    <div>
      <Card style={getCardStyle()} sx={{width:200}}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Database Content
          </Typography>
          <Typography variant="body2">
            <strong>Callers:</strong> {counts.callersCount}
          </Typography>
          <Typography variant="body2">
            <strong>Auctions:</strong> {counts.auctionsCount}
          </Typography>
          <Typography variant="body2">
            <strong>Lots:</strong> {counts.lotsCount}
          </Typography>
          <Typography variant="body2">
            <strong>Bidders:</strong> {counts.biddersCount}
          </Typography>
          <Typography variant="body2">
            <strong>Auction Callers:</strong> {counts.auctionCallerCount}
          </Typography>
          <Typography variant="body2">
            <strong>Lot Bidders:</strong> {counts.lotBiddersCount}
          </Typography>
        </CardContent>
      </Card>
    </div>
  );
}

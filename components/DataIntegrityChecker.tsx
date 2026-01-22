'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, Typography } from '@mui/material';
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

const getStatusStyles = (status: StatusType) => {
  const colorMap = {
    success: { bgcolor: 'success.light', color: 'success.dark' },
    warning: { bgcolor: 'warning.light', color: 'warning.dark' },
    error: { bgcolor: 'error.light', color: 'error.dark' },
    info: { bgcolor: 'info.light', color: 'info.dark' },
  };
  return colorMap[status] || colorMap.info;
};

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

  return (
    <Card sx={{ width: 240, ...getStatusStyles(status) }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ color: 'inherit' }}>
          Database Content
        </Typography>
        <Typography variant="body2" sx={{ color: 'inherit' }}>
          <strong>Callers:</strong> {counts.callersCount}
        </Typography>
        <Typography variant="body2" sx={{ color: 'inherit' }}>
          <strong>Auctions:</strong> {counts.auctionsCount}
        </Typography>
        <Typography variant="body2" sx={{ color: 'inherit' }}>
          <strong>Lots:</strong> {counts.lotsCount}
        </Typography>
        <Typography variant="body2" sx={{ color: 'inherit' }}>
          <strong>Bidders:</strong> {counts.biddersCount}
        </Typography>
        <Typography variant="body2" sx={{ color: 'inherit' }}>
          <strong>Auction Callers:</strong> {counts.auctionCallerCount}
        </Typography>
        <Typography variant="body2" sx={{ color: 'inherit' }}>
          <strong>Lot Bidders:</strong> {counts.lotBiddersCount}
        </Typography>
      </CardContent>
    </Card>
  );
}

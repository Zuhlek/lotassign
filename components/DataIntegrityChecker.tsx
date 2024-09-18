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
  assignmentsCount: number;
};

// Direkt integrierte Funktion zur Datenbankintegritätsprüfung
async function getDatabaseCounts(): Promise<TableCounts> {
  const auctionsCount = await db.auctions.count();
  const lotsCount = await db.lots.count();
  const biddersCount = await db.bidders.count();
  const callersCount = await db.callers.count();
  const assignmentsCount = await db.assignments.count();

  return {
    auctionsCount,
    lotsCount,
    biddersCount,
    callersCount,
    assignmentsCount,
  };
}

// Funktion zur Ermittlung des Status basierend auf den Tabelleninhalten
function determineStatus(counts: TableCounts): StatusType {
  const { auctionsCount, lotsCount, biddersCount, callersCount, assignmentsCount } = counts;
  
  if (
    auctionsCount === 0 &&
    lotsCount === 0 &&
    biddersCount === 0 &&
    callersCount === 0 &&
    assignmentsCount === 0
  ) {
    return "error";
  } else if (
    auctionsCount !== 0 &&
    lotsCount !== 0 &&
    biddersCount !== 0 &&
    callersCount !== 0 &&
    assignmentsCount !== 0
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
    assignmentsCount: 0,
  });

  const [status, setStatus] = useState<StatusType>('info');

  useEffect(() => {
    // Verwende liveQuery, um auf Änderungen in der Datenbank zu reagieren
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

    // Cleanup der Subscription, wenn die Komponente unmountet wird
    return () => subscription.unsubscribe();
  }, []);

  // Farbe basierend auf Status festlegen
  const getCardStyle = () => {
    switch (status) {
      case "success":
        return { backgroundColor: "#d4edda", color: "#155724" }; // Green
      case "warning":
        return { backgroundColor: "#fff3cd", color: "#856404" }; // Yellow
      case "error":
        return { backgroundColor: "#f8d7da", color: "#721c24" }; // Red
      default:
        return { backgroundColor: "#cce5ff", color: "#004085" }; // Blue (info)
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
            <strong>Assignments:</strong> {counts.assignmentsCount}
          </Typography>
        </CardContent>
      </Card>
    </div>
  );
}

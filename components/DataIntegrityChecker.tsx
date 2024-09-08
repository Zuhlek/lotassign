'use client';

import { useEffect, useState } from 'react';
import { checkDatabaseIntegrity } from '@/lib/db/helpers/checkDatabaseIntegrity';
import { Alert, AlertTitle } from '@mui/material';

type StatusType = "success" | "warning" | "error" | "info";

export default function DataIntegrityChecker() {
  const [status, setStatus] = useState<StatusType>('info');
  const [message, setMessage] = useState<string>("Checking database integrity...");
  const [open, setOpen] = useState<boolean>(true); // Zustand zum Öffnen/Schließen des Alerts

  useEffect(() => {
    const checkIntegrity = async () => {
      try {
        const result = await checkDatabaseIntegrity();
        setStatus(result.status);
        setMessage(result.message);
      } catch (error) {
        setStatus("error");
        setMessage("An error occurred while checking database integrity.");
      }
    };

    checkIntegrity();

    // Alert nach 5 Sekunden automatisch schließen
    const timer = setTimeout(() => {
      setOpen(false);
    }, 5000); // 5000 ms = 5 Sekunden

    // Timer beim Cleanup des Effects entfernen
    return () => clearTimeout(timer);
  }, []);

  if (!open) return null; // Wenn der Alert geschlossen ist, rendere nichts

  return (
    <div>
      <Alert severity={status} onClose={() => setOpen(false)}>
        {message}
      </Alert>
    </div>
  );
}

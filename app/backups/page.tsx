'use client';

import React, { useState } from 'react';
import {  Button,  Box,  Dialog,  DialogActions,  DialogContent,  DialogContentText,  DialogTitle} from "@mui/material";
import { saveAs } from 'file-saver';
import DataIntegrityChecker from '@/components/DataIntegrityChecker';
import {  exportDatabase,  importToDatabase,  clearDB} from '@/lib/utils/db-helpers';

export default function BackupsPage() {
  const [open, setOpen] = useState(false);
  const [fileToImport, setFileToImport] = useState<File | null>(null);

  const formatDate = () => {
    const now = new Date();
    const pad = (v: number) => String(v).padStart(2, '0');
    return `${pad(now.getDate())}.${pad(now.getMonth() + 1)}.${now.getFullYear()}_${pad(now.getHours())}.${pad(now.getMinutes())}`;
  };

  const handleExport = async () => {
    const backup = await exportDatabase();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    saveAs(blob, `LotAssign_Backup_${formatDate()}.json`);
  };

  const handleImportClick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      setFileToImport(files[0]);
      setOpen(true);
    }
  };

  const handleConfirmImport = async () => {
    if (fileToImport) {
      const reader = new FileReader();
      reader.onload = async (event: ProgressEvent<FileReader>) => {
        const backupAsString = event.target?.result;
        if (typeof backupAsString === 'string') {
          await importToDatabase(backupAsString);
          alert("Database successfully restored.");
        }
      };
      reader.readAsText(fileToImport);
      setOpen(false);
    }
  };

  const handleResetDb = async () => {
    try {
      await clearDB();
      alert("Database cleared.");
    } catch (error) {
      console.error("Failed to clear DB:", error);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setFileToImport(null);
  };

  return (
    <Box>
      <h1>Data Management</h1>

      <Box display="flex" gap={2} marginBottom={2}>
        <Button variant="contained" onClick={handleExport}>
          Export Database (JSON)
        </Button>

        <input
          type="file"
          accept=".json"
          onChange={handleImportClick}
          style={{ display: "none" }}
          id="upload-backup-button-file"
        />
        <label htmlFor="upload-backup-button-file">
          <Button variant="contained" component="span">
            Import Database (JSON)
          </Button>
        </label>

        <Button onClick={handleResetDb} variant="contained" color="error">
          Clear DB
        </Button>
      </Box>

      <DataIntegrityChecker />

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Bestätigung des Imports</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Das Importieren einer Backup-Datei setzt die aktuelle Datenbank zurück. Alle vorhandenen Daten werden gelöscht und durch die Daten des Backups ersetzt. Möchten Sie fortfahren?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Abbrechen</Button>
          <Button onClick={handleConfirmImport} color="primary" variant="contained">
            Einverstanden
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

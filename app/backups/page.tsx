'use client';

import React, { useState } from 'react';
import { Button, Box, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";
import { saveAs } from 'file-saver';
import { db } from "@/lib/db/dexie.db";
import ResetDbButton from '@/components/workflow/buttons/reset-db-button';
import { exportDatabase } from '@/lib/db/helpers/exportDatabaseBackup';
import { importToDatabase } from '@/lib/db/helpers/importDatabaseBackup';

export default function BackupsPage() {
    const [open, setOpen] = useState(false);
    const [fileToImport, setFileToImport] = useState<File | null>(null);

    // Funktion zum Formatieren des Datums für den Dateinamen
    const formatDate = () => {
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0'); // Monate beginnen bei 0
        const year = now.getFullYear();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const dateToReturn = `${day}.${month}.${year}_${hours}.${minutes}`
        console.log(dateToReturn)
        return dateToReturn;
    };

    const handleExport = async () => {
        const backup = await exportDatabase();
        console.log(backup)
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
        saveAs(blob, `LotAssign_Backup_${formatDate()}.json`);
    }

    // Funktion zum Öffnen des Bestätigungsdialogs für den Import
    const handleImportClick = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files[0]) {
            setFileToImport(files[0]);
            setOpen(true); // Öffne den Dialog für die Bestätigung
        }
    };

    // Bestätigung des Imports (Zurücksetzen der Datenbank und Wiederherstellen der Daten)
    const handleConfirmImport = async () => {
        if (fileToImport) {
            const reader = new FileReader();
            reader.onload = async (event: ProgressEvent<FileReader>) => {
                const backupAsString = event.target?.result;
                if (typeof backupAsString === 'string') {
                    importToDatabase(backupAsString);
                    alert("Database successfully restored.");
                }
            };
            reader.readAsText(fileToImport);
            setOpen(false); // Schließe den Dialog nach dem Import
        }
    };

    // Dialog schließen
    const handleClose = () => {
        setOpen(false);
        setFileToImport(null); // Setze die ausgewählte Datei zurück
    };

    return (
        <Box>
            <h1>Data Management</h1>
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
                <Button variant="contained" component="span" sx={{ marginLeft: 2 }}>
                    Import Database (JSON)
                </Button>
            </label>

            <ResetDbButton></ResetDbButton>

            {/* Dialog zur Bestätigung des Imports */}
            <Dialog
                open={open}
                onClose={handleClose}
            >
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

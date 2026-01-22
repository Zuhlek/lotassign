'use client';

import React, { useState } from 'react';
import {
  Button,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Typography,
  Card,
  CardContent,
  Divider,
  Alert,
  CircularProgress,
} from "@mui/material";
import {
  Download,
  Upload,
  DeleteForever,
  Science,
  Refresh,
} from "@mui/icons-material";
import { saveAs } from 'file-saver';
import DataIntegrityChecker from '@/components/DataIntegrityChecker';
import { exportDatabase, importToDatabase, clearDB } from '@/lib/utils/db-helpers';
import { loadDemoData, getDemoDataDescription } from '@/lib/utils/demo-data';

type DialogType = 'import' | 'clear' | 'demo' | null;

export default function BackupsPage() {
  const [dialogOpen, setDialogOpen] = useState<DialogType>(null);
  const [fileToImport, setFileToImport] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const formatDate = () => {
    const now = new Date();
    const pad = (v: number) => String(v).padStart(2, '0');
    return `${pad(now.getDate())}.${pad(now.getMonth() + 1)}.${now.getFullYear()}_${pad(now.getHours())}.${pad(now.getMinutes())}`;
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      const backup = await exportDatabase();
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      saveAs(blob, `LotAssign_Backup_${formatDate()}.json`);
      showMessage('success', 'Database exported successfully');
    } catch (error) {
      showMessage('error', 'Failed to export database');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleImportClick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      setFileToImport(files[0]);
      setDialogOpen('import');
    }
  };

  const handleConfirmImport = async () => {
    if (fileToImport) {
      try {
        setLoading(true);
        const reader = new FileReader();
        reader.onload = async (event: ProgressEvent<FileReader>) => {
          const backupAsString = event.target?.result;
          if (typeof backupAsString === 'string') {
            await importToDatabase(backupAsString);
            showMessage('success', 'Database restored successfully');
            window.location.reload();
          }
        };
        reader.readAsText(fileToImport);
      } catch (error) {
        showMessage('error', 'Failed to import database');
        console.error(error);
      } finally {
        setLoading(false);
        setDialogOpen(null);
      }
    }
  };

  const handleClearDb = async () => {
    try {
      setLoading(true);
      await clearDB();
      showMessage('success', 'Database cleared');
      setDialogOpen(null);
      window.location.reload();
    } catch (error) {
      showMessage('error', 'Failed to clear database');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadDemo = async () => {
    try {
      setLoading(true);
      await loadDemoData();
      showMessage('success', 'Demo data loaded successfully! Go to Auction to see it.');
      setDialogOpen(null);
      window.location.reload();
    } catch (error) {
      showMessage('error', 'Failed to load demo data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setDialogOpen(null);
    setFileToImport(null);
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Data Management
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Export, import, or reset your auction data. All data is stored locally in your browser.
      </Typography>

      {message && (
        <Alert severity={message.type} sx={{ mb: 3 }} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Backup & Restore
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Download />}
              onClick={handleExport}
              disabled={loading}
            >
              Export Database
            </Button>

            <input
              type="file"
              accept=".json"
              onChange={handleImportClick}
              style={{ display: "none" }}
              id="upload-backup-button-file"
            />
            <label htmlFor="upload-backup-button-file">
              <Button
                variant="outlined"
                component="span"
                startIcon={<Upload />}
                disabled={loading}
              >
                Import Database
              </Button>
            </label>
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3, border: '2px solid', borderColor: 'primary.main' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Science color="primary" />
            <Typography variant="h6">
              Load Demo Data
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, whiteSpace: 'pre-line' }}>
            {getDemoDataDescription()}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
            Perfect for testing the assignment algorithm with edge cases like consecutive lots,
            rare languages, and caller preferences.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Refresh />}
            onClick={() => setDialogOpen('demo')}
            disabled={loading}
          >
            Load Demo Auction
          </Button>
        </CardContent>
      </Card>

      <Card sx={{ borderColor: 'error.main' }}>
        <CardContent>
          <Typography variant="h6" color="error" gutterBottom>
            Danger Zone
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Clear all data from the database. This action cannot be undone.
          </Typography>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteForever />}
            onClick={() => setDialogOpen('clear')}
            disabled={loading}
          >
            Clear Database
          </Button>
        </CardContent>
      </Card>

      <Divider sx={{ my: 3 }} />

      <DataIntegrityChecker />

      {/* Import Confirmation Dialog */}
      <Dialog open={dialogOpen === 'import'} onClose={handleClose}>
        <DialogTitle>Confirm Import</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Importing a backup file will replace all current data. This action cannot be undone.
            Do you want to continue?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleConfirmImport} color="primary" variant="contained">
            Import
          </Button>
        </DialogActions>
      </Dialog>

      {/* Clear Confirmation Dialog */}
      <Dialog open={dialogOpen === 'clear'} onClose={handleClose}>
        <DialogTitle>Clear Database?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will permanently delete all auctions, callers, bidders, and assignments.
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleClearDb} color="error" variant="contained">
            Clear All Data
          </Button>
        </DialogActions>
      </Dialog>

      {/* Demo Data Confirmation Dialog */}
      <Dialog open={dialogOpen === 'demo'} onClose={handleClose}>
        <DialogTitle>Load Demo Data?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will replace all current data with a demo auction containing:
          </DialogContentText>
          <Box component="ul" sx={{ mt: 1, pl: 2 }}>
            <li>10 callers with various language skills</li>
            <li>15 bidders from different countries</li>
            <li>25 art lots across lot numbers 1-50</li>
            <li>Pre-configured edge cases for testing</li>
          </Box>
          <DialogContentText sx={{ mt: 1 }}>
            Current data will be deleted. Continue?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleLoadDemo} color="primary" variant="contained">
            Load Demo
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

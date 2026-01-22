"use client";
import React, { useEffect, useState } from "react";
import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Chip, Snackbar, Alert, Backdrop, Paper, Typography, Container, Divider } from "@mui/material";
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from "@mui/icons-material";
import ExcelJS from "exceljs";
import { Language } from "@/lib/models/language.enum";
import { Caller } from "@/lib/models/caller.model";
import { getAllCallers, updateCaller, createCaller, getCallerById, deleteCaller } from "@/lib/actions/caller.actions";

export default function CallersPage() {
  const [callers, setCallers] = useState<Caller[]>([]);
  const [open, setOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [callerData, setCallerData] = useState<Caller | null>(null);
  const [selectedLanguages, setSelectedLanguages] = useState<Language[]>([]);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadCallers = async () => {
      const result = await getAllCallers();
      setCallers(result);
    };
    loadCallers();
  }, []);

  const handleOpen = (caller?: Caller) => {
    setDialogError(null);
    if (caller) {
      setIsEdit(true);
      setCallerData(caller);
      setSelectedLanguages(caller.languages);
    } else {
      setIsEdit(false);
      setCallerData(new Caller("", "", []));
      setSelectedLanguages([]);
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setCallerData(null);
    setDialogError(null);
  };

  const handleSave = async () => {
    if (!callerData) return;
    const updatedCaller = new Caller(callerData.name, callerData.abbreviation, selectedLanguages, callerData.id);
    if (isEdit && updatedCaller.id) {
      const result = await updateCaller(updatedCaller);
      if (result === null) {
        setDialogError(`Caller "${updatedCaller.name} & ${updatedCaller.abbreviation}" already exists.`);
        return;
      }
      setCallers(prev => prev.map(c => (c.id === updatedCaller.id ? updatedCaller : c)));
    } else {
      const id = await createCaller(updatedCaller);
      if (!id) {
        setDialogError(`Caller "${updatedCaller.name} & ${updatedCaller.abbreviation}" already exists.`);
        return;
      }
      const created = await getCallerById(id);
      if (created) setCallers(prev => [...prev, created]);
    }
    handleClose();
  };

  const handleDelete = async (id: number) => {
    await deleteCaller(id);
    setCallers(prev => prev.filter(c => c.id !== id));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCallerData(prev => prev
      ? new Caller(
        e.target.name === "name" ? e.target.value : prev.name,
        e.target.name === "abbreviation" ? e.target.value : prev.abbreviation,
        prev.languages,
        prev.id
      )
      : null
    );
  };

  const toggleLanguageSelection = (language: Language) => {
    setSelectedLanguages(prev => prev.includes(language) ? prev.filter(l => l !== language) : [...prev, language]);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      try {
        const workbook = new ExcelJS.Workbook();
        const data = await files[0].arrayBuffer();
        await workbook.xlsx.load(data);
        const worksheet = workbook.worksheets[0];
        if (!worksheet) {
          setUploadMessage("No worksheet found in Excel file.");
          return;
        }
        const nameHeader = worksheet.getCell("A1").value;
        const abbreviationHeader = worksheet.getCell("B1").value;
        const languagesHeader = worksheet.getCell("C1").value;
        if (nameHeader !== "Name" || (abbreviationHeader !== "Abbreviation" && abbreviationHeader !== "Kürzel") || (languagesHeader !== "Languages" && languagesHeader !== "Sprachen")) {
          setUploadMessage("Invalid Excel headers.");
          return;
        }
        const rows: any[] = [];
        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber > 1) {
            const values = row.values as any;
            rows.push({ name: values[1], abbreviation: values[2], languages: (values[3] as string).split(",").map((lang) => lang.trim()) });
          }
        });
        const createdCallers: Caller[] = [];
        const skipped: string[] = [];

        for (const row of rows) {
          const langs: Language[] = row.languages.map((lang: string) => Object.values(Language).includes(lang as Language) ? lang : Language.Englisch);
          const caller = new Caller(row.name, row.abbreviation, langs);
          const id = await createCaller(caller);
          if (!id) {
            skipped.push(`${row.name} (${row.abbreviation})`);
            continue;
          }
          const created = await getCallerById(id);
          if (created) createdCallers.push(created);
        }

        setCallers(prev => [...prev, ...createdCallers]);
        if (skipped.length > 0) {
          setUploadMessage(`${skipped.join(", ")}`);
        } else {
          setUploadMessage("All callers imported successfully.");
        }
      } catch (error) {
        console.error("Error processing Excel:", error);
        setUploadMessage("Failed to process Excel file.");
      }
    }
  };

  return (
    <>

      <Container>
        <TableContainer sx={{ maxWidth: 1000 }}>
          <Box display="flex" justifyContent="space-between" alignContent="center" sx={{ my: 4 }}>
            <Typography variant="h4" >Callers</Typography>
            <Box>
              <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} style={{ display: "none" }} id="upload-caller-button-file" />
              <label htmlFor="upload-caller-button-file">
                <Button variant="contained" component="span" sx={{ marginRight: 1 }}>Import Callers</Button>
              </label>
              <Button variant="contained" onClick={() => handleOpen()}><AddIcon /></Button>
            </Box>
          </Box>
          <Divider />
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>
                  <Typography variant="h6">Name</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="h6">Abbreviation</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="h6">Languages</Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="h6">Actions</Typography>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {callers.map((caller) => (
                <TableRow key={caller.id}>
                  <TableCell>{caller.name}</TableCell>
                  <TableCell>{caller.abbreviation}</TableCell>
                  <TableCell>{caller.languages.join(", ")}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" sx={{ p: 0, mx: 2 }} onClick={() => handleOpen(caller)}><EditIcon /></IconButton>
                    <IconButton size="small" sx={{ p: 0, mx: 2 }} onClick={() => handleDelete(caller.id!)}><DeleteIcon /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Container>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{isEdit ? "Edit Caller" : "Add Caller"}</DialogTitle>
        <DialogContent>
          <TextField label="Name" name="name" value={callerData?.name || ""} onChange={handleChange} fullWidth margin="normal" />
          <TextField label="Abbreviation" name="abbreviation" value={callerData?.abbreviation || ""} onChange={handleChange} fullWidth margin="normal" />
          <Box marginTop={2}>
            {Object.values(Language).map((language) => (
              <Chip key={language} label={language} onClick={() => toggleLanguageSelection(language)} color={selectedLanguages.includes(language) ? "primary" : "default"} sx={{ margin: 0.5 }} />
            ))}
          </Box>
        </DialogContent>
        <Box minHeight={50} display="flex" justifyContent="center" alignItems="center">
          {dialogError && (
            <Alert severity="error">
              {dialogError}
            </Alert>
          )}
        </Box>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">{isEdit ? "Update" : "Create"}</Button>
        </DialogActions>

      </Dialog>

      <Backdrop open={Boolean(uploadMessage)} sx={{ zIndex: 1300, color: "#fff", backdropFilter: "blur(2px)" }} onClick={() => setUploadMessage(null)}>
        <Paper elevation={4} sx={{ padding: 4, maxWidth: 600, textAlign: "center" }}>
          <Typography variant="h6" gutterBottom>Duplicate entries were not imported.</Typography>
          <Typography variant="caption" gutterBottom>{uploadMessage}<br></br><br></br></Typography>
          <Button onClick={() => setUploadMessage(null)} variant="contained">Close</Button>
        </Paper>
      </Backdrop>

    </>
  );
}
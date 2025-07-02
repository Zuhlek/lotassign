"use client";

import React, { useEffect, useState } from "react";
import {
  Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Chip
} from "@mui/material";
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from "@mui/icons-material";
import UploadExcelDataButton from "@/components/buttons/upload-caller-data-button";

import { Caller } from "@/lib/models/caller.model";
import { Language } from "@/lib/models/language.enum";
import { getAllCallers, updateCaller, createCaller, getCallerById, deleteCaller } from "@/lib/actions/caller.actions";

export default function CallersPage() {
  const [callers, setCallers] = useState<Caller[]>([]);
  const [open, setOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [callerData, setCallerData] = useState<Caller | null>(null);
  const [selectedLanguages, setSelectedLanguages] = useState<Language[]>([]);

  useEffect(() => {
    const loadCallers = async () => {
      const result = await getAllCallers();
      setCallers(result.map(Caller.fromJSON));
    };
    loadCallers();
  }, []);

  const handleOpen = (caller?: Caller) => {
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
  };

  const handleSave = async () => {
    if (!callerData) return;

    const updatedCaller = new Caller(
      callerData.abbreviation,
      callerData.name,
      selectedLanguages,
      callerData.id
    );

    if (isEdit && updatedCaller.id) {
      await updateCaller(updatedCaller);
      setCallers((prev) =>
        prev.map((c) => (c.id === updatedCaller.id ? updatedCaller : c))
      );
    } else {
      const id = await createCaller(updatedCaller);
      const created = await getCallerById(id);
      if (created) setCallers((prev) => [...prev, created]);
    }

    handleClose();
  };

  const handleDelete = async (id: number) => {
    await deleteCaller(id);
    setCallers((prev) => prev.filter((c) => c.id !== id));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCallerData((prev) =>
      prev
        ? new Caller(
            e.target.name === "abbreviation" ? e.target.value : prev.abbreviation,
            e.target.name === "name" ? e.target.value : prev.name,
            prev.languages,
            prev.id
          )
        : null
    );
  };

  const toggleLanguageSelection = (language: Language) => {
    setSelectedLanguages((prev) =>
      prev.includes(language)
        ? prev.filter((l) => l !== language)
        : [...prev, language]
    );
  };

  return (
    <Box>
      <h1>Callers</h1>
      <TableContainer sx={{ maxWidth: 1000 }}>
        <Box display="flex" justifyContent="flex-end" marginBottom={2}>
          <UploadExcelDataButton uploadModel="Caller" />
          <Button variant="contained" onClick={() => handleOpen()}><AddIcon /></Button>
        </Box>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Abbreviation</TableCell>
              <TableCell>Languages</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {callers.map((caller) => (
              <TableRow key={caller.id}>
                <TableCell>{caller.name}</TableCell>
                <TableCell>{caller.abbreviation}</TableCell>
                <TableCell>{caller.languages.join(", ")}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleOpen(caller)}><EditIcon /></IconButton>
                  <IconButton onClick={() => handleDelete(caller.id!)}><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{isEdit ? "Edit Caller" : "Add Caller"}</DialogTitle>
        <DialogContent>
          <TextField
            label="Name"
            name="name"
            value={callerData?.name || ""}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Abbreviation"
            name="abbreviation"
            value={callerData?.abbreviation || ""}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
          <Box marginTop={2}>
            {Object.values(Language).map((language) => (
              <Chip
                key={language}
                label={language}
                onClick={() => toggleLanguageSelection(language)}
                color={selectedLanguages.includes(language) ? "primary" : "default"}
                sx={{ margin: 0.5 }}
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            {isEdit ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

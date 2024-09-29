'use client';

import React, { useState } from "react";
import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from "@mui/material";
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from "@mui/icons-material";
import { useLiveQuery } from "dexie-react-hooks";
import { CallerService } from '@/lib/services/caller.service'; // Importiere den CallerService
import { Caller } from '@/lib/models/caller.model';
import { Language } from "@/lib/models/language.model";
import UploadExcelDataButton from "@/components/workflow/buttons/upload-excel-data-button";

export default function CallersPage() {
    // Live Query für Callers
    const callers = useLiveQuery(() => CallerService.getAllCallers(), []);

    // Zustand für den Dialog und die Bearbeitung
    const [open, setOpen] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [callerData, setCallerData] = useState<Caller | null>(null);

    // Öffne das Modal für "Create" oder "Update"
    const handleOpen = (caller?: Caller) => {
        if (caller) {
            setIsEdit(true);
            setCallerData(caller); // Bestehende Daten für Bearbeitung
        } else {
            setIsEdit(false);
            setCallerData({ name: "", abbreviation: "", languages: [] }); // Neue Daten für Create
        }
        setOpen(true);
    };

    // Schließe das Modal
    const handleClose = () => {
        setOpen(false);
        setCallerData(null);
    };

    // CRUD-Operationen
    const handleSave = async () => {
        if (callerData) {
            if (isEdit) {
                // Update
                await CallerService.updateCaller(callerData.id!, callerData);
            } else {
                // Create
                await CallerService.createCaller(callerData);
            }
            handleClose();
        }
    };

    const handleDelete = async (id: number) => {
        await CallerService.deleteCaller(id);
    };

    // Eingabeänderungen
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCallerData({ ...callerData!, [e.target.name]: e.target.value });
    };

    return (
        <Box>
            <h1>Callers</h1>
            <TableContainer sx={{ maxWidth: 1000 }}>
                <Box display="flex" justifyContent="flex-end" marginBottom={2}>
                    <UploadExcelDataButton uploadModel="Caller"></UploadExcelDataButton>
                    <Button variant="contained"  onClick={() => handleOpen()}><AddIcon /></Button>
                </Box>
                <Table size="small" stickyHeader >
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Abbreviation</TableCell>
                            <TableCell>Languages</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {callers?.map((caller) => (
                            <TableRow key={caller.id}>
                                <TableCell>{caller.name}</TableCell>
                                <TableCell>{caller.abbreviation}</TableCell>
                                <TableCell>{caller.languages.join(", ")}</TableCell>
                                <TableCell align="right">
                                    {/* Bearbeiten */}
                                    <IconButton onClick={() => handleOpen(caller)}>
                                        <EditIcon />
                                    </IconButton>
                                    {/* Löschen */}
                                    <IconButton onClick={() => handleDelete(caller.id!)}>
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Dialog für Create/Update */}
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
                    <TextField
                        label="Languages (comma separated)"
                        name="languages"
                        value={callerData?.languages?.join(", ") || ""}
                        onChange={(e) =>
                            setCallerData({
                                ...callerData!,
                                languages: e.target.value.split(",").map((lang: string) =>
                                    Object.values(Language).find((val) => val === lang)
                                      ? Object.values(Language).find((val) => val === lang)
                                      : Language.Englisch)
                        })}
                        fullWidth
                        margin="normal"
                    />
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

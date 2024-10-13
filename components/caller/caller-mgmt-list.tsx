'use client';

import React, { useState } from "react";
import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Chip, FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from "@mui/icons-material";
import { callerService } from '@/lib/services/caller.service';
import { Caller } from '@/lib/models/caller.model';
import { Language } from "@/lib/models/language.model";
import UploadExcelDataButton from "@/components/buttons/upload-excel-data-button";

interface CallerMgmtListProps {
  callers: Caller[] | undefined;
}

export default function CallerMgmtList({ callers }: CallerMgmtListProps) {

    const [open, setOpen] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [callerData, setCallerData] = useState<Caller | null>(null);
    const [selectedLanguages, setSelectedLanguages] = useState<Language[]>([]);

    const handleOpen = (caller?: Caller) => {
        if (caller) {
            setIsEdit(true);
            setCallerData(caller);
            setSelectedLanguages(caller.languages as Language[]);
        } else {
            setIsEdit(false);
            setCallerData({ name: "", abbreviation: "", languages: [] });
            setSelectedLanguages([]);
        }
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setCallerData(null);
    };

    const handleSave = async () => {
        if (callerData) {
            const updatedCaller = { ...callerData, languages: selectedLanguages };
            if (isEdit && callerData.id) {
                await callerService.updateCaller(callerData.id, callerData.name, callerData.abbreviation, updatedCaller.languages);
            } else {
                await callerService.createCaller(updatedCaller.name, updatedCaller.abbreviation, updatedCaller.languages);
            }
            handleClose();
        }
    };

    const handleDelete = async (id: number) => {
        await callerService.deleteCaller(id);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCallerData({ ...callerData!, [e.target.name]: e.target.value });
    };

    const toggleLanguageSelection = (language: Language) => {
        if (selectedLanguages.includes(language)) {
            setSelectedLanguages(selectedLanguages.filter(lang => lang !== language));
        } else {
            setSelectedLanguages([...selectedLanguages, language]);
        }
    };

    return (
        <Box>
            <h1>Callers</h1>
            <TableContainer sx={{ maxWidth: 1000 }}>
                <Box display="flex" justifyContent="flex-end" marginBottom={2}>
                    <UploadExcelDataButton uploadModel="Caller"></UploadExcelDataButton>
                    <Button variant="contained" onClick={() => handleOpen()}><AddIcon /></Button>
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
                                    <IconButton onClick={() => handleOpen(caller)}>
                                        <EditIcon />
                                    </IconButton>
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

                    <Box margin="normal">
                        <h4>Languages</h4>
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

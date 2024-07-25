"use client";
import { useState, useEffect } from "react";
import { Box, Button, TextField, Typography } from "@mui/material";
import { db } from "@/lib/dexie.db";
import { Caller } from "@/lib/models/caller.model";
import { CallerService } from "@/lib/services/caller.service";
import { Language } from "@/lib/models/language.model";

export function CreateCallerForm() {
  const [name, setName] = useState("");
  const [abbreviation, setAbbreviation] = useState("");
  const [languages, setLanguages] = useState<string[]>([]);
  const [status, setStatus] = useState("");
  const [callers, setCallers] = useState<Caller[]>([]);
  const [editCallerId, setEditCallerId] = useState<number | null>(null);

  useEffect(() => {
    async function fetchCallers() {
      const data = await CallerService.getAllCallers();
      setCallers(data);
    }
    fetchCallers();
  }, []);

  const validateLanguages = (langs: string[]): langs is Language[] => {
    return langs.every(lang => Object.values(Language).includes(lang as Language));
  };

  const handleLanguagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const langs = e.target.value.split(",").map(lang => lang.trim() as Language);
    if (validateLanguages(langs)) {
      setLanguages(langs);
      setStatus("");
    } else {
      setStatus("Invalid language input. Please use only allowed language codes.");
    }
  };

  async function createCaller() {
    if (!validateLanguages(languages)) {
      setStatus("Invalid languages. Please correct the input.");
      return;
    }
    try {
      const id = await db.callers.add({ name, abbreviation, languages });
      setStatus(`Successfully created caller with id ${id}`);
      resetForm();
      const data = await CallerService.getAllCallers();
      setCallers(data);
    } catch (error) {
      setStatus(`Failed to create caller: ${error}`);
    }
  }

  async function updateCaller() {
    if (!editCallerId) return;
    if (!validateLanguages(languages)) {
      setStatus("Invalid languages. Please correct the input.");
      return;
    }
    try {
      await CallerService.updateCaller(editCallerId, { name, abbreviation, languages });
      setStatus(`Successfully updated caller with id ${editCallerId}`);
      resetForm();
      const data = await CallerService.getAllCallers();
      setCallers(data);
    } catch (error) {
      setStatus(`Failed to update caller: ${error}`);
    }
  }

  async function deleteCaller(id: number) {
    try {
      await CallerService.deleteCaller(id);
      setStatus(`Successfully deleted caller with id ${id}`);
      const data = await CallerService.getAllCallers();
      setCallers(data);
    } catch (error) {
      setStatus(`Failed to delete caller: ${error}`);
    }
  }

  function resetForm() {
    setName("");
    setAbbreviation("");
    setLanguages([]);
    setEditCallerId(null);
  }

  return (
    <Box>
      <TextField
        label="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <TextField
        label="Abbreviation"
        value={abbreviation}
        onChange={(e) => setAbbreviation(e.target.value)}
      />
      <TextField
        label="Languages (comma-separated)"
        value={languages.join(",")}
        onChange={handleLanguagesChange}
      />
      <Button onClick={editCallerId ? updateCaller : createCaller}>
        {editCallerId ? "Update Caller" : "Create Caller"}
      </Button>
      <Button onClick={resetForm} style={{ marginLeft: '10px' }}>Reset</Button>
      <Typography>{status}</Typography>
      <Box mt={4}>
        <Typography variant="h6">Existing Callers:</Typography>
        {callers.map((caller) => (
          <Box key={caller.id} mb={2}>
            <Typography>Name: {caller.name}</Typography>
            <Typography>Abbreviation: {caller.abbreviation}</Typography>
            <Typography>Languages: {caller.languages ? caller.languages.join(", ") : "none"}</Typography>
            <Button onClick={() => {
              setEditCallerId(caller.id!);
              setName(caller.name);
              setAbbreviation(caller.abbreviation);
              setLanguages(caller.languages);
            }}>
              Edit
            </Button>
            <Button onClick={() => deleteCaller(caller.id!)} style={{ marginLeft: '10px' }}>
              Delete
            </Button>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

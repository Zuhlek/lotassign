"use client";
import { initializeDB } from "@/lib/dexie.db";
import { Button } from "@mui/material";

export default function ResetDbButton() {
  const resetDB = async () => {
    initializeDB().catch((error) => {
      console.error("Failed to initialize DB:", error);
    });
  };

  return (
    <Button onClick={resetDB} variant="contained" sx={{ margin: 1 }}>
      Reset DB
    </Button>
  );
}

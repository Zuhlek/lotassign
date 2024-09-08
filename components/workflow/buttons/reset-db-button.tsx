"use client";
import { clearDB } from "@/lib/db/dexie.db";
import { Button } from "@mui/material";

export default function ResetDbButton() {
  const resetDB = async () => {
    clearDB().catch((error) => {
      console.error("Failed to initialize DB:", error);
    });
  };

  return (
    <Button onClick={resetDB} variant="contained" sx={{ margin: 1 }}>
      Clear DB
    </Button>
  );
}

'use client';

import { Button } from "@mui/material";
import ExcelJS from "exceljs";
import { db } from "@/lib/db/dexie.db";

export default function UploadCallerDataButton() {
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const workbook = new ExcelJS.Workbook();
      const data = await files[0].arrayBuffer();
      await workbook.xlsx.load(data);
      const worksheet = workbook.worksheets[0];

      // Direkt auf Zellen A1, B1, C1 zugreifen und überprüfen
      const nameHeader = worksheet.getCell('A1').value;
      const abbreviationHeader = worksheet.getCell('B1').value;
      const languagesHeader = worksheet.getCell('C1').value;

      console.log(nameHeader, abbreviationHeader, languagesHeader)

      if (nameHeader !== 'Name' || abbreviationHeader !== 'Kürzel' || languagesHeader !== 'Sprachen') {
        alert("Invalid Excel format. Expected headers: (A1) 'Name', (B1) 'Kürzel', (C1) 'Sprachen'.");
        return;
      }

      const rows: any[] = [];
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) { // Überspringe die Header-Zeile
          const rowValues = row.values as any;
          rows.push({
            CallerName: rowValues[1],
            CallerAbbreviation: rowValues[2],
            CallerLanguages: (rowValues[3] as string).split(',').map(lang => lang.trim()), // Split and trim languages
          });
        }
      });

      // Speichern der Caller-Daten in der IndexedDB
      for (const row of rows) {
        await db.callers.add({
          name: row.CallerName,
          abbreviation: row.CallerAbbreviation,
          languages: row.CallerLanguages,
        });
      }

      alert("Caller data successfully uploaded.");
    }
  };

  return (
    <div>
      <input
        type="file"
        accept=".xlsx"
        onChange={handleFileChange}
        style={{ display: "none" }}
        id="upload-caller-button-file"
      />
      <label htmlFor="upload-caller-button-file">
        <Button variant="contained" component="span">
          Import Callers
        </Button>
      </label>
    </div>
  );
}

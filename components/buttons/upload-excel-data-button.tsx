"use client";
import { Button } from "@mui/material";
import ExcelJS from "exceljs";
import { db } from "@/lib/db/dexie.db";
import { Language } from "@/lib/models/language.model";
import { callerService } from "@/lib/services/caller.service";

interface UploadDataButtonProps {
  auctionId?: number; // auctionId wird nur für Bidders benötigt
  uploadModel: "Bidder" | "Caller";
}

export default function UploadExcelDataButton({ auctionId, uploadModel }: UploadDataButtonProps) {
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const workbook = new ExcelJS.Workbook();
      const data = await files[0].arrayBuffer();
      await workbook.xlsx.load(data);
      const worksheet = workbook.worksheets[0];

      if (uploadModel === "Bidder") {
        await handleBidderUpload(worksheet, auctionId!);
      } else if (uploadModel === "Caller") {
        await handleCallerUpload(worksheet);
      }
    }
  };

  const handleBidderUpload = async (worksheet: ExcelJS.Worksheet, auctionId: number) => {
    const rows: any[] = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) { // Skip header row
        const rowValues = row.values as any;
        rows.push({
          LotNumber: rowValues[1],
          LotName: rowValues[2],
          BidderName: rowValues[3],
          BidderPhoneNumber: rowValues[4],
          BidderLanguages: (rowValues[5] as string).split(',').map(lang => lang.trim()) // Split and trim languages
        });
      }
    });

    const bidderMap = new Map();

    for (const bpl of rows) {
      let bidderId;
      if (!bidderMap.has(bpl.BidderName)) {
        bidderId = await db.bidders.add({
          name: bpl.BidderName,
          phoneNumber: bpl.BidderPhoneNumber,
          languages: bpl.BidderLanguages.map((lang: string) =>
            Object.values(Language).find((val) => val === lang)
              ? Object.values(Language).find((val) => val === lang)
              : Language.Englisch
          ),
        });
        bidderMap.set(bpl.BidderName, bidderId);
      } else {
        bidderId = bidderMap.get(bpl.BidderName);
      }

      let lotId = undefined;
      let existingLot = await db.lots.where("[number+auctionId]").equals([parseInt(bpl.LotNumber), auctionId]).first();
      if (existingLot) {
        lotId = existingLot.id;
      } else {
        lotId = await db.lots.add({
          number: parseInt(bpl.LotNumber),
          description: bpl.LotName,
          auctionId: auctionId,
          assignmentIds: [],
        });
      }

      if (!lotId) continue;
      const assignmentId = await db.assignments.add({
        lotId: lotId,
        bidderId: bidderId,
        callerId: undefined, // Assuming no caller initially
        isFinal: false,
      });

      if (assignmentId !== undefined) {
        const lot = await db.lots.get(lotId);
        if (lot && lot.assignmentIds) {
          await db.lots.update(lotId, { assignmentIds: [...lot.assignmentIds, assignmentId] });
        }
      }
    }
  };

  const handleCallerUpload = async (worksheet: ExcelJS.Worksheet) => {
    // Direkt auf Zellen A1, B1, C1 zugreifen und überprüfen
    const nameHeader = worksheet.getCell('A1').value;
    const abbreviationHeader = worksheet.getCell('B1').value;
    const languagesHeader = worksheet.getCell('C1').value;

    if (nameHeader !== 'Name' || abbreviationHeader !== 'Kürzel' || languagesHeader !== 'Sprachen') {
      alert("Invalid Excel format. Expected headers: (A1) 'Name', (B1) 'Kürzel', (C1) 'Sprachen'.");
      return;
    }

    const rows: any[] = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) { // Skip header row
        const rowValues = row.values as any;
        rows.push({
          CallerName: rowValues[1],
          CallerAbbreviation: rowValues[2],
          CallerLanguages: (rowValues[3] as string).split(',').map(lang => lang.trim()), // Split and trim languages
        });
      }
    });

    for (const row of rows) {
      await callerService.createCaller(row.CallerName, row.CallerAbbreviation, row.CallerLanguages);
    }

    alert("Caller data successfully uploaded.");
  };

  return (
    <div>
      <input
        type="file"
        accept=".xlsx, .xls"
        onChange={handleFileChange}
        style={{ display: "none" }}
        id={`upload-${uploadModel.toLowerCase()}-button-file`}
      />
      <label htmlFor={`upload-${uploadModel.toLowerCase()}-button-file`}>
        <Button variant="contained" component="span" sx={{ margin: 1 }}>
          {uploadModel === "Bidder" ? "Import Bidder & Lot Data" : "Import Callers"}
        </Button>
      </label>
    </div>
  );
}

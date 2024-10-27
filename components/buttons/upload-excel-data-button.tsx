"use client";
import { Button } from "@mui/material";
import ExcelJS from "exceljs";
import { Language } from "@/lib/models/language.model";
import { bidderService } from "@/lib/services/bidder.service";
import { Bidder } from "@/lib/models/bidder.model";
import { lotService } from "@/lib/services/lot.service";
import { Lot } from "@/lib/models/lot.model";
import { assignmentService } from "@/lib/services/assignment.service";
import { Assignment } from "@/lib/models/assignment.model";
import { callerService } from "@/lib/services/caller.service";
import { Caller } from "@/lib/models/caller.model";

interface UploadDataButtonProps {
  auctionId?: number; // auctionId is only needed for Bidders
  uploadModel: "Bidder" | "Caller";
}

export default function UploadExcelDataButton({ auctionId, uploadModel }: UploadDataButtonProps) {
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      try {
        const workbook = new ExcelJS.Workbook();
        const data = await files[0].arrayBuffer();
        await workbook.xlsx.load(data);
        const worksheet = workbook.worksheets[0];

        if (uploadModel === "Bidder") {
          if (!auctionId) {
            alert("Auction ID is required for uploading Bidder data.");
            return;
          }
          await handleBidderUpload(worksheet, auctionId);
        } else if (uploadModel === "Caller") {
          await handleCallerUpload(worksheet);
        }
      } catch (error) {
        console.error("Error processing the Excel file:", error);
        alert("An error occurred while processing the file. Please check the console for details.");
      }
    }
  };

  const handleBidderUpload = async (worksheet: ExcelJS.Worksheet, auctionId: number) => {
    const rows: any[] = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        // Skip header row
        const rowValues = row.values as any;
        rows.push({
          LotNumber: rowValues[1],
          LotName: rowValues[2],
          BidderName: rowValues[3],
          BidderPhoneNumber: rowValues[4],
          BidderLanguages: (rowValues[5] as string).split(",").map((lang) => lang.trim()), // Split and trim languages
        });
      }
    });

    const bidderMap = new Map<string, Bidder>();
    const lotMap = new Map<string, Lot>();

    for (const bpl of rows) {
      // Step 1: Create or Retrieve Bidder
      let bidder: Bidder | undefined;
      if (!bidderMap.has(bpl.BidderName)) {
        // Map language strings to Language enums, defaulting to Englisch
        const languages: Language[] = bpl.BidderLanguages
          .map((lang: string) => {
            const enumLang = Object.values(Language).find((val) => val === lang);
            return enumLang ? enumLang : Language.Englisch;
          });

        // Instantiate Bidder model
        const newBidder = new Bidder(undefined, bpl.BidderName, languages, bpl.BidderPhoneNumber);

        // Create Bidder via Service
        const bidderId = await bidderService.createBidder(newBidder);

        // Retrieve the created Bidder
        bidder = await bidderService.getBidderById(bidderId);
        if (!bidder) {
          console.error(`Failed to create bidder: ${bpl.BidderName}`);
          continue; // Skip to next row
        }

        // Store in map for reuse
        bidderMap.set(bpl.BidderName, bidder);
      } else {
        bidder = bidderMap.get(bpl.BidderName)!;
      }

      // Step 2: Create or Retrieve Lot
      let lot: Lot | undefined;
      const lotKey = `${auctionId}-${bpl.LotNumber}`;
      if (!lotMap.has(lotKey)) {
        // Check if Lot exists via LotService
        lot = await lotService.getLotByAuctionIdAndNumber(auctionId, parseInt(bpl.LotNumber));
        if (!lot) {
          // Instantiate Lot model
          const newLot = new Lot(undefined, parseInt(bpl.LotNumber), bpl.LotName, auctionId.toString(), []);

          // Create Lot via Service
          const createdLot = await lotService.createLot(newLot);
          lot = createdLot;
        }

        // Store in map for reuse
        lotMap.set(lotKey, lot);
      } else {
        lot = lotMap.get(lotKey)!;
      }

      // Step 3: Create Assignment
      const newAssignment = new Assignment(
        undefined,      // ID will be assigned by the service
        undefined,      // Caller is undefined initially
        lot,            // Associated Lot
        bidder,         // Associated Bidder
        false           // isFinal flag
      );

      // Create Assignment via Service
      const assignmentId = await assignmentService.createAssignment(newAssignment);

      if (assignmentId === -1) {
        console.error(`Failed to create assignment for Lot ${bpl.LotNumber} and Bidder ${bpl.BidderName}`);
        continue; // Skip to next row
      }

      // No need to manually update Lot's assignmentIds; service should handle it
    }

    // Provide user feedback upon completion
    alert("Bidder and Lot data imported successfully.");
  };

  const handleCallerUpload = async (worksheet: ExcelJS.Worksheet) => {
    // Access cells A1, B1, C1 and verify headers
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
      try {
        // Map language strings to Language enums, defaulting to Englisch
        const languages: Language[] = row.CallerLanguages
          .map((lang: string) => {
            const enumLang = Object.values(Language).find((val) => val === lang);
            return enumLang ? enumLang : Language.Englisch;
          });

        // Create Caller via Service
        await callerService.createCaller(new Caller(undefined, row.CallerName, row.CallerAbbreviation, languages));
      } catch (error) {
        console.error(`Failed to create caller: ${row.CallerName}`, error);
        // Optionally, continue or break based on the desired behavior
        continue;
      }
    }

    // Provide user feedback upon completion
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

"use client";
import { Button } from "@mui/material";
import ExcelJS from "exceljs";
import { Language } from "@/lib/models/language.enum";
import { Bidder } from "@/lib/models/bidder.model";
import { Lot } from "@/lib/models/lot.model";

interface UploadBidderDataButtonProps {
  auctionId: number;
}

export default function UploadBidderDataButton({ auctionId }: UploadBidderDataButtonProps) {
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      try {
        const workbook = new ExcelJS.Workbook();
        const data = await files[0].arrayBuffer();
        await workbook.xlsx.load(data);
        const worksheet = workbook.worksheets[0];

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

        // Optionally, provide user feedback upon completion
        alert("Bidder and Lot data imported successfully.");
      } catch (error) {
        console.error("Error importing bidder and lot data:", error);
        alert("An error occurred while importing data. Please check the console for details.");
      }
    };

    return (
      <div>
        <input
          type="file"
          accept=".xlsx, .xls"
          onChange={handleFileChange}
          style={{ display: "none" }}
          id="upload-button-file"
        />
        <label htmlFor="upload-button-file">
          <Button variant="contained" component="span" sx={{ margin: 1 }}>
            Import Bidder & Lot Data
          </Button>
        </label>
      </div>
    );
  }
}

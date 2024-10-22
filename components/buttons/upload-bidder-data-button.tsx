"use client";
import { Button } from "@mui/material";
import ExcelJS from "exceljs";
import { db } from "@/lib/db/dexie.db";
import { Language } from "@/lib/models/language.model";
import { bidderService } from "@/lib/services/bidder.service";
import { Bidder } from "@/lib/models/bidder.model";
import { LotService } from "@/lib/services/lot.service";
import { Lot } from "@/lib/models/lot.model";
import { AssignmentService } from "@/lib/services/assignment.service";
import { Assignment } from "@/lib/models/assignment.model";

interface UploadBidderDataButtonProps {
  auctionId: number;
}

export default function UploadBidderDataButton({ auctionId }: UploadBidderDataButtonProps) {
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
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

      const bidderMap = new Map();

      for (const bpl of rows) {
        let bidderId;
        if (!bidderMap.has(bpl.BidderName)) {
          bidderId = await bidderService.createBidder(
            new Bidder(
              bpl.BidderName,
              bpl.BidderPhoneNumber,
              bpl.BidderLanguages.map((lang: string) =>
                Object.values(Language).find((val) => val === lang)
                  ? Object.values(Language).find((val) => val === lang)
                  : Language.Englisch
              ),
              bpl.BidderPhoneNumber
            )
          );
          bidderMap.set(bpl.BidderName, bidderId);
        } else {
          bidderId = bidderMap.get(bpl.BidderName);
        }

        let lotId = undefined;
        let existingLot = await db.lots
          .where("[number+auctionId]")
          .equals([parseInt(bpl.LotNumber), auctionId])
          .first();
        if (existingLot) {
          lotId = existingLot.id;
        } else {
          lotId = (await LotService.createLot(new Lot(undefined, auctionId, parseInt(bpl.LotNumber), bpl.LotName, []))).id;
        }

        if (!lotId) continue;
        const assignmentId = await AssignmentService.createAssignment(new Assignment(undefined, undefined, lot, bidder, false));

        if (assignmentId !== undefined) {
          const lot = await db.lots.get(lotId);
          if (lot && lot.assignments) {
            await db.lots.update(lotId, { assignments: [...lot.assignments, assignmentId] });
          }
        }
      }
    }
  };

  return (
    <div>
      <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} style={{ display: "none" }} id="upload-button-file" />
      <label htmlFor="upload-button-file">
        <Button variant="contained" component="span" sx={{ margin: 1 }}>
          Import Bidder&Lot Data
        </Button>
      </label>
    </div>
  );
}

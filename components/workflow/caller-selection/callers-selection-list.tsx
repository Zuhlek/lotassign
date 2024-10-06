"use client";
import Grid from "@mui/material/Grid";
import { Caller } from "@/lib/models/caller.model";
import { CallerService } from "@/lib/services/caller.service";
import { AuctionService } from "@/lib/services/auction.service";
import { PrioCallerAssignmentService } from "@/lib/services/prioCallerAssignment.service"; // Importiere den Service
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import CallersSearchBarProps from "./callers-searchbar";
import CallerList from "./callers-list";
import ButtonSection from "./button-section";
import { Auction } from "@/lib/models/auction.model";

function not(a: readonly number[], b: readonly number[]) {
  return a.filter((value) => b.indexOf(value) === -1);
}

function intersection(a: readonly number[], b: readonly number[]) {
  return a.filter((value) => b.indexOf(value) !== -1);
}

interface CallersSelectionListProps {
  auction: Auction;
  callers: Caller[];
}

export default function CallersSelectionList({ auction, callers }: CallersSelectionListProps) {
  const [checked, setChecked] = useState<readonly number[]>([]);
  const [left, setLeft] = useState<readonly number[]>([]);
  const [right, setRight] = useState<readonly number[]>([]);
  const [leftFilter, setLeftFilter] = useState<string>("");
  const [rightFilter, setRightFilter] = useState<string>("");

  useEffect(() => {
    setRight(auction.callerIds || []);
    setLeft(
      not(
        callers.map((caller) => caller.id!),
        auction.callerIds || []
      )
    );
  }, [auction, callers]);

  const leftChecked = intersection(checked, left);
  const rightChecked = intersection(checked, right);

  const handleToggle = (value: number) => () => {
    const currentIndex = checked.indexOf(value);
    const newChecked = [...checked];

    if (currentIndex === -1) {
      newChecked.push(value);
    } else {
      newChecked.splice(currentIndex, 1);
    }

    setChecked(newChecked);
  };

  const removePrioAssignmentsForRemovedCallers = async (removedCallerIds: number[]) => {
    for (const callerId of removedCallerIds) {
      const assignments = await PrioCallerAssignmentService.getPrioAssignmentsByCallerIdAndAuctionId(callerId, auction.id!);
      for (const assignment of assignments) {
        await PrioCallerAssignmentService.deletePrioAssignmentByBidderAndAuctionId(assignment.bidderId, auction.id!);
      }
    }
  };

  const handleAllRight = () => {
    setRight(right.concat(left));
    setLeft([]);
    updateAuctionCallers(right.concat(left));
  };

  const handleCheckedRight = () => {
    setRight(right.concat(leftChecked));
    setLeft(not(left, leftChecked));
    setChecked(not(checked, leftChecked));
    updateAuctionCallers(right.concat(leftChecked));
  };

  const handleCheckedLeft = async () => {
    await removePrioAssignmentsForRemovedCallers(rightChecked);
    setLeft(left.concat(rightChecked));
    setRight(not(right, rightChecked));
    setChecked(not(checked, rightChecked));
    updateAuctionCallers(not(right, rightChecked));
  };

  const handleAllLeft = async () => {
    await removePrioAssignmentsForRemovedCallers([...right]);
    setLeft(left.concat(right));
    setRight([]);
    updateAuctionCallers([]);
  };

  const updateAuctionCallers = async (callerIds: number[]) => {
    await AuctionService.updateAuction(auction.id!, { ...auction, callerIds });
  };

  const filteredLeft = left.filter((id) =>
    callers
      .find((caller) => caller.id === id)
      ?.name.toLowerCase()
      .includes(leftFilter.toLowerCase())
  );

  const filteredRight = right.filter((id) =>
    callers
      .find((caller) => caller.id === id)
      ?.name.toLowerCase()
      .includes(rightFilter.toLowerCase())
  );

  return (
    <Grid container justifyContent="center" alignItems="top" sx={{ width: "100%" }}>
      <Grid item xs={5}>
        <CallersSearchBarProps filter={leftFilter} setFilter={setLeftFilter} />
        <CallerList items={filteredLeft} callers={callers} checked={checked} handleToggle={handleToggle} />
      </Grid>
      <Grid item xs={2}>
        <ButtonSection
          handleAllRight={handleAllRight}
          handleCheckedRight={handleCheckedRight}
          handleCheckedLeft={handleCheckedLeft}
          handleAllLeft={handleAllLeft}
          leftChecked={leftChecked}
          rightChecked={rightChecked}
          left={left}
          right={right}
        />
      </Grid>
      <Grid item xs={5}>
        <CallersSearchBarProps filter={rightFilter} setFilter={setRightFilter} />
        <CallerList items={filteredRight} callers={callers} checked={checked} handleToggle={handleToggle} />
      </Grid>
    </Grid>
  );
}

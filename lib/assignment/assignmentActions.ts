"use server";
import { Assignment, Caller } from "@prisma/client";
import {
  AssignmentsWithCallersAndBidders,
  getAuctionCallers,
  getLotsForAuction,
  getPriorityCallerForBidder,
  LotWithAssignmentsWithCallersAndBidders,
  updateAssignment,
} from "./assignmentFunctions";
import prisma from "../db";

export async function removeAllCallerIdsFromAssignments() {
  await prisma.assignment.updateMany({
    data: {
      callerId: null,
      isFinal: false,
    },
  });
}

export async function assignCallersToDesiredBidders(auctionId: string) {
  const lots = await getLotsForAuction(auctionId);

  for (const lot of lots) {
    for (const assignment of lot.assignments) {
      const priorityCaller = await getPriorityCallerForBidder(assignment.bidderId);
      if (priorityCaller) {
        await updateAssignment(true, assignment.id, lot.id, priorityCaller.id, assignment.bidderId);
      }
    }
  }
}

export async function assignCallersToBidders(auctionId: string) {
  const lots = await getLotsForAuction(auctionId);
  const callers = await getAuctionCallers(auctionId);
  let nextAndPrevNLots: LotWithAssignmentsWithCallersAndBidders[] = [];

  for (const l of lots) {
    console.log(`------------- ${l.number} -------------`);
    nextAndPrevNLots = await getNextAndPreviousNLots(l.number, 4);

    for (let a of l.assignments) {
      const b = await prisma.bidder.findUnique({ where: { id: a.bidderId } });
      console.log(`🧍 ${b?.name}`);

      if (!a) {
        continue;
      }
      if (isAssignmentFinal(a) || hasAssignmentAlreadyACaller(a)) {
        continue;
      }

      //TODO -tuat nöd :(
      const alreadyAssignedCaller = await getCallerWhoWasAlreadyAssignedToBidder(a.bidderId);

      if (alreadyAssignedCaller) {
        console.log(`${alreadyAssignedCaller.name}`);
        const isEligible = await isTheCallerEligibleForTheAssignment(alreadyAssignedCaller.id, nextAndPrevNLots, l);
        if (isEligible) {
          a = await assignCallerToBidder(a, alreadyAssignedCaller);
          continue;
        } else {
          console.log(`🚫 (prev caller)`);
        }
      }

      for (const caller of callers) {
        console.log(`${caller.name}`);
        const isEligible = await isTheCallerEligibleForTheAssignment(caller.id, nextAndPrevNLots, l);
        if (isEligible) {
          a = await assignCallerToBidder(a, caller);
          break;
        } else {
          console.log(`🚫`);
        }
      }
    }
  }
}

async function isTheCallerEligibleForTheAssignment(
  callerId: string,
  lastNLots: LotWithAssignmentsWithCallersAndBidders[],
  currentLot: LotWithAssignmentsWithCallersAndBidders
): Promise<boolean> {
  const lotsToCheck = [...lastNLots, currentLot];
  let lotsFromDb: LotWithAssignmentsWithCallersAndBidders[] = [];

  for (const lot of lotsToCheck) {
    const lotFromDb = await prisma.lot.findUnique({ where: { id: lot.id }, include: { assignments: { include: { caller: true, bidder: true } } } });
    if (lotFromDb) {
      lotsFromDb.push(lotFromDb);
    }
  }

  for (const lot of lotsFromDb) {
    for (const assignment of lot.assignments) {
      if (assignment.callerId === callerId) {
        return false;
      }
    }
  }

  return true;
}

async function getCallerWhoWasAlreadyAssignedToBidder(bidderId: string): Promise<Caller | null> {
  return await prisma.caller.findFirst({
    where: {
      assignments: {
        some: {
          bidderId: bidderId,
          isFinal: true,
        },
      },
    },
  });
}

function hasAssignmentAlreadyACaller(assignment: Assignment): boolean {
  return assignment.callerId !== null;
}

function isAssignmentFinal(assignment: Assignment): boolean {
  return assignment.isFinal;
}

async function assignCallerToBidder(relevantAssignment: Assignment, caller: Caller): Promise<AssignmentsWithCallersAndBidders> {
  console.log(`-->> 📞 ${caller.name}`);
  const updatedAssignment = await updateAssignment(false, relevantAssignment.id, relevantAssignment.lotId, caller.id, relevantAssignment.bidderId);
  return updatedAssignment;
}

async function getNextAndPreviousNLots(lotNumber: number, n: number): Promise<LotWithAssignmentsWithCallersAndBidders[]> {
  let lots: LotWithAssignmentsWithCallersAndBidders[] = [];

  for (let i = -n; i <= n; i++) {
    const lot = await prisma.lot.findFirst({
      where: { number: (lotNumber + i) },
      include: { assignments: { include: { caller: true, bidder: true } } },
    });
    if (lot) {
      lots.push(lot);
    }
  }

  return lots;

}
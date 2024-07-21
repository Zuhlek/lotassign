"use server";
import prisma from "@/lib/db";
import { Assignment, Caller, Prisma } from "@prisma/client";

export async function createAssignment(isFinal: boolean, lotId: string, bidderId: string, callerId?: string): Promise<Assignment> {
  return await prisma.assignment.create({
    data: {
      lot: { connect: { id: lotId } },
      bidder: { connect: { id: bidderId } },
      caller: callerId ? { connect: { id: callerId } } : undefined,
      isFinal,
    },
  });
}

export async function updateAssignment(
  isFinal: boolean,
  assignmentId: string,
  lotId?: string,
  callerId?: string,
  bidderId?: string
): Promise<AssignmentsWithCallersAndBidders> {
  return await prisma.assignment.update({
    where: { id: assignmentId },
    data: {
      lot: lotId ? { connect: { id: lotId } } : undefined,
      caller: callerId ? { connect: { id: callerId } } : undefined,
      bidder: bidderId ? { connect: { id: bidderId } } : undefined,
      isFinal: isFinal,
    },
    include: {
      bidder: true,
      caller: true,
    },
  });
}

export async function getLotsForAuction(auctionId: string): Promise<LotWithAssignmentsWithCallersAndBidders[]> {
  return await prisma.lot.findMany({
    where: { auctionId },
    include: {
      assignments: {
        include: {
          bidder: true,
          caller: true,
        },
      },
    },
    orderBy: { number: "asc" },
  });
}

export async function getAssignmentsForAuction(auctionId: string): Promise<Assignment[]> {
  const assignments = await prisma.assignment.findMany({
    where: { lot: { auctionId } },
  });
  return assignments;
}

export type CallerWithDesiredBiddersAndTheirInterestedLots = Prisma.CallerGetPayload<{
  include: {
    desiredBidders: true;
  };
}>;

export type AssignmentsWithCallersAndBidders = Prisma.AssignmentGetPayload<{
  include: {
    bidder: true;
    caller: true;
  };
}>;

export type LotWithAssignmentsWithCallersAndBidders = Prisma.LotGetPayload<{
  include: {
    assignments: {
      include: {
        bidder: true;
        caller: true;
      };
    };
  };
}>;

export async function getAuctionCallers(auctionId: string): Promise<Caller[]> {
  const auction = await prisma.auction.findUnique({
    where: { id: auctionId },
    include: {
      callers: true,
    },
  });

  if (!auction) {
    return [];
  }

  const callers = auction.callers.map((ac) => ac);

  return callers;
}

export async function getPriorityCallerForBidder(bidderId: string): Promise<Caller | null> {
  return await prisma.caller.findFirst({
    where: { desiredBidders: { some: { id: bidderId } } },
  });
}

export interface Conflict {
  bidderId: string;
  callers: CallerWithDesiredBiddersAndTheirInterestedLots[];
}

export async function getCallersWithSameDesiredBidders(callers: CallerWithDesiredBiddersAndTheirInterestedLots[]): Promise<Conflict[]> {
  const conflictMap: Map<string, CallerWithDesiredBiddersAndTheirInterestedLots[]> = new Map();

  for (const caller of callers) {
    for (const bidder of caller.desiredBidders) {
      if (conflictMap.has(bidder.id)) {
        conflictMap.get(bidder.id)!.push(caller);
      } else {
        conflictMap.set(bidder.id, [caller]);
      }
    }
  }

  const conflicts: Conflict[] = [];
  conflictMap.forEach((conflictingCallers, bidderId) => {
    if (conflictingCallers.length > 1) {
      conflicts.push({ bidderId, callers: conflictingCallers });
    }
  });

  return conflicts;
}

export async function deleteAllAssignments() {
  return await prisma.assignment.deleteMany();
}

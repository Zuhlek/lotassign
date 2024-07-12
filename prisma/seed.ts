const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

function getRandomInt(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomElement(arr: any[]) {
  return arr[getRandomInt(0, arr.length - 1)];
}

function createRandomName() {
  const firstNames = ['John', 'Jane', 'Max', 'Anna', 'Leo', 'Ella', 'Liam', 'Mia', 'Noah', 'Emma'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Jones', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor'];
  return `${getRandomElement(firstNames)} ${getRandomElement(lastNames)}`;
}

async function main() {
  // Create a user
  await prisma.user.create({
    data: {
      email: 'user@email.com',
      password: await bcrypt.hash('password', 10),
      role: 'USER',
    },
  });

  // Create 5 callers
  const callers = [];
  for (let i = 0; i < 5; i++) {
    const caller = await prisma.caller.create({
      data: {
        name: createRandomName(),
        abbreviation: `C${i + 1}`,
        languages: ['DE', 'EN'],
      },
    });
    callers.push(caller);
  }

  // Create 20 bidders
  const bidders = [];
  for (let i = 0; i < 20; i++) {
    const bidder = await prisma.bidder.create({
      data: {
        name: createRandomName(),
        languages: ['DE', 'EN'],
        phoneNumber: `+41791${i}2${i}`,
      },
    });
    bidders.push(bidder);
  }

  // Create 100 lots
  const auction = await prisma.auction.create({
    data: {
      name: 'Test Auction',
      date: new Date(),
      callers: {
        create: callers.map(caller => ({
          caller: {
            connect: { id: caller.id },
          },
        })),
      },
      lots: {
        create: Array.from({ length: 100 }).map((_, i) => ({
          lotNumber: i + 1,
        })),
      },
    },
    include: {
      lots: true,
    },
  });

  const lots = auction.lots;

  // Assign priority bidders to callers
  for (const caller of callers) {
    const priorityBidder = getRandomElement(bidders);
    await prisma.caller.update({
      where: { id: caller.id },
      data: {
        desiredCustomers: {
          connect: { id: priorityBidder.id },
        },
      },
    });
  }

  // Assign lots to bidders
  for (const bidder of bidders) {
    const numberOfLots = getRandomInt(0, 4);
    for (let i = 0; i < numberOfLots; i++) {
      const lot = getRandomElement(lots);
      await prisma.lotBidder.create({
        data: {
          lot: { connect: { id: lot.id } },
          bidder: { connect: { id: bidder.id } },
        },
      });
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

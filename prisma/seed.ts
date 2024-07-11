const { PrismaClient, ProtocolPointType, ProtocolRole } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function main() {

  const user = await prisma.user.create({
    data: {
      email: 'user@email.com',
      password: await bcrypt.hash('password', 10),
      role: 'USER',
    },
  });

}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

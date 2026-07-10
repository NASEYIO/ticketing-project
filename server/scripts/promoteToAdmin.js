const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.error('Usage: node scripts/promoteToAdmin.js <email>');
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    console.error(`No user found with email: ${email}`);
    process.exit(1);
  }

  const updated = await prisma.user.update({
    where: { email },
    data: { role: 'ADMIN' },
  });

  console.log(`✅ ${updated.name} (${updated.email}) is now ADMIN`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
// FILE: seed-categories.js
// One-off script to populate the Category table with starter categories.

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const categories = [
  'Concerts',
  'Sports',
  'Conferences',
  'Parties',
];

async function main() {
  for (const name of categories) {
    const category = await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    console.log(`✅ Category ready: ${category.name} (id: ${category.id})`);
  }
}

main()
  .catch((err) => {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
  
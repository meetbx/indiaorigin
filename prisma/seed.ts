import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1. Upsert Main Category using its unique ID in the `where` clause
  const mainCategory = await prisma.category.upsert({
    where: { id: 'cmuco0tnv0002ts1kwdbl1bw3' },
    update: {
      name: 'Industrial Machinery & Equipment',
      slug: 'industrial-machinery-equipment',
    },
    create: {
      id: 'cmuco0tnv0002ts1kwdbl1bw3',
      name: 'Industrial Machinery & Equipment',
      slug: 'industrial-machinery-equipment',
    },
  });

  // 2. Upsert Subcategory: Material Handling & Conveyor Systems
  const subCategory = await prisma.category.upsert({
    where: { slug: 'material-handling-conveyor-systems' },
    update: {
      name: 'Material Handling & Conveyor Systems',
      parentId: mainCategory.id,
    },
    create: {
      name: 'Material Handling & Conveyor Systems',
      slug: 'material-handling-conveyor-systems',
      parentId: mainCategory.id,
    },
  });

  // 3. Upsert Child Category: Belt Conveyors & Systems
  await prisma.category.upsert({
    where: { slug: 'belt-conveyors-systems' },
    update: {
      name: 'Belt Conveyors & Systems',
      parentId: subCategory.id,
    },
    create: {
      name: 'Belt Conveyors & Systems',
      slug: 'belt-conveyors-systems',
      parentId: subCategory.id,
    },
  });

  console.log('Industrial Machinery categories seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding categories:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
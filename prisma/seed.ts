import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1. Upsert Main Category using its unique ID
  const mainCategory = await prisma.category.upsert({
    where: { id: 'cmv6vcmay001atsxsmne4fhp5' },
    update: {
      name: 'Sports Goods, Games, Toys & Accessories',
      slug: 'sports-goods-games-toys-accessories',
    },
    create: {
      id: 'cmv6vcmay001atsxsmne4fhp5',
      name: 'Sports Goods, Games, Toys & Accessories',
      slug: 'sports-goods-games-toys-accessories',
    },
  });

  // 2. Upsert Subcategory: Outdoor Play & Sports Toys
  const subCategory = await prisma.category.upsert({
    where: { slug: 'indoor-play-toys' },
    update: {
      name: 'indoor Play & Toys',
      parentId: mainCategory.id,
    },
    create: {
      name: 'indoor Play & Toys',
      slug: 'indoor-play-toys',
      parentId: mainCategory.id,
    },
  });

  // 3. Upsert Child Category: Toy Guns & Blasters
  await prisma.category.upsert({
    where: { slug: 'toy-guns-blasters' },
    update: {
      name: 'Toy Guns & Blasters',
      parentId: subCategory.id,
    },
    create: {
      name: 'Toy Guns & Blasters',
      slug: 'toy-guns-blasters',
      parentId: subCategory.id,
    },
  });

  console.log('Meteor Gun categories seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding categories:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
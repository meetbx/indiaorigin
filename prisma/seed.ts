import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function seedElectronicComponents() {
  const categoryId = "10000000-0000-0000-0000-000000000004";
  const categoryName = "Electronic Components";
  const parentSlug = slugify(categoryName);
  
  const items = [
    "Switches",
    "LEDs",
    "Power Supplies",
    "Terminals",
    "Resistors",
    "Rectifiers",
    "Sensors",
    "Motion Sensors",
    "Bluetooth Modules",
    "LoRa Modules",
    "Repeaters",
    "Microcontrollers",
    "Semiconductors",
    "LED Diodes",
    "Pogo Pins",
  ];

  console.log(`Seeding ${categoryName} with ID ${categoryId}...`);

  // 1. Upsert Parent Category with the specific UUID
  const parentCategory = await prisma.categories.upsert({
    where: { slug: parentSlug },
    update: {
      name: categoryName,
      is_active: true,
    },
    create: {
      id: categoryId,
      name: categoryName,
      slug: parentSlug,
      sort_order: 32,
      is_active: true,
    },
  });

  // 2. Clear old recommendations for this category to prevent duplicate key errors
  await prisma.category_recommendations.deleteMany({
    where: { category_id: parentCategory.id },
  });

  // 3. Insert Recommendations
  let sortOrder = 1;
  for (const itemName of items) {
    const targetSlug = `${parentSlug}-${slugify(itemName)}`;

    await prisma.category_recommendations.create({
      data: {
        category_id: parentCategory.id,
        name: itemName,
        target_slug: targetSlug,
        image_url: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=200&auto=format&fit=crop&q=80",
        sort_order: sortOrder,
        is_active: true,
      },
    });

    sortOrder++;
  }

  console.log("Electronic Components seeded successfully with the requested UUID!");
}

seedElectronicComponents()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
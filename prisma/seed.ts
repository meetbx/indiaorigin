import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding subcategories...");

  // 1. Find an existing parent category (e.g., matching your Computers/Software category)
  const parentCategory = await prisma.category.findFirst({
    where: {
      name: {
        contains: "Computers",
        mode: "insensitive",
      },
      parentId: null, // Ensure it's a root category
    },
  });

  if (!parentCategory) {
    console.log("Parent category 'Computers...' not found. Please create a root category first.");
    return;
  }

  console.log(`Found parent category: ${parentCategory.name} (${parentCategory.id})`);

  // 2. Create subcategories linked to this parent
  const subcategories = [
    { name: "Software Development", slug: "software-development", parentId: parentCategory.id },
    { name: "IT Infrastructure & Support", slug: "it-infrastructure-support", parentId: parentCategory.id },
    { name: "Cloud & DevOps Services", slug: "cloud-devops-services", parentId: parentCategory.id },
  ];

  for (const sub of subcategories) {
    const existing = await prisma.category.findFirst({
      where: { slug: sub.slug },
    });

    if (!existing) {
      const created = await prisma.category.create({
        data: sub,
      });
      console.log(`Created subcategory: ${created.name}`);

      // Optional: Add a 3rd-level subcategory (child of subcategory) to test deep nesting
      if (sub.slug === "software-development") {
        await prisma.category.create({
          data: {
            name: "Full-Stack Web Apps",
            slug: "full-stack-web-apps",
            parentId: created.id,
          },
        });
        console.log(`Created nested subcategory: Full-Stack Web Apps`);
      }
    } else {
      console.log(`Subcategory already exists: ${sub.name}`);
    }
  }

  console.log("Subcategory seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
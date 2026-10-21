"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function submitProductReport(productId: string, reason: string, description?: string) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    throw new Error("UNAUTHENTICATED");
  }

  const sessionUser = session.user as { id?: string };
  if (!sessionUser.id) {
    throw new Error("UNAUTHENTICATED");
  }

  if (!reason || reason.trim().length === 0) {
    throw new Error("Please select a reason for reporting this product.");
  }

  const report = await prisma.report.create({
    data: {
      reporterId: sessionUser.id,
      entityType: "PRODUCT",
      entityId: productId,
      reason,
      description: description?.trim() || null,
      status: "OPEN",
    },
  });

  return { success: true, reportId: report.id };
}
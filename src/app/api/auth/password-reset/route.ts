import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizePhone, isValidIndianPhone } from "@/lib/phone";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid JSON body format." }, { status: 400 });
    }

    const { phone, newPassword, confirmPassword, otp } = body;

    if (!isValidIndianPhone(phone)) {
      return NextResponse.json({ error: "Please provide a valid 10-digit Indian mobile number." }, { status: 400 });
    }

    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 6) {
      return NextResponse.json({ error: "New password must be at least 6 characters long." }, { status: 400 });
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });
    }

    if (!otp || typeof otp !== "string") {
      return NextResponse.json({ error: "OTP verification code is required." }, { status: 400 });
    }

    const cleanPhone = normalizePhone(phone);

    const user = await prisma.user.findUnique({
      where: { phone: cleanPhone },
    });

    if (!user) {
      // Account enumeration defense: return success message even if user doesn't exist
      return NextResponse.json({ success: true, message: "If registered, password has been reset successfully." });
    }

    // Execute atomic transaction: Verify/consume challenge and update password
    await prisma.$transaction(async (tx) => {
      const challenge = await tx.otpChallenge.findFirst({
        where: {
          phone: cleanPhone,
          purpose: "PASSWORD_RESET",
          verifiedAt: { not: null },
          consumedAt: null,
          expiresAt: { gte: new Date() },
        },
        orderBy: { createdAt: "desc" },
      });

      if (!challenge) {
        throw new Error("No verified password-reset session found. Please verify your OTP first.");
      }

      const consumed = await tx.otpChallenge.updateMany({
        where: {
          id: challenge.id,
          consumedAt: null,
          verifiedAt: { not: null },
        },
        data: {
          consumedAt: new Date(),
        },
      });

      if (consumed.count === 0) {
        throw new Error("Password reset session conflict. Please retry verification.");
      }

      const passwordHash = await bcrypt.hash(newPassword, 10);

      // Update password and bump updatedAt timestamp to invalidate existing JWT sessions
      await tx.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          updatedAt: new Date(), // Triggers session revocation check in JWT callback
        },
      });
    });

    return NextResponse.json({ success: true, message: "Password reset successfully. Please log in." });
  } catch (err: any) {
    console.error("[PASSWORD_RESET_ERROR]", err);
    return NextResponse.json({ error: err.message || "An error occurred during password reset." }, { status: 400 });
  }
}
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizePhone, isValidIndianPhone } from "@/lib/phone";
import { sendMsg91Otp, verifyMsg91OtpToken, MSG91Error } from "@/lib/msg91"; // <-- Updated import name
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  try {
    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > 1024) {
      return NextResponse.json({ error: "Payload too large." }, { status: 413 });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid JSON body format." }, { status: 400 });
    }

    const { action, phone, purpose, otp } = body;

    if (typeof action !== "string" || !["send", "verify"].includes(action)) {
      return NextResponse.json({ error: "Invalid or missing action." }, { status: 400 });
    }

    if (typeof purpose !== "string" || !["SIGNUP", "LOGIN", "PASSWORD_RESET"].includes(purpose)) {
      return NextResponse.json({ error: "Invalid or missing purpose." }, { status: 400 });
    }

    if (!isValidIndianPhone(phone)) {
      return NextResponse.json({ error: "Please provide a valid 10-digit Indian mobile number." }, { status: 400 });
    }

    const cleanPhone = normalizePhone(phone);
    const now = new Date();

    const rollingWindowStart = new Date(now.getTime() - 15 * 60 * 1000);
    const globalRequestCount = await prisma.otpChallenge.count({
      where: {
        createdAt: { gte: rollingWindowStart },
      },
    });

    if (globalRequestCount > 200) {
      return NextResponse.json({ error: "Service temporarily busy. Please try again later." }, { status: 429 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { phone: cleanPhone },
    });

    if (action === "send") {
      if (purpose === "SIGNUP" && existingUser) {
        return NextResponse.json({ error: "An account with this phone number already exists. Please log in." }, { status: 400 });
      }
// AFTER:
if ((purpose === "LOGIN" || purpose === "PASSWORD_RESET") && !existingUser) {
  return NextResponse.json(
    { error: "No account found with this mobile number. Please sign up." },
    { status: 400 }
  );
}

      await sendMsg91Otp(cleanPhone);

      await prisma.otpChallenge.updateMany({
        where: {
          phone: cleanPhone,
          purpose,
          consumedAt: null,
          verifiedAt: null,
        },
        data: {
          expiresAt: now,
        },
      });

      const expiresAt = new Date(now.getTime() + 10 * 60 * 1000);
      
      await prisma.otpChallenge.create({
        data: {
          id: randomUUID(),
          phone: cleanPhone,
          purpose,
          expiresAt,
        },
      });

      return NextResponse.json({ success: true, message: "OTP session initialized." });
    }

    if (action === "verify") {
      // Here 'otp' is actually the widget access-token passed from the frontend client
      if (typeof otp !== "string" || !otp.trim()) {
        return NextResponse.json({ error: "Verification token is required." }, { status: 400 });
      }

      const challenge = await prisma.otpChallenge.findFirst({
        where: {
          phone: cleanPhone,
          purpose,
          consumedAt: null,
          verifiedAt: null,
          expiresAt: { gte: now },
          attempts: { lt: 5 },
        },
        orderBy: { createdAt: "desc" },
      });

      if (!challenge) {
        return NextResponse.json({ error: "No active verification session found or session expired. Please retry." }, { status: 400 });
      }

      const reserved = await prisma.otpChallenge.updateMany({
        where: {
          id: challenge.id,
          attempts: { lt: 5 },
          verifiedAt: null,
          consumedAt: null,
          expiresAt: { gte: now },
        },
        data: {
          attempts: { increment: 1 },
        },
      });

      if (reserved.count === 0) {
        return NextResponse.json({ error: "Maximum verification attempts exceeded or session expired." }, { status: 429 });
      }

      try {
        // Call MSG91 widget verifyAccessToken API endpoint
        await verifyMsg91OtpToken(otp.trim());
      } catch (err: any) {
        const statusCode = err instanceof MSG91Error ? err.status : 400;
        return NextResponse.json({ error: err.message || "Invalid verification token." }, { status: statusCode });
      }

      const verifiedUpdate = await prisma.otpChallenge.updateMany({
        where: {
          id: challenge.id,
          verifiedAt: null,
          consumedAt: null,
          expiresAt: { gte: now },
        },
        data: {
          verifiedAt: now,
        },
      });

      if (verifiedUpdate.count === 0) {
        return NextResponse.json({ error: "Verification conflict. Please retry." }, { status: 400 });
      }

      return NextResponse.json({ success: true, message: "OTP verified successfully." });
    }

    return NextResponse.json({ error: "Invalid action specified." }, { status: 400 });
  } catch (err: any) {
    console.error("[OTP_ROUTE_CRITICAL_ERROR]", err);
    return NextResponse.json({ error: "An unexpected error occurred. Please try again." }, { status: 500 });
  }
}
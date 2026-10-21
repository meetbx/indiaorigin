import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { normalizePhone, isValidIndianPhone } from "@/lib/phone";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/account",
    error: "/account",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      allowDangerousEmailAccountLinking: false, // Security: Prevent unsafe account merging
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        phone: { label: "Phone", type: "text" },
        password: { label: "Password", type: "password" },
        otp: { label: "OTP", type: "text" },
        loginType: { label: "Login Type", type: "text" }, // "password" or "otp"
      },
      async authorize(credentials) {
        if (!credentials?.phone || !isValidIndianPhone(credentials.phone)) {
          throw new Error("Please provide a valid 10-digit Indian mobile number.");
        }

        const cleanPhone = normalizePhone(credentials.phone);
        const loginType = credentials.loginType || "password";

        // 1. Passwordless OTP Login Flow
        if (loginType === "otp") {
          const otpCode = credentials.otp;
          if (!otpCode) {
            throw new Error("Verification code is required for passwordless login.");
          }

          // Find user by phone
          const user = await prisma.user.findUnique({
            where: { phone: cleanPhone },
          });

          if (!user) {
            throw new Error("No account found with this phone number. Please sign up.");
          }

          // Verify active LOGIN challenge that was successfully verified via MSG91
          const challenge = await prisma.otpChallenge.findFirst({
            where: {
              phone: cleanPhone,
              purpose: "LOGIN",
              verifiedAt: { not: null },
              consumedAt: null,
              expiresAt: { gte: new Date() },
            },
            orderBy: { createdAt: "desc" },
          });

          if (!challenge) {
            throw new Error("No valid verified login session found. Please verify your OTP.");
          }

          // Atomically consume challenge
          const consumed = await prisma.otpChallenge.updateMany({
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
            throw new Error("Login session conflict. Please retry.");
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            role: user.role,
            phone: user.phone,
          };
        }

        // 2. Phone + Password Login Flow
        if (!credentials.password) {
          throw new Error("Password is required.");
        }

        const user = await prisma.user.findUnique({
          where: { phone: cleanPhone },
        });

        if (!user || !user.passwordHash) {
          throw new Error("Invalid phone number or password.");
        }

        const isValidPassword = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValidPassword) {
          throw new Error("Invalid phone number or password.");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          phone: user.phone,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || "BUYER";
        token.phone = (user as any).phone;
      }

      // Check if user record was updated (e.g., password reset / role change / session revocation)
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { updatedAt: true, role: true },
        });

        if (dbUser) {
          token.role = dbUser.role;
          // Session revocation check: if token issued before last password reset/update, invalidate
          if (token.updatedAt && new Date(token.updatedAt as string) < dbUser.updatedAt) {
            return null; // Forces re-authentication
          }
          token.updatedAt = dbUser.updatedAt.toISOString();
        }
      }

      if (trigger === "update" && session) {
        token.role = session.role || token.role;
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.phone = token.phone as string | null;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
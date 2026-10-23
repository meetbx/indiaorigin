import { toInternationalPhone } from "./phone";

const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY;

export class MSG91Error extends Error {
  constructor(message: string, public status: number = 400) {
    super(message);
    this.name = "MSG91Error";
  }
}

/**
 * Note: When using the MSG91 OTP Widget, SMS dispatch is handled 
 * automatically on the frontend via widget provider script.
 * We return success immediately so the frontend widget can open.
 */
export async function sendMsg91Otp(phone: string): Promise<void> {
  if (!MSG91_AUTH_KEY) {
    throw new MSG91Error("SMS provider configuration is incomplete.", 500);
  }
  // Widget handles dispatch directly on the client side using widgetId.
  // We validate phone format here.
  toInternationalPhone(phone);
}

/**
 * Verifies the access-token received from the MSG91 OTP Widget on the frontend.
 */
export async function verifyMsg91OtpToken(accessToken: string): Promise<void> {
  if (!MSG91_AUTH_KEY) {
    throw new MSG91Error("SMS provider configuration is incomplete.", 500);
  }

  const url = "https://control.msg91.com/api/v5/widget/verifyAccessToken";
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        authkey: MSG91_AUTH_KEY,
        "access-token": accessToken,
      }),
      signal: controller.signal,
    });

    const data = await response.json().catch(() => ({}));
    clearTimeout(timeoutId);

    console.log("[MSG91_WIDGET_VERIFY_RESPONSE]", { status: response.status, data });

    // MSG91 Widget verification success structure
    if (!response.ok || (data.type && data.type !== "success") && data.status !== "success") {
      const msg = typeof data?.message === "string" ? data.message : "Invalid verification code or token.";
      throw new MSG91Error(msg, 400);
    }
  } catch (err: any) {
    clearTimeout(timeoutId);
    console.error("[MSG91_WIDGET_VERIFY_ERROR]", err);
    if (err.name === "AbortError") {
      throw new MSG91Error("Verification gateway timed out. Please try again.", 504);
    }
    if (err instanceof MSG91Error) throw err;
    throw new MSG91Error(err.message || "Failed to communicate with verification provider.", 500);
  }
}
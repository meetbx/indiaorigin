"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { EyeIcon, EyeSlashIcon, UserCircleIcon } from "@heroicons/react/24/outline";

type AuthMode = "login" | "signup" | "passwordless" | "forgot_password";
type Step = "input" | "otp_verify";

export default function AuthForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackUrl = searchParams.get("callbackUrl") || "/account";

  const [mode, setMode] = useState<AuthMode>("login");
  const [step, setStep] = useState<Step>("input");

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Initialize MSG91 Widget script when transitioning to "otp_verify" step
  useEffect(() => {
    if (step !== "otp_verify") return;

    const formattedPhone = phone.startsWith("91") ? phone : `91${phone.replace(/^0+/, "")}`;

    (window as any).configuration = {
      widgetId: "366a6f6d415a343132333538",
      tokenAuth: "581809TWuV0EvxDMl6ad11e3dP1",
      identifier: formattedPhone,
      success: async (data: any) => {
        console.log("MSG91 Widget success response:", data);
        const widgetToken = data?.token || data?.message;
        if (widgetToken) {
          await handleWidgetVerificationSuccess(widgetToken);
        } else {
          setError("Verification token missing from widget response.");
          setLoading(false);
        }
      },
      failure: (error: any) => {
        console.error("MSG91 Widget failure:", error);
        setError(error?.message || "OTP verification failed or was cancelled.");
        setLoading(false);
      },
    };

    const urls = [
      "https://verify.msg91.com/otp-provider.js",
      "https://verify.phone91.com/otp-provider.js",
    ];

    let i = 0;
    function attempt() {
      const s = document.createElement("script");
      s.src = urls[i];
      s.async = true;
      s.onload = () => {
        if (typeof (window as any).initSendOTP === "function") {
          (window as any).initSendOTP((window as any).configuration);
        }
      };
      s.onerror = () => {
        i++;
        if (i < urls.length) {
          attempt();
        }
      };
      document.head.appendChild(s);
    }
    attempt();
  }, [step, phone]);

  const handleGoogleAuth = () => {
    signIn("google", { callbackUrl });
  };

  // Step 1: Validate passwords & check database before requesting OTP widget
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    // Validate password match upfront for signup and password reset
    if ((mode === "signup" || mode === "forgot_password") && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    let purpose = "SIGNUP";
    if (mode === "passwordless") purpose = "LOGIN";
    if (mode === "forgot_password") purpose = "PASSWORD_RESET";

    try {
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send", phone, purpose }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Displays database errors (e.g., phone already exists for signup)
        setError(data.error || "Failed to initialize verification session.");
        setLoading(false);
        return;
      }

      setStep("otp_verify");
    } catch (err) {
      setError("A connection error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Called after successful widget verification
  const handleWidgetVerificationSuccess = async (widgetAccessToken: string) => {
    setLoading(true);
    let purpose = "SIGNUP";
    if (mode === "passwordless") purpose = "LOGIN";
    if (mode === "forgot_password") purpose = "PASSWORD_RESET";

    try {
      const verifyRes = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", phone, purpose, otp: widgetAccessToken }),
      });

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok) {
        setError(verifyData.error || "Token verification failed on server.");
        setLoading(false);
        return;
      }

      if (mode === "signup") {
        const signupRes = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone, password, confirmPassword, name, otp: widgetAccessToken }),
        });

        const signupData = await signupRes.json();
        if (!signupRes.ok) {
          setError(signupData.error || "Account creation failed.");
          setLoading(false);
          return;
        }

        const signInRes = await signIn("credentials", {
          phone,
          password,
          loginType: "password",
          redirect: false,
        });

        if (signInRes?.error) {
          setError("Account created, but automatic login failed. Please log in.");
          setMode("login");
          setStep("input");
        } else {
          router.push(callbackUrl);
          router.refresh();
        }
      } else if (mode === "passwordless") {
        const signInRes = await signIn("credentials", {
          phone,
          otp: widgetAccessToken,
          loginType: "otp",
          redirect: false,
        });

        if (signInRes?.error) {
          setError(signInRes.error || "Passwordless login failed.");
        } else {
          router.push(callbackUrl);
          router.refresh();
        }
      } else if (mode === "forgot_password") {
        const resetRes = await fetch("/api/auth/password-reset", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone, newPassword: password, confirmPassword, otp: widgetAccessToken }),
        });

        const resetData = await resetRes.json();
        if (!resetRes.ok) {
          setError(resetData.error || "Password reset failed.");
          setLoading(false);
          return;
        }

        setSuccessMsg("Password reset successfully! Please log in.");
        setMode("login");
        setStep("input");
      }
    } catch (err) {
      setError("An unexpected error occurred during verification processing.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        phone,
        password,
        loginType: "password",
        redirect: false,
      });

      if (res?.error) {
        setError("Invalid phone number or password.");
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err) {
      setError("A connection error occurred during login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md border border-gray-100 p-6 sm:p-8">
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-orange-100 text-[#FF6B00]">
            <UserCircleIcon className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            {mode === "login" && "Log in to IndiaOrigin"}
            {mode === "signup" && "Create your account"}
            {mode === "passwordless" && "Passwordless OTP Login"}
            {mode === "forgot_password" && "Reset Password"}
          </h1>
          <p className="text-sm text-gray-500">
            Secure access to your sourcing, orders, and profile.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs font-medium">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-xs font-medium">
            {successMsg}
          </div>
        )}

        {/* LOG IN VIEW */}
        {mode === "login" && (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Mobile Number
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-sm font-semibold text-gray-500 select-none">
                  🇮🇳 +91
                </span>
                <input
                  type="tel"
                  required
                  placeholder="98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-16 pr-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6B00] transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => { setMode("forgot_password"); setStep("input"); setError(null); setSuccessMsg(null); }}
                  className="text-xs text-[#FF6B00] hover:underline font-medium"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-3.5 pr-10 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6B00] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FF6B00] hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition-all shadow-md shadow-orange-500/20 disabled:opacity-60 flex items-center justify-center text-sm mt-2"
            >
              {loading ? "Logging in..." : "Log In"}
            </button>
          </form>
        )}

        {/* WIDGET OTP FLOWS */}
        {(mode === "signup" || mode === "passwordless" || mode === "forgot_password") && (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            {step === "input" ? (
              <>
                {mode === "signup" && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6B00] transition-all"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Mobile Number
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-sm font-semibold text-gray-500 select-none">
                      🇮🇳 +91
                    </span>
                    <input
                      type="tel"
                      required
                      placeholder="98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-16 pr-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6B00] transition-all"
                    />
                  </div>
                </div>

                {(mode === "signup" || mode === "forgot_password") && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                        {mode === "signup" ? "Create Password" : "New Password"}
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6B00] transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6B00] transition-all"
                      />
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#FF6B00] hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition-all shadow-md shadow-orange-500/20 disabled:opacity-60 flex items-center justify-center text-sm mt-2"
                >
                  {loading ? "Checking details..." : "Verify with OTP Widget"}
                </button>
              </>
            ) : (
              <div className="space-y-4 text-center">
                <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
                  <p className="text-xs text-orange-900 font-medium mb-1">
                    Complete verification for <span className="font-bold">+91 {phone}</span> in the popup window.
                  </p>
                  <button
                    type="button"
                    onClick={() => setStep("input")}
                    className="text-xs text-[#FF6B00] underline font-semibold"
                  >
                    Change Number
                  </button>
                </div>

                <div className="py-4 flex flex-col items-center justify-center space-y-2">
                  <div className="w-6 h-6 border-2 border-[#FF6B00] border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs text-gray-500">
                    {loading ? "Verifying token with server..." : "Waiting for OTP widget verification..."}
                  </p>
                </div>
              </div>
            )}
          </form>
        )}

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-3 text-gray-400 font-medium">or</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogleAuth}
          className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2.5 rounded-xl transition-all flex items-center justify-center gap-3 text-sm shadow-sm"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          Continue with Google
        </button>

        <div className="mt-6 space-y-2 text-center text-sm text-gray-600">
          {mode === "login" && (
            <>
              <p>
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => { setMode("signup"); setStep("input"); setError(null); setSuccessMsg(null); }}
                  className="text-[#FF6B00] font-semibold hover:underline"
                >
                  Sign up
                </button>
              </p>
              <p>
                <button
                  type="button"
                  onClick={() => { setMode("passwordless"); setStep("input"); setError(null); setSuccessMsg(null); }}
                  className="text-xs text-gray-500 hover:text-[#FF6B00] font-medium"
                >
                  ⚡ Log in with Phone OTP Widget
                </button>
              </p>
            </>
          )}

          {(mode === "signup" || mode === "passwordless" || mode === "forgot_password") && (
            <p>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => { setMode("login"); setStep("input"); setError(null); setSuccessMsg(null); }}
                className="text-[#FF6B00] font-semibold hover:underline"
              >
                Log in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
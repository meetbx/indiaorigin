"use client";
import { useSession, signIn } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export function useAuthAction() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const actionToExecute = useRef<(() => void) | null>(null);

  // Restore action on successful login return
  useEffect(() => {
    if (status === "authenticated") {
      const pendingAction = sessionStorage.getItem("pending_auth_action");
      if (pendingAction) {
        const { actionData } = JSON.parse(pendingAction);
        // Fire custom event to notify components (e.g., chat modal) to open with actionData
        window.dispatchEvent(new CustomEvent("restore_action", { detail: actionData }));
        sessionStorage.removeItem("pending_auth_action");
      }
    }
  }, [status]);

  const executeProtectedAction = (actionData: any, immediateAction: () => void) => {
    if (status === "authenticated") {
      immediateAction();
    } else {
      // Not logged in: Save context and trigger Google OAuth
      sessionStorage.setItem(
        "pending_auth_action", 
        JSON.stringify({ path: pathname, actionData })
      );
      // Callback URL ensures they return exactly to the product page they were on
      signIn("google", { callbackUrl: pathname });
    }
  };

  return { executeProtectedAction, isAuthenticated: status === "authenticated" };
}
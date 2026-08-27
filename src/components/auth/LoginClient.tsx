/**
 * Aurora — src/components/auth/LoginClient.tsx
 *
 * Client component that orchestrates the login flow. Manages form state, handles
 * email/password sign-in, redirects upon success, and delegates rendering to LoginForm.
 */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import { LoginForm } from "./LoginForm";

/**
 * Validates and sanitizes the ?redirect= query parameter.
 * Only allows relative paths (starting with /) that do not contain
 * protocol markers or authority prefixes — prevents open redirect attacks.
 */
function sanitizeRedirect(raw: string | null): string {
  if (!raw) return "/profile";
  const trimmed = raw.trim();
  // Must start with exactly one `/` and not `//` (protocol-relative URL)
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return "/profile";
  // Block any embedded protocol schemes (e.g., /login?redirect=javascript:...)
  if (/^[a-z]+:/i.test(trimmed)) return "/profile";
  return trimmed;
}

/** Client-side login orchestrator with form state, validation, and auth-store integration. */
export function LoginClient() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [successMsg, setSuccessMsg] = useState(() => {
    if (typeof window === "undefined") return "";
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const status = params.get("status");
    if (token && status === "success") {
      window.history.replaceState({}, document.title, window.location.pathname);
      return "Your email has been verified successfully! Please log in.";
    }
    return "";
  });
  const [resetLoading, setResetLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    user,
    loading,
    error: storeError,
    clearError,
    sendResetPasswordEmail,
    signIn,
  } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    clearError();
  }, [clearError]);

  useEffect(() => {
    if (user && !loading) {
      const params = new URLSearchParams(window.location.search);
      const redirectTarget = sanitizeRedirect(params.get("redirect"));
      router.push(redirectTarget);
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSuccessMsg("");

    if (!email || !password) {
      setFormError("Please fill in all fields.");
      return;
    }

    setSubmitting(true);
    try {
      const { error, needsVerification: reqVerification } = await signIn(email, password);
      if (error) {
        if (reqVerification) {
          router.push(`/verify?email=${encodeURIComponent(email)}`);
        } else {
          const errorMsg = typeof error === "string" ? error : error.message || "Invalid email or password.";
          setFormError(errorMsg);
        }
      } else {
        setSuccessMsg("Signed in successfully! Redirecting...");
        const params = new URLSearchParams(window.location.search);
        const redirectTarget = sanitizeRedirect(params.get("redirect"));
        router.refresh();
        router.push(redirectTarget);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetClick = async () => {
    if (!email) {
      setFormError("Please enter your email address first.");
      return;
    }
    setResetLoading(true);
    setFormError("");
    setSuccessMsg("");
    try {
      const { error } = await sendResetPasswordEmail(email);
      if (error) {
        const msg = typeof error === "string" ? error : error.message || "Failed to send reset email.";
        setFormError(msg);
      } else {
        setSuccessMsg("If an account exists with this email, a password reset link has been sent. Check your inbox.");
      }
    } catch {
      setFormError("Failed to initiate password reset.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <LoginForm
      email={email}
      setEmail={setEmail}
      password={password}
      setPassword={setPassword}
      formError={formError || storeError || ""}
      successMsg={successMsg}
      onSubmit={handleSubmit}
      onResetClick={handleResetClick}
      resetLoading={resetLoading}
      submitting={submitting}
    />
  );
}

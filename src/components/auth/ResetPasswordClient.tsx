/**
 * Aurora — src/components/auth/ResetPasswordClient.tsx
 *
 * Client component that handles the password-reset flow. Reads the email and
 * reset token from query params, collects a new password, and calls the auth
 * store to update credentials.
 */
"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import { ResetPasswordForm } from "./ResetPasswordForm";
import { AuthSkeleton } from "./AuthSkeleton";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [successMsg, setSuccessMsg] = useState(() => token ? "Reset link verified! Enter your new password below." : "");

  const { resetPassword, loading, error: storeError, clearError } = useAuthStore();

  useEffect(() => { clearError(); }, [clearError]);

  useEffect(() => {
    if (!token && !email) {
      router.replace("/login");
    }
  }, [token, email, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSuccessMsg("");

    if (newPassword.length < 6) {
      setFormError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }
    if (!token) {
      setFormError("Missing reset token. Please use the link from your email.");
      return;
    }

    const { error } = await resetPassword(newPassword, token);
    if (error) {
      setFormError(typeof error === "string" ? error : error.message || "Failed to update password.");
    } else {
      setSuccessMsg("Password updated successfully! Redirecting to login...");
      setTimeout(() => { router.push("/login"); }, 2000);
    }
  };

  if (!token && !email) return null;

  return (
    <ResetPasswordForm
      email={email}
      newPassword={newPassword}
      setNewPassword={setNewPassword}
      confirmPassword={confirmPassword}
      setConfirmPassword={setConfirmPassword}
      formError={formError || storeError || ""}
      successMsg={successMsg}
      loading={loading}
      onSubmit={handleSubmit}
      onBackToLogin={() => router.push("/login")}
    />
  );
}

/** Wraps ResetPasswordContent in a Suspense boundary for useSearchParams support. */
export function ResetPasswordClient() {
  return (
    <Suspense fallback={<AuthSkeleton />}>
      <ResetPasswordContent />
    </Suspense>
  );
}

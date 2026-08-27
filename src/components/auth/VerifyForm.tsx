/**
 * Aurora — src/components/auth/VerifyForm.tsx
 *
 * Presentational form for email-verification prompts. Shows a masked-email
 * message, a resend button with countdown, and a success state after verification.
 */
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

interface VerifyFormProps {
  email: string;
  formError: string;
  successMsg: string;
  loading: boolean;
  verified: boolean;
  onResend: () => Promise<void>;
  onBack: () => void;
  initialCooldown?: number;
}

function maskEmail(rawEmail: string) {
  const [name, domain] = rawEmail.split("@");
  if (!domain) return rawEmail;
  if (name.length <= 2) return `${name[0]}***@${domain}`;
  return `${name[0]}***${name[name.length - 1]}@${domain}`;
}

/** Verify-email form UI — masked email display, resend button with cooldown, and success view. */
export function VerifyForm({
  email,
  formError,
  successMsg,
  loading,
  verified,
  onResend,
  onBack,
  initialCooldown = 0,
}: VerifyFormProps) {
  const [countdown, setCountdown] = useState(initialCooldown);
  const [prevCooldown, setPrevCooldown] = useState(initialCooldown);
  const [resending, setResending] = useState(false);

  if (prevCooldown !== initialCooldown) {
    setPrevCooldown(initialCooldown);
    if (initialCooldown > 0) {
      setCountdown(initialCooldown);
    }
  }
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleResendClick = async () => {
    if (countdown > 0 || resending) return;
    setResending(true);
    try { await onResend(); setCountdown(60); }
    catch { setCountdown(60); }
    finally { setResending(false); }
  };

  if (loading && !verified && !resending) {
    return (
      <main className="min-h-[90vh] md:min-h-screen bg-bg-primary pt-12 pb-12 px-6 flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-text-secondary">Verifying your email...</p>
        </div>
      </main>
    );
  }

  if (verified) {
    return (
      <main className="min-h-[90vh] md:min-h-screen bg-bg-primary pt-12 pb-12 px-6 flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[440px] bg-bg-secondary border border-border-subtle p-8 md:p-10 rounded-[24px] shadow-sm text-center"
        >
          <div className="mb-6">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h1 className="font-display font-black text-3xl uppercase tracking-wider mb-2">Verified!</h1>
            <p className="text-text-secondary text-sm">Your email has been verified. Redirecting to your profile...</p>
          </div>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-[90vh] md:min-h-screen bg-bg-primary pt-12 pb-12 px-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-[440px] mb-4">
        <button onClick={onBack} type="button"
          className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors font-medium cursor-pointer">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to Sign In
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[440px] bg-bg-secondary border border-border-subtle p-8 md:p-10 rounded-[24px] shadow-sm"
      >
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-accent-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-accent-primary" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>
          <h1 className="font-display font-black text-3xl uppercase tracking-wider mb-2">Check Your Email</h1>
          <p className="text-text-secondary text-sm">
            We sent a verification link to<br />
            <span className="font-medium text-text-primary break-all">{email ? maskEmail(email) : "your email"}</span>.
          </p>
        </div>

        {formError && <div className="mb-6 text-xs text-error font-medium px-1 text-center">{formError}</div>}
        {successMsg && <div className="mb-6 text-xs text-success font-medium px-1 text-center">{successMsg}</div>}

        <div className="text-center space-y-3">
          <p className="text-sm text-text-secondary">Didn't receive the email?</p>
          <Button
            variant="ghost"
            fullWidth
            size="md"
            onClick={handleResendClick}
            disabled={countdown > 0 || resending || loading}
          >
            {countdown > 0 ? (
              `Resend Email (${countdown}s)`
            ) : resending ? (
              <>
                Sending
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              </>
            ) : (
              "Resend Verification Email"
            )}
          </Button>
        </div>

        <div className="mt-8 pt-6 border-t border-border-subtle text-center">
          <p className="text-sm text-text-secondary">
            <Link href="/login" className="text-accent-primary font-semibold hover:underline">Return to Sign In</Link>
          </p>
        </div>
      </motion.div>
    </main>
  );
}

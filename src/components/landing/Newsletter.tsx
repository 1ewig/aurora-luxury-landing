/**
 * Aurora — src/components/landing/Newsletter.tsx
 *
 * Newsletter sign-up section with form submission, loading state, and success animation.
 */

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { EyebrowLabel } from "@/components/ui/EyebrowLabel";
import { staggerContainer, fadeInUp } from "@/animations/variants";

interface NewsletterProps {
  email: string;
  setEmail: (v: string) => void;
  submitted: boolean;
  loading: boolean;
  error?: string | null;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
}

/** Newsletter subscription form with email validation, loading state, and success animation. */
export function Newsletter({ email, setEmail, submitted, loading, error, handleSubmit }: NewsletterProps) {

  return (
    <section
      aria-labelledby="newsletter-heading"
      className="py-20 px-6 md:px-20 bg-bg-ink"
    >
      <div className="max-w-3xl mx-auto text-center">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-10% 0px" }}
        >
          <motion.div variants={fadeInUp}>
            <EyebrowLabel color="gold">Private Preview Access</EyebrowLabel>
          </motion.div>

          <motion.h2
            id="newsletter-heading"
            variants={fadeInUp}
            className="font-sans font-black leading-tight tracking-[-0.02em] text-text-inverted mt-4"
            style={{ fontSize: "clamp(2.5rem, 5vw, 5.5rem)" }}
          >
            Atelier Notes &amp;
            <br />
            <span className="text-accent-primary">Access.</span>
          </motion.h2>

          <motion.p
            variants={fadeInUp}
            className="text-text-muted mt-6 leading-relaxed max-w-md mx-auto"
          >
            Receive private notifications of limited-run releases, custom atelier swatches, and priority entry before public drops.
          </motion.p>

          <motion.div variants={fadeInUp} className="mt-12">
            <AnimatePresence mode="wait">
              {submitted ? (
                <motion.div
                  key="success"
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: {
                      opacity: 1,
                      transition: { staggerChildren: 0.15 }
                    }
                  }}
                  className="flex flex-col items-center gap-4 text-center"
                >
                  <motion.div
                    variants={{
                      hidden: { scale: 0, rotate: -45 },
                      visible: { 
                        scale: 1, 
                        rotate: 0,
                        transition: { type: "spring", stiffness: 200, damping: 15 } 
                      }
                    }}
                    className="w-16 h-16 rounded-full bg-accent-primary flex items-center justify-center shadow-lg"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2.5}
                      stroke="white"
                      className="w-8 h-8"
                    >
                      <motion.path
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.4, delay: 0.2 }}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.5 12.75l6 6 9-13.5"
                      />
                    </svg>
                  </motion.div>
                  
                  <motion.p
                    variants={{
                      hidden: { opacity: 0, y: 10 },
                      visible: { opacity: 1, y: 0 }
                    }}
                    className="text-text-inverted font-display text-xl tracking-wide uppercase font-light mt-2"
                  >
                    Access Granted.
                  </motion.p>
                  
                  <motion.p
                    variants={{
                      hidden: { opacity: 0 },
                      visible: { opacity: 1 }
                    }}
                    className="text-text-muted text-sm font-light max-w-sm"
                  >
                    Your address has been registered. Private preview entry confirmation will arrive in your inbox.
                  </motion.p>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  onSubmit={handleSubmit}
                  className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto w-full"
                  aria-label="Newsletter subscription form"
                  noValidate
                >
                  <label htmlFor="newsletter-email" className="sr-only">
                    Email address
                  </label>
                  <input
                    id="newsletter-email"
                    type="email"
                    name="email"
                    value={email}
                    disabled={loading}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    aria-required="true"
                    className="flex-1 px-6 py-4 rounded-full bg-white/10 border border-white/20 text-text-inverted placeholder:text-white/40 focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/30 focus:scale-[1.01] transition-all duration-300 text-sm disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-4 rounded-full bg-accent-primary text-white font-medium hover:bg-accent-vivid hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] transition-all duration-300 text-sm disabled:opacity-70 whitespace-nowrap cursor-pointer min-w-[140px] flex items-center justify-center"
                  >
                    {loading ? (
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      "Subscribe →"
                    )}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
            {error && (
              <p className="text-red-400 text-xs mt-3 text-center">{error}</p>
            )}
          </motion.div>

          <motion.p
            variants={fadeInUp}
            className="text-text-muted text-xs mt-4"
          >
            Fewer than 4 emails per month. Unsubscribe anytime.
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}

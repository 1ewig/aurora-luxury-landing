/**
 * Aurora — src/components/layout/Navbar.tsx
 *
 * Fixed top navigation with scroll-reactive background, cart drawer toggle,
 * user profile dropdown, and mobile menu trigger. Receives all dynamic data
 * via props from NavbarContainer.
 */

"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { navLinks } from "@/data/navigation";
import { SectionLink } from "@/components/ui/SectionLink";
import { useCartStore } from "@/stores/useCartStore";
import { useNavbarScroll } from "@/hooks/ui/useNavbarScroll";
import { navbarReveal } from "@/animations/variants";
import { useAuthStore } from "@/stores/useAuthStore";
import { AnnouncementBar } from "./AnnouncementBar";

const ConfirmDialog = dynamic(() => import("@/components/ui/ConfirmDialog").then((m) => m.ConfirmDialog), { ssr: false });
const NavbarProfileMenu = dynamic(() => import("./NavbarProfileMenu").then((m) => m.NavbarProfileMenu), { ssr: false });
const MobileMenu = dynamic(() => import("./MobileMenu").then((m) => m.MobileMenu), { ssr: false });

function UserIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
}

function BagIcon({ count }: { count: number }) {
  return (
    <div className="relative">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
      </svg>
      {count > 0 && (
        <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-accent-primary text-white text-[10px] flex items-center justify-center font-medium">
          {count}
        </span>
      )}
    </div>
  );
}

function MenuIcon() {
  return (
    <div className="w-5 h-4 flex flex-col justify-between">
      <span className="block h-px bg-current" />
      <span className="block h-px bg-current" />
      <span className="block h-px bg-current" />
    </div>
  );
}

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleCart = useCartStore((s) => s.toggleCart);
  const items = useCartStore((s) => s.items);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const loading = useAuthStore((s) => s.loading);
  const signOut = useAuthStore((s) => s.signOut);

  const { navBg, navBorder, navBlur, showBanner } = useNavbarScroll();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  return (
    <>
      <motion.header
        role="banner"
        variants={navbarReveal}
        initial="hidden"
        animate="visible"
        className="fixed top-0 inset-x-0 z-50"
      >
        {/* Understated Announcement Bar — hides on scroll down, reappears on scroll up */}
        <AnnouncementBar visible={showBanner} />
        <motion.div
          style={{
            backgroundColor: navBg,
            backdropFilter: navBlur,
            borderBottomColor: navBorder,
            borderBottomWidth: "1px",
            borderBottomStyle: "solid",
          }}
        >
          <nav
            aria-label="Main navigation"
            className="flex items-center justify-between h-16 md:h-20 px-6 md:px-12 lg:px-20 max-w-[1400px] mx-auto"
          >
            {/* Logo */}
            <SectionLink
              href="/#hero"
              prefetch={false}
              aria-label="Aurora — return to homepage"
              className="font-display font-black text-xl tracking-[0.15em] uppercase text-text-primary hover:text-accent-primary transition-colors"
            >
              Aurora
            </SectionLink>

            {/* Desktop Nav Links */}
            <ul
              role="list"
              className="hidden md:flex items-center gap-8 lg:gap-10"
            >
              {navLinks.map((link) => (
                <li key={link.href + link.label}>
                  <SectionLink
                    href={link.href}
                    prefetch={false}
                    className="text-sm font-medium text-text-primary hover:text-accent-primary transition-colors tracking-wide"
                  >
                    {link.label}
                  </SectionLink>
                </li>
              ))}
            </ul>

            {/* Utility Icons */}
            <div className="flex items-center gap-3">
              <motion.button
                aria-label={`Shopping bag, ${count} item${count !== 1 ? "s" : ""}`}
                onClick={toggleCart}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className="w-9 h-9 p-2 rounded-full border border-border-medium hover:bg-text-primary hover:text-text-inverted hover:border-text-primary transition-colors duration-300 text-text-primary flex items-center justify-center cursor-pointer"
              >
                <BagIcon count={count} />
              </motion.button>

              {loading || signingOut ? (
                <div
                  style={{ cursor: "not-allowed" }}
                  className="w-9 h-9 rounded-full border border-border-medium hover:bg-border-subtle/50 flex items-center justify-center"
                >
                  <div className="w-4 h-4 rounded-full border-2 border-text-primary/30 border-t-text-primary animate-spin" />
                </div>
              ) : user ? (
                <div className="relative" ref={dropdownRef}>
                  <motion.button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    aria-label="Toggle user menu"
                    aria-expanded={dropdownOpen}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    className="w-9 h-9 p-2 rounded-full border border-border-medium hover:bg-text-primary hover:text-text-inverted hover:border-text-primary transition-colors duration-300 text-text-primary flex items-center justify-center cursor-pointer"
                  >
                    <UserIcon />
                  </motion.button>
                  <NavbarProfileMenu
                    isOpen={dropdownOpen}
                    onClose={() => setDropdownOpen(false)}
                    user={user}
                    profile={profile}
                    onSignOutClick={() => setShowSignOutDialog(true)}
                  />
                </div>
              ) : (
                <motion.div
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <Link
                    href="/login"
                    prefetch={false}
                    className="inline-block px-5 py-2 rounded-full text-sm font-medium text-text-primary border border-text-primary hover:bg-text-primary hover:text-text-inverted transition-colors duration-300 tracking-wide select-none"
                  >
                    Sign In
                  </Link>
                </motion.div>
              )}
              
              <button
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen(!menuOpen)}
                className="md:hidden p-2 rounded-full hover:bg-border-subtle/50 transition-colors text-text-primary"
              >
                <MenuIcon />
              </button>
            </div>
          </nav>
        </motion.div>
      </motion.header>

      <MobileMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        navLinks={navLinks}
      />

      <ConfirmDialog
        open={showSignOutDialog}
        title="Sign Out"
        description="Are you sure you want to sign out of your Aurora wardrobe profile? You will need to sign in again to access your account."
        confirmLabel={signingOut ? "Signing Out" : "Sign Out"}
        cancelLabel="Cancel"
        onConfirm={async () => {
          setSigningOut(true);
          try {
            await signOut();
            setShowSignOutDialog(false);
            if (window.location.pathname.startsWith("/profile")) {
              window.location.href = "/login";
            }
          } catch {
            // fail silently
          } finally {
            setSigningOut(false);
          }
        }}
        onCancel={() => setShowSignOutDialog(false)}
        disabled={signingOut}
        loading={signingOut}
      />
    </>
  );
}

/**
 * Aurora — src/components/landing/LandingClient.tsx
 *
 * Page-level client container for the landing page. Fetches all data and
 * resolves business logic, then renders each section with props only.
 * Below-fold sections are code-split via next/dynamic to reduce the
 * initial client JS bundle.
 */
"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { useLandingQuery, type LandingData } from "@/hooks/queries/landing";
import { useNewsletterSubmit } from "@/hooks/useNewsletterSubmit";
import type { Product } from "@/data/products";
import { Hero } from "./Hero";
import { LazySection } from "@/components/ui/LazySection";

const SignaturePieces = dynamic(() => import("./SignaturePieces").then((m) => m.SignaturePieces), { loading: () => <div className="h-96" /> });
const FeaturedCollection = dynamic(() => import("./FeaturedCollection").then((m) => m.FeaturedCollection), { loading: () => <div className="h-96" /> });
const MaterialIndex = dynamic(() => import("./MaterialIndex").then((m) => m.MaterialIndex), { loading: () => <div className="h-[50vh]" /> });
const LookbookSlider = dynamic(() => import("./LookbookSlider").then((m) => m.LookbookSlider), { loading: () => <div className="h-[60vh]" /> });
const DesignerStory = dynamic(() => import("./DesignerStory").then((m) => m.DesignerStory), { loading: () => <div className="h-[50vh]" /> });
const PressClientNotes = dynamic(() => import("./PressClientNotes").then((m) => m.PressClientNotes), { loading: () => <div className="h-80" /> });
const Newsletter = dynamic(() => import("./Newsletter").then((m) => m.Newsletter), { loading: () => <div className="h-96" /> });

interface LandingClientProps {
  initialData?: LandingData;
}

export default function LandingClient({ initialData }: LandingClientProps) {
  const { data: landing } = useLandingQuery(initialData);
  const newsletter = useNewsletterSubmit();

  const serverDay = landing?.serverDay ?? new Date().getDate();
  const allProducts = landing?.products ?? [];
  const allCategories = landing?.categories ?? [];
  const dbSlides = landing?.lookbook ?? [];
  const editorialItems = landing?.editorial ?? [];
  const materials = landing?.materials ?? [];

  const heroProducts = useMemo(() => {
    if (!allProducts.length) return [];
    const len = allProducts.length;
    const count = Math.min(5, len);
    const selected: Product[] = [];
    const used = new Set<number>();
    for (let i = 0; i < count; i++) {
      let index = (serverDay + i * 3) % len;
      while (used.has(index)) {
        index = (index + 1) % len;
      }
      used.add(index);
      selected.push(allProducts[index]);
    }
    return selected;
  }, [allProducts, serverDay]);

  const signatureProducts = useMemo(() => {
    if (!allProducts.length) return [];
    const len = allProducts.length;
    const selected: Product[] = [];
    for (let i = 0; i < Math.min(3, len); i++) {
      const index = (serverDay + 7 + i * 5) % len;
      selected.push(allProducts[index]);
    }
    return selected;
  }, [allProducts, serverDay]);

  const dailyCategories = useMemo(() => {
    if (!allCategories.length) return [];
    return Array.from({ length: Math.min(3, allCategories.length) }, (_, i) =>
      allCategories[(serverDay + i) % allCategories.length]
    );
  }, [allCategories, serverDay]);

  const slides = dbSlides.slice(0, 6);
  const designerImage = editorialItems.find((item) => item.id === "designer")?.imageUrl;

  return (
    <main id="main-content" tabIndex={-1}>
      <Hero products={heroProducts} />
      <LazySection height="min-h-[600px]">
        <SignaturePieces products={signatureProducts} />
      </LazySection>
      <LazySection height="min-h-[600px]" id="collection">
        <FeaturedCollection categories={dailyCategories} />
      </LazySection>
      <LazySection height="min-h-[50vh]">
        <MaterialIndex materials={materials} />
      </LazySection>
      {slides.length > 0 && (
        <LazySection height="min-h-[60vh]" id="lookbook">
          <LookbookSlider slides={slides} />
        </LazySection>
      )}
      <LazySection height="min-h-[50vh]" id="story">
        <DesignerStory imageUrl={designerImage} />
      </LazySection>
      <LazySection height="min-h-[320px]">
        <PressClientNotes />
      </LazySection>
      <LazySection height="min-h-[400px]" id="newsletter">
        <Newsletter {...newsletter} />
      </LazySection>
    </main>
  );
}

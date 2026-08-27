import { describe, it, expect } from "vitest";
import { cn } from "@/utils/cn";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("px-4", "py-2")).toBe("px-4 py-2");
  });

  it("filters falsy values via clsx syntax", () => {
    const isHidden: boolean = false;
    expect(cn("base", isHidden && "hidden", "visible")).toBe("base visible");
  });

  it("resolves tailwind conflicts (last wins)", () => {
    expect(cn("px-4", "px-6")).toBe("px-6");
  });

  it("handles conditional classes with ternary", () => {
    const isBold: boolean = true;
    expect(cn("text-sm", isBold ? "font-bold" : "font-normal")).toBe(
      "text-sm font-bold"
    );
  });

  it("handles empty inputs", () => {
    expect(cn()).toBe("");
  });

  it("resolves padding conflict", () => {
    expect(cn("p-4", "p-2")).toBe("p-2");
  });
});

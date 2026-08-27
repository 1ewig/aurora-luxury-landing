import { describe, it, expect } from "vitest";
import {
  sanitize,
  sanitizeShippingAddress,
  validateShippingAddress,
} from "@/utils/sanitize";

describe("sanitize", () => {
  it("trims whitespace", () => {
    expect(sanitize("  hello  ")).toBe("hello");
  });

  it("strips HTML tags", () => {
    expect(sanitize("<script>alert('xss')</script>hello")).toBe(
      "alert('xss')hello"
    );
  });

  it("strips nested HTML tags", () => {
    expect(sanitize("<div><span>nested</span></div>")).toBe("nested");
  });

  it("truncates to 200 characters", () => {
    const long = "a".repeat(300);
    expect(sanitize(long).length).toBe(200);
  });

  it("handles empty string", () => {
    expect(sanitize("")).toBe("");
  });

  it("handles string with only whitespace", () => {
    expect(sanitize("   ")).toBe("");
  });
});

describe("sanitizeShippingAddress", () => {
  it("sanitizes all fields", () => {
    const result = sanitizeShippingAddress({
      email: " test@example.com ",
      firstName: " <b>John</b> ",
      lastName: " Doe ",
      address: " 123 Main St ",
      city: " New York ",
      zipCode: " 10001 ",
    });
    expect(result.email).toBe("test@example.com");
    expect(result.firstName).toBe("John");
    expect(result.lastName).toBe("Doe");
    expect(result.address).toBe("123 Main St");
    expect(result.city).toBe("New York");
    expect(result.zipCode).toBe("10001");
  });

  it("strips HTML from fields using sanitize() (firstName, lastName, address, city)", () => {
    const result = sanitizeShippingAddress({
      email: " test@example.com ",
      firstName: "<a>John</a>",
      lastName: "<b>Doe</b>",
      address: "<i>123 Main St</i>",
      city: "<u>NY</u>",
      zipCode: " 10001 ",
    });
    expect(result.email).toBe("test@example.com");
    expect(result.firstName).toBe("John");
    expect(result.lastName).toBe("Doe");
    expect(result.address).toBe("123 Main St");
    expect(result.city).toBe("NY");
    expect(result.zipCode).toBe("10001");
  });

  it("handles missing fields with empty string fallback", () => {
    const result = sanitizeShippingAddress({});
    expect(result.email).toBe("");
    expect(result.firstName).toBe("");
    expect(result.lastName).toBe("");
    expect(result.address).toBe("");
    expect(result.city).toBe("");
    expect(result.zipCode).toBe("");
  });
});

describe("validateShippingAddress", () => {
  const validAddress = {
    email: "test@example.com",
    firstName: "John",
    lastName: "Doe",
    address: "123 Main St",
    city: "New York",
    zipCode: "10001",
  };

  it("returns null for valid address", () => {
    expect(validateShippingAddress(validAddress)).toBeNull();
  });

  it("returns error for missing email", () => {
    const { email: _email, ...rest } = validAddress;
    expect(validateShippingAddress(rest)).toBe("email is required");
  });

  it("returns error for missing first name", () => {
    const { firstName: _firstName, ...rest } = validAddress;
    expect(validateShippingAddress(rest)).toBe("first name is required");
  });

  it("returns error for missing last name", () => {
    const { lastName: _lastName, ...rest } = validAddress;
    expect(validateShippingAddress(rest)).toBe("last name is required");
  });

  it("returns error for missing address", () => {
    const { address: _address, ...rest } = validAddress;
    expect(validateShippingAddress(rest)).toBe("address is required");
  });

  it("returns error for missing city", () => {
    const { city: _city, ...rest } = validAddress;
    expect(validateShippingAddress(rest)).toBe("city is required");
  });

  it("returns error for missing ZIP code", () => {
    const { zipCode: _zipCode, ...rest } = validAddress;
    expect(validateShippingAddress(rest)).toBe("ZIP code is required");
  });

  it("returns the first missing field error, not all", () => {
    expect(validateShippingAddress({})).toBe("email is required");
  });

  it("treats whitespace-only string as missing", () => {
    expect(
      validateShippingAddress({ ...validAddress, email: "   " })
    ).toBe("email is required");
  });

  it("returns error for invalid email format", () => {
    expect(
      validateShippingAddress({ ...validAddress, email: "invalid-email" })
    ).toBe("Enter a valid email address");
    expect(
      validateShippingAddress({ ...validAddress, email: "test@" })
    ).toBe("Enter a valid email address");
    expect(
      validateShippingAddress({ ...validAddress, email: "@@@" })
    ).toBe("Enter a valid email address");
  });
});

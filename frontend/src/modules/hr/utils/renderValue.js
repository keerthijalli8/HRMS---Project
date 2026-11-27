/**
 * Safe display helper utilities for the HRMS India application.
 * Prevents "Objects are not valid as a React child" errors by guaranteeing
 * that all rendered JSX expressions resolve to safe primitives (string, number).
 */

/**
 * Safely renders any value into a valid React child primitive.
 * - null/undefined/"" -> fallback (default: "-")
 * - string/number -> as is
 * - boolean -> "Yes" / "No"
 * - Date -> formatted in Indian locale (Asia/Kolkata)
 * - array -> joins primitive renderValue results with ", "
 * - plain object -> logs a console.warn in dev and returns fallback (never returns the object)
 */
export function renderValue(value, fallback = "-", fieldName = "") {
  if (value === null || value === undefined) {
    return fallback;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed === "" ? fallback : trimmed;
  }

  if (typeof value === "number") {
    if (Number.isNaN(value) || !Number.isFinite(value)) return fallback;
    return value;
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return fallback;
    return value.toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return fallback;
    const parts = value.map((item, idx) => {
      if (item && typeof item === "object") {
        return item.name || item.title || item.company || item.role || item.label || `Item ${idx + 1}`;
      }
      return renderValue(item, fallback, `${fieldName}[${idx}]`);
    });
    return parts.filter(Boolean).join(", ") || fallback;
  }

  if (typeof value === "object") {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[renderValue] Prevented crash: attempted to render plain object directly in JSX for field '${fieldName || "unknown"}':`,
        value
      );
    }
    return fallback;
  }

  return String(value);
}

/**
 * Safely formats address from either a string or an address object
 * { line1, line2, city, state, pincode } -> "Flat 402, Cyber Heights, Hitec City, Hyderabad, Telangana - 500081"
 */
export function formatAddress(address, fallback = "-") {
  if (!address) return fallback;
  if (typeof address === "string") {
    const trimmed = address.trim();
    return trimmed || fallback;
  }
  if (typeof address === "object") {
    const primaryLine = address.line1 || [address.flat, address.street].filter(Boolean).join(", ");
    const { line2, city, state, pincode, postalCode, country } = address;
    const parts = [primaryLine, line2, city, state].filter(Boolean);
    const pin = pincode || postalCode;
    let formatted = parts.join(", ");
    if (pin) {
      formatted += formatted ? ` - ${pin}` : String(pin);
    }
    if (country && country !== "India") {
      formatted += `, ${country}`;
    }
    return formatted || fallback;
  }
  return String(address);
}

/**
 * Safely formats emergency contact info
 * { name, relationship, relation, phone, mobile } -> "Ramesh Sharma (Parent) • +91 98765 43200"
 */
export function formatEmergencyContact(contact, fallback = "-") {
  if (!contact) return fallback;
  if (typeof contact === "string") {
    const trimmed = contact.trim();
    return trimmed || fallback;
  }
  if (typeof contact === "object") {
    const name = contact.name || contact.contactName;
    const rel = contact.relationship || contact.relation;
    const phone = contact.phone || contact.mobile || contact.contactNumber;

    if (!name && !phone) return fallback;

    let res = name || "Emergency Contact";
    if (rel) res += ` (${rel})`;
    if (phone) res += ` • ${phone}`;
    return res;
  }
  return String(contact);
}

/**
 * Safely formats currency to INR (en-IN)
 */
export function formatINR(val, fallback = "₹0") {
  if (val === null || val === undefined || val === "") return fallback;
  const num = typeof val === "number" ? val : parseFloat(String(val).replace(/[^0-9.-]+/g, ""));
  if (Number.isNaN(num)) return fallback;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(num);
}

export default renderValue;

import React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Native select for mobile use.
 * A Radix Popover portaled to <body> gets blocked by a Radix Dialog's modal
 * focus-trap and overlay, so the dropdown list never becomes interactive.
 * A native <select> renders inline (inside the dialog), opens the OS picker,
 * and is reliably clickable by both users and automated tests.
 */
export default function MobileSelectDrawer({ value, onChange, options, placeholder, title, className }) {
  return (
    <div className={cn("relative", className)}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={title}
        className="flex h-9 w-full items-center rounded-md border border-input bg-transparent pl-3 pr-8 py-1 text-sm shadow-sm appearance-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      >
        {!value && (
          <option value="" disabled>
            {placeholder || "Sélectionner"}
          </option>
        )}
        {options.length === 0 && <option value="" disabled>Aucune option</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50 pointer-events-none" />
    </div>
  );
}
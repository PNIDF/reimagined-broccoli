import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileSelectDrawer from "@/components/MobileSelectDrawer";

export default function ResponsiveSelect({ value, onValueChange, options, placeholder, title }) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <MobileSelectDrawer
        value={value}
        onChange={onValueChange}
        options={options}
        placeholder={placeholder}
        title={title}
      />
    );
  }

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
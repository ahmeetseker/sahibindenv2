import { describe, it, expect } from "vitest";
import { SUMMARY_ENTRIES } from "../summary-config";
import type { SummaryEntryId, BentoSlot } from "../types";

const ENTRY_IDS: SummaryEntryId[] = [
  "listings",
  "categories",
  "customers",
  "finance",
  "reports",
  "profile",
];
const REQUIRED_SLOTS: BentoSlot[] = ["hero", "kpi-tall", "mini-a", "mini-b"];

describe("SUMMARY_ENTRIES", () => {
  it.each(ENTRY_IDS)("entry '%s' tüm 4 slotu içerir", (id) => {
    const entry = SUMMARY_ENTRIES[id];
    expect(entry).toBeDefined();
    const slots = entry.cards.map((c) => c.slot).sort();
    expect(slots).toEqual([...REQUIRED_SLOTS].sort());
  });

  it.each(ENTRY_IDS)("entry '%s' valid target'a sahip", (id) => {
    const entry = SUMMARY_ENTRIES[id];
    expect(["listings", "customers", "finance", "reports", "profile"]).toContain(
      entry.target,
    );
  });

  it.each(ENTRY_IDS)("entry '%s' header.title doluysa accent boş değil", (id) => {
    const entry = SUMMARY_ENTRIES[id];
    expect(entry.header.title.lead.length).toBeGreaterThan(0);
    expect(entry.header.title.accent.length).toBeGreaterThan(0);
  });
});

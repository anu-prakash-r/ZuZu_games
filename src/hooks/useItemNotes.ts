import { useState } from "react";

interface UseItemNotesResult {
  itemNoteText: Record<number, string>;
  expandedNotePid: number | null;
  setExpandedNotePid: (pid: number | null) => void;
  setNoteText: (productId: number, text: string) => void;
  toggleChip: (productId: number, chip: string) => void;
  isChipActive: (productId: number, chip: string) => boolean;
  composeNote: (productId: number) => string | null;
  reset: () => void;
}

export function useItemNotes(): UseItemNotesResult {
  const [itemNoteText, setItemNoteText] = useState<Record<number, string>>({});
  const [expandedNotePid, setExpandedNotePid] = useState<number | null>(null);

  const setNoteText = (productId: number, text: string) =>
    setItemNoteText((prev) => ({ ...prev, [productId]: text }));

  const toggleChip = (productId: number, chip: string) => {
    setItemNoteText((prev) => {
      const current = (prev[productId] ?? "").trim();
      const parts = current
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const exists = parts.some((p) => p.toLowerCase() === chip.toLowerCase());
      const next = exists
        ? parts.filter((p) => p.toLowerCase() !== chip.toLowerCase())
        : [...parts, chip];
      return { ...prev, [productId]: next.join(", ") };
    });
  };

  const isChipActive = (productId: number, chip: string): boolean => {
    const current = (itemNoteText[productId] ?? "").trim().toLowerCase();
    if (!current) return false;
    return current
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .some((p) => p === chip.toLowerCase());
  };

  const composeNote = (productId: number): string | null => {
    const text = (itemNoteText[productId] ?? "").trim();
    return text.length > 0 ? text : null;
  };

  const reset = () => {
    setItemNoteText({});
    setExpandedNotePid(null);
  };

  return {
    itemNoteText,
    expandedNotePid,
    setExpandedNotePid,
    setNoteText,
    toggleChip,
    isChipActive,
    composeNote,
    reset,
  };
}

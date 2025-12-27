/**
 * Drawer Store
 * Manages drawer open/close state and expanded items
 */

import { create } from 'zustand';

type DrawerState = {
  // State
  isOpen: boolean;
  expandedItems: string[];

  // Actions
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  toggleExpanded: (itemId: string) => void;
  setExpandedItems: (items: string[]) => void;
  resetDrawer: () => void;
};

export const useDrawerStore = create<DrawerState>((set) => ({
  // Initial state
  isOpen: false,
  expandedItems: [],

  // Actions
  openDrawer: () => set({ isOpen: true }),

  closeDrawer: () => set({ isOpen: false }),

  toggleDrawer: () => set((state) => ({ isOpen: !state.isOpen })),

  toggleExpanded: (itemId: string) =>
    set((state) => ({
      expandedItems: state.expandedItems.includes(itemId)
        ? state.expandedItems.filter((id) => id !== itemId)
        : [...state.expandedItems, itemId],
    })),

  setExpandedItems: (items: string[]) => set({ expandedItems: items }),

  resetDrawer: () => set({ isOpen: false, expandedItems: [] }),
}));

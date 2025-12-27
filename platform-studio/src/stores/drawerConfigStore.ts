/**
 * Drawer Configuration Store for Platform Studio
 * Manages drawer settings and menu items with Supabase sync
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createClient } from "@supabase/supabase-js";
import { Role } from "@/types";
import {
  DrawerConfig,
  DrawerMenuItem,
  DEFAULT_DRAWER_CONFIG,
} from "@/types/drawer.types";

const DEMO_CUSTOMER_ID = "2b1195ab-1a06-4c94-8e5f-c7c318e7fc46";

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type DrawerConfigState = {
  // Selected role
  selectedRole: Role;

  // Configuration
  drawerConfigs: Record<Role, DrawerConfig>;
  menuItems: Record<Role, DrawerMenuItem[]>;

  // UI State
  isDirty: boolean;
  isSaving: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setSelectedRole: (role: Role) => void;
  updateConfig: (updates: Partial<DrawerConfig>) => void;
  addMenuItem: (item?: Partial<DrawerMenuItem>) => void;
  updateMenuItem: (itemId: string, updates: Partial<DrawerMenuItem>) => void;
  deleteMenuItem: (itemId: string) => void;
  reorderMenuItems: (items: DrawerMenuItem[]) => void;
  loadFromSupabase: () => Promise<void>;
  saveToSupabase: () => Promise<void>;
  resetToDefaults: () => void;
};

// Default menu item template
const createDefaultMenuItem = (
  role: Role,
  orderIndex: number
): DrawerMenuItem => ({
  id: "",
  customer_id: DEMO_CUSTOMER_ID,
  role,
  item_id: `item-${Date.now()}`,
  label_en: "New Item",
  label_hi: "",
  icon: "circle",
  item_type: "link",
  route: "",
  badge_type: "none",
  order_index: orderIndex,
  enabled: true,
});

// Initial configs for all roles
const createInitialConfigs = (): Record<Role, DrawerConfig> => ({
  student: {
    id: "",
    customer_id: DEMO_CUSTOMER_ID,
    role: "student",
    ...DEFAULT_DRAWER_CONFIG,
  },
  teacher: {
    id: "",
    customer_id: DEMO_CUSTOMER_ID,
    role: "teacher",
    ...DEFAULT_DRAWER_CONFIG,
  },
  parent: {
    id: "",
    customer_id: DEMO_CUSTOMER_ID,
    role: "parent",
    ...DEFAULT_DRAWER_CONFIG,
  },
  admin: {
    id: "",
    customer_id: DEMO_CUSTOMER_ID,
    role: "admin",
    ...DEFAULT_DRAWER_CONFIG,
    width_percentage: 85,
  },
});

export const useDrawerConfigStore = create<DrawerConfigState>()(
  persist(
    (set, get) => ({
      // Initial state
      selectedRole: "teacher",
      drawerConfigs: createInitialConfigs(),
      menuItems: {
        student: [],
        teacher: [],
        parent: [],
        admin: [],
      },
      isDirty: false,
      isSaving: false,
      isLoading: false,
      error: null,

      // Actions
      setSelectedRole: (role) => {
        set({ selectedRole: role });
      },

      updateConfig: (updates) => {
        const { selectedRole, drawerConfigs } = get();
        set({
          drawerConfigs: {
            ...drawerConfigs,
            [selectedRole]: {
              ...drawerConfigs[selectedRole],
              ...updates,
            },
          },
          isDirty: true,
        });
      },

      addMenuItem: (item) => {
        const { selectedRole, menuItems } = get();
        const currentItems = menuItems[selectedRole];
        const newItem: DrawerMenuItem = {
          ...createDefaultMenuItem(selectedRole, currentItems.length + 1),
          ...item,
        };
        set({
          menuItems: {
            ...menuItems,
            [selectedRole]: [...currentItems, newItem],
          },
          isDirty: true,
        });
      },

      updateMenuItem: (itemId, updates) => {
        const { selectedRole, menuItems } = get();
        set({
          menuItems: {
            ...menuItems,
            [selectedRole]: menuItems[selectedRole].map((item) =>
              item.item_id === itemId ? { ...item, ...updates } : item
            ),
          },
          isDirty: true,
        });
      },

      deleteMenuItem: (itemId) => {
        const { selectedRole, menuItems } = get();
        set({
          menuItems: {
            ...menuItems,
            [selectedRole]: menuItems[selectedRole]
              .filter((item) => item.item_id !== itemId)
              .map((item, index) => ({ ...item, order_index: index + 1 })),
          },
          isDirty: true,
        });
      },

      reorderMenuItems: (items) => {
        const { selectedRole, menuItems } = get();
        set({
          menuItems: {
            ...menuItems,
            [selectedRole]: items,
          },
          isDirty: true,
        });
      },

      loadFromSupabase: async () => {
        set({ isLoading: true, error: null });

        try {
          // Load configs for all roles
          const { data: configs, error: configError } = await supabase
            .from("drawer_config")
            .select("*")
            .eq("customer_id", DEMO_CUSTOMER_ID);

          if (configError) throw configError;

          // Load menu items for all roles
          const { data: items, error: itemsError } = await supabase
            .from("drawer_menu_items")
            .select("*")
            .eq("customer_id", DEMO_CUSTOMER_ID)
            .order("order_index", { ascending: true });

          if (itemsError) throw itemsError;

          // Organize by role
          const drawerConfigs = createInitialConfigs();
          const menuItemsByRole: Record<Role, DrawerMenuItem[]> = {
            student: [],
            teacher: [],
            parent: [],
            admin: [],
          };

          configs?.forEach((config: DrawerConfig) => {
            if (config.role in drawerConfigs) {
              drawerConfigs[config.role as Role] = config;
            }
          });

          items?.forEach((item: DrawerMenuItem) => {
            if (item.role in menuItemsByRole) {
              menuItemsByRole[item.role as Role].push(item);
            }
          });

          set({
            drawerConfigs,
            menuItems: menuItemsByRole,
            isLoading: false,
            isDirty: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Failed to load",
            isLoading: false,
          });
        }
      },

      saveToSupabase: async () => {
        const { selectedRole, drawerConfigs, menuItems } = get();
        set({ isSaving: true, error: null });

        try {
          const config = drawerConfigs[selectedRole];
          const items = menuItems[selectedRole];

          // Build config data - exclude id if empty (let DB generate)
          const { id: configId, ...configWithoutId } = config;
          const configData = {
            ...(configId ? { id: configId } : {}),
            ...configWithoutId,
            customer_id: DEMO_CUSTOMER_ID,
            role: selectedRole,
            updated_at: new Date().toISOString(),
          };

          // Upsert drawer config
          const { error: configError } = await supabase
            .from("drawer_config")
            .upsert(configData, { onConflict: "customer_id,role" });

          if (configError) throw configError;

          // Delete existing menu items for this role
          const { error: deleteError } = await supabase
            .from("drawer_menu_items")
            .delete()
            .eq("customer_id", DEMO_CUSTOMER_ID)
            .eq("role", selectedRole);

          if (deleteError) throw deleteError;

          // Insert new menu items
          if (items.length > 0) {
            const { error: insertError } = await supabase
              .from("drawer_menu_items")
              .insert(
                items.map((item, index) => {
                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                  const { id, ...itemWithoutId } = item;
                  return {
                    ...itemWithoutId,
                    customer_id: DEMO_CUSTOMER_ID,
                    role: selectedRole,
                    order_index: index + 1,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  };
                })
              );

            if (insertError) throw insertError;
          }

          // Reload to get the generated IDs
          await get().loadFromSupabase();
          set({ isSaving: false, isDirty: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Failed to save",
            isSaving: false,
          });
          throw error;
        }
      },

      resetToDefaults: () => {
        const { selectedRole } = get();
        set({
          drawerConfigs: {
            ...get().drawerConfigs,
            [selectedRole]: {
              id: "",
              customer_id: DEMO_CUSTOMER_ID,
              role: selectedRole,
              ...DEFAULT_DRAWER_CONFIG,
            },
          },
          isDirty: true,
        });
      },
    }),
    {
      name: "drawer-config-storage",
      partialize: (state) => ({
        selectedRole: state.selectedRole,
        // Don't persist data - load from Supabase
      }),
    }
  )
);

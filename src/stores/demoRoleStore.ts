import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Role } from '../types/permission.types';

type DemoRoleState = {
  role: Role;
  userId: string;
  setRole: (role: Role) => void;
};

// Demo user IDs per role (must be valid UUIDs for analytics)
const DEMO_USER_IDS: Record<Role, string> = {
  student: '96055c84-a9ee-496d-8360-6b7cea64b928',
  parent: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
  teacher: 'b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e',
  admin: 'c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f',
};

export const useDemoRoleStore = create<DemoRoleState>()(
  persist(
    (set) => ({
      role: 'student',
      userId: DEMO_USER_IDS.student,
      setRole: (role: Role) =>
        set({
          role,
          userId: DEMO_USER_IDS[role],
        }),
    }),
    {
      name: 'demo-role-storage-v2', // Changed to force reset of persisted data
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

import { create } from 'zustand';

interface NotificationState {
  unreadCount: number;
  incrementUnread: () => void;
  setUnreadCount: (count: number) => void;
  clearUnread: () => void;
}

const normalizeCount = (count: number): number => {
  if (!Number.isFinite(count)) return 0;
  return Math.max(0, Math.floor(count));
};

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 0,
  incrementUnread: () =>
    set((state) => ({ unreadCount: state.unreadCount + 1 })),
  setUnreadCount: (count) => set({ unreadCount: normalizeCount(count) }),
  clearUnread: () => set({ unreadCount: 0 }),
}));

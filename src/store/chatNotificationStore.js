import { create } from 'zustand';

// Tracks unread customer chat messages for the topbar bell.
// Each entry represents one chat thread (collapsed to latest message).
export const useChatNotificationStore = create((set, get) => ({
  threads: [], // [{ threadId, customerId, customerName, customerPhone, lastMessage, lastMessageAt, count, read }]

  add: ({ threadId, customerId, customerName, customerPhone, lastMessage, lastMessageAt }) => {
    if (!threadId) return;
    set((s) => {
      const existing = s.threads.find((t) => t.threadId === threadId);
      const rest = s.threads.filter((t) => t.threadId !== threadId);
      const next = {
        threadId,
        customerId,
        customerName: customerName || existing?.customerName || 'Customer',
        customerPhone: customerPhone || existing?.customerPhone || '',
        lastMessage,
        lastMessageAt: lastMessageAt || new Date().toISOString(),
        count: (existing?.read ? 0 : existing?.count || 0) + 1,
        read: false,
      };
      return { threads: [next, ...rest].slice(0, 50) };
    });
  },

  markThreadRead: (threadId) =>
    set((s) => ({
      threads: s.threads.map((t) =>
        t.threadId === threadId ? { ...t, count: 0, read: true } : t
      ),
    })),

  markAllRead: () =>
    set((s) => ({
      threads: s.threads.map((t) => ({ ...t, count: 0, read: true })),
    })),

  clear: () => set({ threads: [] }),

  totalUnread: () => get().threads.reduce((sum, t) => sum + (t.count || 0), 0),
}));

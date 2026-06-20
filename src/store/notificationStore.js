import { create } from 'zustand';

export const useNotificationStore = create((set, get) => ({

    notifications: [],
    unreadCount: 0,

    add: (msg, type = 'info', data = {}) => {

        const id = Date.now();

        set((s) => ({
            notifications: [{ id, msg, type, data, read: false, createdAt: new Date() }, ...s.notifications].slice(0, 100),
            unreadCount: s.unreadCount + 1,
        }));

        return id;

    },

    markAsRead: (id) => set((s) => {
        const n = s.notifications.find((n) => n.id === id);
        if (!n || n.read) return s;
        return {
            notifications: s.notifications.map((n) => n.id === id ? { ...n, read: true } : n),
            unreadCount: Math.max(0, s.unreadCount - 1),
        };
    }),

    markAllRead: () => set((s) => ({
        notifications: s.notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
    })),

    remove: (id) => set((s) => {
        const n = s.notifications.find((n) => n.id === id);
        return {
            notifications: s.notifications.filter((n) => n.id !== id),
            unreadCount: n && !n.read ? Math.max(0, s.unreadCount - 1) : s.unreadCount,
        };
    }),

    clear:  ()   => set({ notifications: [], unreadCount: 0 }),

}));

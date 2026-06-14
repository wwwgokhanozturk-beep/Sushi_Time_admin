import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '@/store/authStore';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

/**
 * Hook that manages a single Socket.io connection for the admin panel.
 * Automatically connects with the auth token and joins the admin room.
 *
 * @param {Object} handlers - Map of event names to handler functions
 * @returns {import('socket.io-client').Socket | null}
 */
export default function useSocket(handlers = {}) {
  const socketRef = useRef(null);
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (!token) return;

    const socket = io(SOCKET_URL, {
      // polling first guarantees the connection over HTTPS, then upgrades to websocket
      transports: ['polling', 'websocket'],
      auth: { token },
    });

    socketRef.current = socket;

    // Register event handlers
    Object.entries(handlers).forEach(([event, fn]) => {
      socket.on(event, fn);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return socketRef.current;
}

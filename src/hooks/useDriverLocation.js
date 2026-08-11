import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '@/store/authStore';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

/**
 * Live positions of every courier currently on a delivery.
 *
 * The server only lets authenticated admins into the "admin" room, so the
 * connection must carry the JWT — without it the handshake is rejected and no
 * `driver:location` event ever arrives.
 *
 * @returns {Record<string, { lat: number, lng: number, orderId: string, updatedAt: string }>}
 *          keyed by driverId
 */
export function useDriverLocations() {
  const token = useAuthStore((s) => s.token);
  const [locations, setLocations] = useState({});

  useEffect(() => {
    if (!token) return undefined;

    const socket = io(SOCKET_URL, {
      transports: ['polling', 'websocket'],
      auth: { token },
    });

    const onLocation = (data) => {
      if (!data?.driverId) return;
      setLocations((prev) => ({
        ...prev,
        [data.driverId]: {
          lat: data.lat,
          lng: data.lng,
          orderId: data.orderId,
          updatedAt: data.updatedAt,
        },
      }));
    };

    socket.on('driver:location', onLocation);

    return () => {
      socket.off('driver:location', onLocation);
      socket.disconnect();
    };
  }, [token]);

  return locations;
}

/** Live position of a single courier, or null while nothing has arrived yet. */
export function useDriverLocation(driverId) {
  const locations = useDriverLocations();
  return driverId ? locations[driverId] || null : null;
}

export default useDriverLocation;

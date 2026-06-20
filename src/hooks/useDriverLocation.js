import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export function useDriverLocation(driverId) {
  const [location, setLocation] = useState(null);

  useEffect(() => {
    if (!driverId) return;
    const socket = io(SOCKET_URL, { transports: ['polling', 'websocket'] });

    socket.on('driver:location', (data) => {
      if (data.driverId === driverId) {
        setLocation({ lat: data.lat, lng: data.lng });
      }
    });

    return () => socket.disconnect();
  }, [driverId]);

  return location;
}

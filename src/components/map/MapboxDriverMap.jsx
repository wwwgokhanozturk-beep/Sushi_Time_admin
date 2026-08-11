import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography } from '@mui/material';

const MAPBOX_VERSION = '3.7.0';
const MAP_STYLE = 'mapbox://styles/mapbox/streets-v12';
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

// Restaurant (Mahmutlar, Kumru Sk. No:7/D) — the map's default centre.
const RESTAURANT_LAT = 36.4907923;
const RESTAURANT_LNG = 32.0966857;

let loaderPromise = null;

/** Loads mapbox-gl from the CDN once — same approach as the customer apps. */
function loadMapboxGL() {
  if (window.mapboxgl) return Promise.resolve(window.mapboxgl);
  if (loaderPromise) return loaderPromise;

  loaderPromise = new Promise((resolve, reject) => {
    const cssId = 'mapbox-gl-css';
    if (!document.getElementById(cssId)) {
      const link = document.createElement('link');
      link.id = cssId;
      link.rel = 'stylesheet';
      link.href = `https://api.mapbox.com/mapbox-gl-js/v${MAPBOX_VERSION}/mapbox-gl.css`;
      document.head.appendChild(link);
    }
    const script = document.createElement('script');
    script.src = `https://api.mapbox.com/mapbox-gl-js/v${MAPBOX_VERSION}/mapbox-gl.js`;
    script.async = true;
    script.onload = () => resolve(window.mapboxgl);
    script.onerror = () => reject(new Error('Mapbox GL yüklenemedi'));
    document.head.appendChild(script);
  });
  return loaderPromise;
}

function buildDriverEl(label) {
  const el = document.createElement('div');
  el.style.cssText = 'display:flex;flex-direction:column;align-items:center;cursor:default;';
  el.innerHTML = `
    <div style="background:#E8181B;color:#fff;font-size:11px;font-weight:800;padding:3px 8px;
      border-radius:999px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,.25);margin-bottom:3px;">${label}</div>
    <div style="width:34px;height:34px;border-radius:50%;background:#fff;border:3px solid #E8181B;
      box-shadow:0 3px 10px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;font-size:17px;">🛵</div>`;
  return el;
}

function buildRestaurantEl() {
  const el = document.createElement('div');
  el.innerHTML = `
    <div style="width:26px;height:26px;background:#111;border:3px solid #fff;border-radius:50% 50% 50% 0;
      transform:rotate(45deg);box-shadow:0 3px 8px rgba(0,0,0,.4);"></div>`;
  return el;
}

/**
 * Live courier map for the admin dashboard.
 *
 * `drivers` is a list of { _id, name, lastLocation: { lat, lng } } — the
 * position may come either from the socket stream or from the throttled copy
 * stored on the user document.
 */
export default function MapboxDriverMap({ drivers = [], height = 460 }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef(new Map());
  const fittedRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(MAPBOX_TOKEN ? '' : 'VITE_MAPBOX_TOKEN tanımlı değil');

  useEffect(() => {
    if (!MAPBOX_TOKEN) return undefined;
    let cancelled = false;

    loadMapboxGL()
      .then((mapboxgl) => {
        if (cancelled || !containerRef.current || mapRef.current) return;
        mapboxgl.accessToken = MAPBOX_TOKEN;
        const map = new mapboxgl.Map({
          container: containerRef.current,
          style: MAP_STYLE,
          center: [RESTAURANT_LNG, RESTAURANT_LAT],
          zoom: 13,
          attributionControl: false,
        });
        map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right');
        map.on('load', () => {
          new mapboxgl.Marker({ element: buildRestaurantEl(), anchor: 'bottom' })
            .setLngLat([RESTAURANT_LNG, RESTAURANT_LAT])
            .addTo(map);
          if (!cancelled) setReady(true);
        });
        mapRef.current = map;
      })
      .catch((err) => !cancelled && setError(err.message));

    return () => {
      cancelled = true;
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
      markersRef.current.clear();
    };
  }, []);

  // Sync markers with the current courier list.
  useEffect(() => {
    const mapboxgl = window.mapboxgl;
    const map = mapRef.current;
    if (!ready || !map || !mapboxgl) return;

    const seen = new Set();

    drivers.forEach((driver) => {
      const loc = driver.lastLocation;
      if (!loc?.lat || !loc?.lng) return;
      seen.add(driver._id);

      const existing = markersRef.current.get(driver._id);
      if (existing) {
        existing.setLngLat([loc.lng, loc.lat]);
      } else {
        const marker = new mapboxgl.Marker({ element: buildDriverEl(driver.name || 'Kurye'), anchor: 'bottom' })
          .setLngLat([loc.lng, loc.lat])
          .addTo(map);
        markersRef.current.set(driver._id, marker);
      }
    });

    // Couriers that went offline lose their marker.
    markersRef.current.forEach((marker, id) => {
      if (!seen.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });

    // Fit once, then leave the viewport to the operator.
    if (!fittedRef.current && seen.size > 0) {
      const bounds = new mapboxgl.LngLatBounds(
        [RESTAURANT_LNG, RESTAURANT_LAT],
        [RESTAURANT_LNG, RESTAURANT_LAT],
      );
      drivers.forEach((d) => {
        if (seen.has(d._id)) bounds.extend([d.lastLocation.lng, d.lastLocation.lat]);
      });
      map.fitBounds(bounds, { padding: 70, maxZoom: 15, duration: 600 });
      fittedRef.current = true;
    }
  }, [ready, drivers]);

  if (error) {
    return (
      <Box sx={{ width: '100%', height, bgcolor: '#F3F4F6', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography color="text.secondary">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box
      ref={containerRef}
      sx={{ width: '100%', height, borderRadius: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}
    />
  );
}

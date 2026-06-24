// Google Maps deep link for an order's delivery destination.
// Prefers the exact GPS pin (set when the customer picked a point on the map at
// checkout) and falls back to a text search of the typed address.
export function buildMapsUrl(order) {
  if (!order) return null;

  const { latitude, longitude } = order;
  if (latitude != null && longitude != null) {
    return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  }

  const text = [order.address, order.buildingName, order.apartment]
    .filter(Boolean)
    .join(' ')
    .trim();
  if (!text) return null;

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(text)}`;
}

// True when the link points to an exact GPS pin rather than a fuzzy text search.
export function isGpsPin(order) {
  return !!order && order.latitude != null && order.longitude != null;
}

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "preparing",
  "en_route",
  "delivered",
  "cancelled",
];

export const STATUS_COLORS = {
  pending: "warning",
  confirmed: "info",
  preparing: "info",
  en_route: "primary",
  delivered: "success",
  cancelled: "error",
};

export const STATUS_LABELS = {
  pending: "Beklemede",
  confirmed: "Onaylandı",
  preparing: "Hazırlanıyor",
  en_route: "Yolda",
  delivered: "Teslim Edildi",
  cancelled: "İptal Edildi",
};

// Where the customer placed the order (order.platform, set by the server).
export const PLATFORM_LABELS = {
  ios: "iOS",
  android: "Android",
  web: "Web sitesi",
};

export const MENU_CATEGORIES = [
  "rolls",
  "sets",
  "tempura",
  "hosomaki",
  "noodles",
  "pizza",
  "nigiri",
  "sashimi",
  "temaki",
  "appetizers",
  "drinks",
  "desserts",
  "fast_food",
  "onigiri",
];

// Sections whose dishes are rolls (on the site «РОЛЛЫ», «Темпура», «Хосо-ролл»,
// «Ролл маки»). The restaurant's roll is 8 pieces and 250 g, so a new dish in
// one of them starts with these values in the dish form (2026-11-16).
export const ROLL_CATEGORIES = ["rolls", "tempura", "hosomaki", "temaki"];
export const ROLL_DEFAULTS = { pieces: 8, weight: 250 };

export const SIDEBAR_WIDTH = 240;

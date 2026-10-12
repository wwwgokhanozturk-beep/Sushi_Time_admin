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

export const SIDEBAR_WIDTH = 240;

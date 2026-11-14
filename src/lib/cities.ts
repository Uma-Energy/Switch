// City centres used as placeholder coordinates until maps and geocoding are added.
export const CITY_CENTRES: Record<string, { lat: number; lng: number }> = {
  Lagos: { lat: 6.5244, lng: 3.3792 },
  Abuja: { lat: 9.0765, lng: 7.3986 },
  "Port Harcourt": { lat: 4.8156, lng: 7.0498 },
  Ibadan: { lat: 7.3775, lng: 3.947 },
  Kano: { lat: 12.0022, lng: 8.592 },
  Enugu: { lat: 6.4584, lng: 7.5464 },
  "Benin City": { lat: 6.335, lng: 5.6037 },
  Kaduna: { lat: 10.5105, lng: 7.4165 },
  Owerri: { lat: 5.4836, lng: 7.0333 },
};
export const CITIES = Object.keys(CITY_CENTRES);

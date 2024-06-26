export async function isBluetoothAvailable() {
  return await navigator.bluetooth?.getAvailability();
}

export function isChromiumBrowser() {
  return navigator.userAgentData?.brands.some((brand) =>
    brand.brand.includes("Chromium"),
  );
}

export function formatTemp(numericValue) {
  // TODO use Intl.NumberFormat
  // TODO use selected temperature unit (°C/°F)
  return `${numericValue * 0.01}°C`;
}

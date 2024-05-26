export const ValueMapping = Object.freeze({
  LiquidLevel: {
    0: "Empty",
    30: "Not Empty",
  },
  LiquidState: {
    0: "Unknown",
    1: "Empty",
    2: "Filling",
    3: "Cold, no temperature control",
    4: "Cooling",
    5: "Heating",
    6: "Stable Temperature",
    7: "Warm, no temperature control",
  },
  BatteryCharging: {
    0: "Not Charging",
    1: "Charging",
  },
  TemperatureUnit: {
    0: "Celsius",
    1: "Fahrenheit",
  },
});

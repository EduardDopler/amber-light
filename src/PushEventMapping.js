export const PushEvent = Object.freeze({
  Battery: "battery",
  TargetTemp: "target-temp",
  CurrentTemp: "current-temp",
  LiquidLevel: "liquid-level",
  LiquidState: "liquid-state",
});

export const BatteryEvent = Object.freeze({
  Charging: "charging",
  NotCharging: "not-charging",
});

export const PushEventMapping = Object.freeze({
  1: [PushEvent.Battery],
  2: [PushEvent.Battery, BatteryEvent.Charging],
  3: [PushEvent.Battery, BatteryEvent.NotCharging],
  4: [PushEvent.TargetTemp],
  5: [PushEvent.CurrentTemp],
  // 6 not implemented
  7: [PushEvent.LiquidLevel],
  8: [PushEvent.LiquidState],
});

export const ValueType = Object.freeze({
  ...PushEvent,
  Color: "color",
});

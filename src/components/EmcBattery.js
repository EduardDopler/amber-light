import html from "./EmcBattery.html?raw";
import { battery as batteryUuid } from "../uuids.json";
import { formatTemp } from "../utils.js";

export class EmcBattery extends HTMLElement {
  /** @type {boolean} */
  static isConnected = false;
  /** @type {BluetoothRemoteGATTCharacteristic|null} */
  static characteristic = null;

  async connectedCallback() {
    this.innerHTML = `${html}`;

    window.addEventListener("emc-connected", this.onConnected.bind(this));
    window.addEventListener("emc-disconnected", this.onDisconnected.bind(this));
    window.addEventListener(
      "emc-battery-value-changed",
      this.updateValue.bind(this),
    );
    window.addEventListener(
      "emc-force-update-values",
      this.updateValue.bind(this),
    );
    this.addEventListener("click", this.updateValue);
  }

  async updateValue() {
    if (!this.constructor.isConnected) return;

    const rawValue = await this.constructor.characteristic.readValue();
    const batteryValue = rawValue.getUint8(0);
    const chargingValue = rawValue.getUint8(1);
    const batteryTempValue = rawValue.getUint16(2, true);

    if (chargingValue === 0) {
      this.displayValue({
        batteryValue,
        batteryTempValue,
      });
    } else {
      this.displayValue({
        batteryValue,
        batteryTempValue,
        isCharging: true,
      });
    }
  }

  async onConnected(ev) {
    this.constructor.characteristic =
      await ev.detail.service.getCharacteristic(batteryUuid);
    this.constructor.isConnected = true;
    await this.updateValue();
  }

  async onDisconnected() {
    this.constructor.characteristic = null;
    this.constructor.isConnected = false;
    this.displayValue({ batteryValue: "n/a", batteryTempValue: "n/a" });
  }

  displayValue({ batteryValue, batteryTempValue, isCharging = false }) {
    const elBattery = this.querySelector("#emc-battery-value");
    const elCharging = this.querySelector("#emc-battery-charging-value");
    elBattery.textContent =
      batteryValue === "n/a" ? "n/a" : `${batteryValue} %`;
    elCharging.textContent = isCharging ? "(Charging)" : "";
    const batteryTempValueFormatted = formatTemp(batteryTempValue);
    this.setAttribute("battery-temp", batteryTempValueFormatted);
  }
}

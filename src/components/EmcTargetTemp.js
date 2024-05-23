import html from "./EmcTargetTemp.html?raw";
import { targetTemp as targetTempUuid } from "../uuids.json";
import { formatTemp } from "../utils.js";

export class EmcTargetTemp extends HTMLElement {
  /** @type {boolean} */
  static isConnected = false;
  /** @type {BluetoothRemoteGATTCharacteristic|null} */
  static characteristic = null;

  async connectedCallback() {
    this.innerHTML = `${html}`;

    window.addEventListener("emc-connected", this.onConnected.bind(this));
    window.addEventListener("emc-disconnected", this.onDisconnected.bind(this));
    window.addEventListener(
      "emc-target-temp-value-changed",
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
    const numericValue = rawValue.getUint16(0, true);
    const targetTempValue = formatTemp(numericValue);
    this.setText(targetTempValue);
  }

  async onConnected(ev) {
    this.constructor.characteristic =
      await ev.detail.service.getCharacteristic(targetTempUuid);
    this.constructor.isConnected = true;
    await this.updateValue();
  }

  async onDisconnected() {
    this.constructor.characteristic = null;
    this.constructor.isConnected = false;
    this.setText("n/a");
  }

  setText(text) {
    const el = this.querySelector("#emc-target-temp-value");
    el.textContent = text;
  }
}

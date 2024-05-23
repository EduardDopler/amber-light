import html from "./EmcCurrentTemp.html?raw";
import { currentTemp as currentTempUuid } from "../uuids.json";
import { formatTemp } from "../utils.js";

export class EmcCurrentTemp extends HTMLElement {
  /** @type {boolean} */
  static isConnected = false;
  /** @type {BluetoothRemoteGATTCharacteristic|null} */
  static characteristic = null;

  async connectedCallback() {
    this.innerHTML = `${html}`;

    window.addEventListener("emc-connected", this.onConnected.bind(this));
    window.addEventListener("emc-disconnected", this.onDisconnected.bind(this));
    window.addEventListener(
      "emc-current-temp-value-changed",
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
    const currentTempValue = formatTemp(numericValue);
    this.setText(currentTempValue);
  }

  async onConnected(ev) {
    this.constructor.characteristic =
      await ev.detail.service.getCharacteristic(currentTempUuid);
    this.constructor.isConnected = true;
    await this.updateValue();
  }

  async onDisconnected() {
    this.constructor.characteristic = null;
    this.constructor.isConnected = false;
    this.setText("n/a");
  }

  setText(text) {
    const el = this.querySelector("#emc-current-temp-value");
    el.textContent = text;
  }
}

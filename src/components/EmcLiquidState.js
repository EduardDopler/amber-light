import html from "./EmcLiquidState.html?raw";
import { liquidState as liquidStateUuid } from "../uuids.json";
import { ValueMapping } from "../ValueMapping.js";

export class EmcLiquidState extends HTMLElement {
  /** @type {boolean} */
  static isConnected = false;
  /** @type {BluetoothRemoteGATTCharacteristic|null} */
  static characteristic = null;

  async connectedCallback() {
    this.innerHTML = `${html}`;

    window.addEventListener("emc-connected", this.onConnected.bind(this));
    window.addEventListener("emc-disconnected", this.onDisconnected.bind(this));
    window.addEventListener(
      "emc-liquid-state-value-changed",
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
    const numericValue = rawValue.getUint8(0);
    const liquidState =
      ValueMapping.LiquidState[numericValue] ?? `Unknown (${numericValue})`;
    this.setText(liquidState);
  }

  async onConnected(ev) {
    this.constructor.characteristic =
      await ev.detail.service.getCharacteristic(liquidStateUuid);
    this.constructor.isConnected = true;
    await this.updateValue();
  }

  async onDisconnected() {
    this.constructor.characteristic = null;
    this.constructor.isConnected = false;
    this.setText("n/a");
  }

  setText(text) {
    const el = this.querySelector("#emc-liquid-state-value");
    el.textContent = text;
  }
}

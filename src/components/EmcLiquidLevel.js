import html from "./EmcLiquidLevel.html?raw";
import { liquidLevel as liquidLevelUuid } from "../uuids.json";
import { ValueMapping } from "../ValueMapping.js";

export class EmcLiquidLevel extends HTMLElement {
  /** @type {boolean} */
  static isConnected = false;
  /** @type {BluetoothRemoteGATTCharacteristic|null} */
  static characteristic = null;

  async connectedCallback() {
    this.innerHTML = `${html}`;

    window.addEventListener("emc-connected", this.onConnected.bind(this));
    window.addEventListener("emc-disconnected", this.onDisconnected.bind(this));
    window.addEventListener(
      "emc-liquid-level-value-changed",
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
    const liquidLevel =
      ValueMapping.LiquidLevel[numericValue] ?? `Unknown (${numericValue})`;
    this.setText(liquidLevel);
  }

  async onConnected(ev) {
    this.constructor.characteristic =
      await ev.detail.service.getCharacteristic(liquidLevelUuid);
    this.constructor.isConnected = true;
    await this.updateValue();
  }

  async onDisconnected() {
    this.constructor.characteristic = null;
    this.constructor.isConnected = false;
    this.setText("n/a");
  }

  setText(text) {
    const el = this.querySelector("#emc-liquid-level-value");
    el.textContent = text;
  }
}

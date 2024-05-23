import html from "./EmcColor.html?raw";
import { color as colorUuid } from "../uuids.json";

export class EmcColor extends HTMLElement {
  /** @type {boolean} */
  static isConnected = false;
  /** @type {BluetoothRemoteGATTCharacteristic|null} */
  static characteristic = null;

  async connectedCallback() {
    this.innerHTML = `${html}`;

    window.addEventListener("emc-connected", this.onConnected.bind(this));
    window.addEventListener("emc-disconnected", this.onDisconnected.bind(this));
    window.addEventListener(
      "emc-color-value-changed",
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
    const rgba = {
      r: rawValue.getUint8(0),
      g: rawValue.getUint8(1),
      b: rawValue.getUint8(2),
      a: rawValue.getUint8(3),
    };
    this.setColor(rgba);
  }

  async onConnected(ev) {
    this.constructor.characteristic =
      await ev.detail.service.getCharacteristic(colorUuid);
    this.constructor.isConnected = true;
    await this.updateValue();
  }

  async onDisconnected() {
    this.constructor.characteristic = null;
    this.constructor.isConnected = false;
    this.setColor("n/a");
  }

  setColor({ r, g, b, a }) {
    const el = this.querySelector("#emc-color-value");
    el.style = `--c-mug-color-value: rgba(${r}, ${g}, ${b}, ${a})`;
  }
}

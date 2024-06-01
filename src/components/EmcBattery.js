import html from "./EmcBattery.html?raw";
import { formatTemp } from "../utils.js";

export class EmcBattery extends HTMLElement {
  async connectedCallback() {
    this.innerHTML = `${html}`;

    window.addEventListener(
      "emc-battery-value-changed",
      this.updateValue.bind(this),
    );
  }

  /**
   * @param {CustomEvent} ev
   */
  async updateValue(ev) {
    const { value, charging, batteryTemp } = ev.detail;

    if (typeof value !== "undefined") {
      this.setUiValueText(`${value} %`);
    }
    this.setUiChargingText(charging ? "(Charging)" : "");
    if (typeof batteryTemp !== "undefined") {
      this.setAttribute("battery-temp", formatTemp(batteryTemp));
    }
  }

  /* ---------------------------------------------------------------------------
   * UI
   * ------------------------------------------------------------------------ */

  /**
   * @returns {Element}
   */
  get valueEl() {
    return this.querySelector("#emc-battery-value");
  }

  /**
   * @returns {Element}
   */
  get chargingEl() {
    return this.querySelector("#emc-battery-charging-value");
  }

  setUiValueText(text) {
    this.valueEl.textContent = text;
  }

  setUiChargingText(text) {
    this.chargingEl.textContent = text;
  }
}

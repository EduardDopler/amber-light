import html from "./EmcTargetTemp.html?raw";
import { formatTemp } from "../utils.js";

export class EmcTargetTemp extends HTMLElement {
  async connectedCallback() {
    this.innerHTML = `${html}`;

    window.addEventListener(
      "emc-target-temp-value-changed",
      this.updateValue.bind(this),
    );
  }

  /**
   * @param {CustomEvent} ev
   */
  async updateValue(ev) {
    const text = formatTemp(ev.detail);
    this.setUiText(text);
  }

  /* ---------------------------------------------------------------------------
   * UI
   * ------------------------------------------------------------------------ */

  /**
   * @returns {Element}
   */
  get valueEl() {
    return this.querySelector("#emc-target-temp-value");
  }

  setUiText(text) {
    this.valueEl.textContent = text;
  }
}

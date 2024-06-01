import html from "./EmcLiquidLevel.html?raw";
import { ValueMapping } from "../ValueMapping.js";

export class EmcLiquidLevel extends HTMLElement {
  async connectedCallback() {
    this.innerHTML = `${html}`;

    window.addEventListener(
      "emc-liquid-level-value-changed",
      this.updateValue.bind(this),
    );
  }

  /**
   * @param {CustomEvent} ev
   */
  async updateValue(ev) {
    const numericValue = ev.detail;
    const text =
      ValueMapping.LiquidLevel[numericValue] ?? `Unknown (${numericValue})`;
    this.setUiText(text);
  }

  /* ---------------------------------------------------------------------------
   * UI
   * ------------------------------------------------------------------------ */

  /**
   * @returns {Element}
   */
  get valueEl() {
    return this.querySelector("#emc-liquid-level-value");
  }

  setUiText(text) {
    this.valueEl.textContent = text;
  }
}

import html from "./EmcLiquidState.html?raw";
import { ValueMapping } from "../ValueMapping.js";

export class EmcLiquidState extends HTMLElement {
  async connectedCallback() {
    this.innerHTML = `${html}`;

    window.addEventListener(
      "emc-liquid-state-value-changed",
      this.updateValue.bind(this),
    );
  }

  /**
   * @param {CustomEvent} ev
   */
  async updateValue(ev) {
    const numericValue = ev.detail;
    const text =
      ValueMapping.LiquidState[numericValue] ?? `Unknown (${numericValue})`;
    this.setUiText(text);
  }

  /* ---------------------------------------------------------------------------
   * UI
   * ------------------------------------------------------------------------ */

  /**
   * @returns {Element}
   */
  get valueEl() {
    return this.querySelector("#emc-liquid-state-value");
  }

  setUiText(text) {
    this.valueEl.textContent = text;
  }
}

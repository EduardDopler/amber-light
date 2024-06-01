import html from "./EmcColor.html?raw";

export class EmcColor extends HTMLElement {
  async connectedCallback() {
    this.innerHTML = `${html}`;

    window.addEventListener(
      "emc-color-value-changed",
      this.updateValue.bind(this),
    );
  }

  /**
   * @param {CustomEvent} ev
   */
  async updateValue(ev) {
    this.setUiColor(ev.detail);
  }

  /* ---------------------------------------------------------------------------
   * UI
   * ------------------------------------------------------------------------ */

  /**
   * @returns {Element}
   */
  get valueEl() {
    return this.querySelector("#emc-color-value");
  }

  setUiColor({ r, g, b, a }) {
    this.valueEl.style = `--c-mug-color-value: rgba(${r}, ${g}, ${b}, ${a})`;
  }
}

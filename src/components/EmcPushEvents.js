import html from "./EmcPushEvents.html?raw";
import { pushEvents as pushEventsUuid } from "../uuids.json";
import { EventMapping } from "../EventMapping.js";

export class EmcPushEvents extends HTMLElement {
  /** @type {boolean} */
  static isConnected = false;
  /** @type {BluetoothRemoteGATTCharacteristic|null} */
  static characteristic = null;

  get buttonEl() {
    return this.querySelector("#emc-push-events-read-all");
  }
  get checkboxEl() {
    return this.querySelector("#emc-push-events-enabled");
  }

  async connectedCallback() {
    this.innerHTML = `${html}`;

    window.addEventListener("emc-connected", this.onConnected.bind(this));
    window.addEventListener("emc-disconnected", this.onDisconnected.bind(this));
    this.buttonEl.addEventListener("click", this.forceUpdateValues.bind(this));
    this.checkboxEl.addEventListener(
      "change",
      this.onCheckboxChange.bind(this),
    );
  }

  async onCheckboxChange(ev) {
    if (ev.target.checked) {
      await this.registerListener();
      // immediately update all values
      this.forceUpdateValues();
    } else {
      await this.unregisterListener();
    }
  }

  forceUpdateValues() {
    const eventName = "emc-force-update-values";
    const event = new CustomEvent(eventName, { bubbles: true });
    window.dispatchEvent(event);
  }

  async registerListener() {
    if (!this.constructor.isConnected) return;

    this.setCheckbox({ enabled: false });
    await this.constructor.characteristic.startNotifications();
    this.constructor.characteristic.addEventListener(
      "characteristicvaluechanged",
      this.onPushEvent,
    );
    this.setCheckbox({ enabled: true });
    console.log("Listener registered");
  }

  async unregisterListener() {
    if (!this.constructor.characteristic) return;

    this.setCheckbox({ enabled: false });
    await this.constructor.characteristic.stopNotifications();
    this.constructor.characteristic.removeEventListener(
      "characteristicvaluechanged",
      this.onPushEvent,
    );
    this.setCheckbox({ enabled: true });
    console.log("Listener unregistered");
  }

  async onConnected(ev) {
    this.constructor.characteristic =
      await ev.detail.service.getCharacteristic(pushEventsUuid);
    this.constructor.isConnected = true;
    this.setReadButton(true);
    this.setCheckbox({ checked: true, enabled: true });
    await this.registerListener();
  }

  async onDisconnected() {
    this.constructor.characteristic = null;
    this.constructor.isConnected = false;
    this.setReadButton(false);
    this.setCheckbox({ checked: false, enabled: false });
    await this.unregisterListener();
  }

  async onPushEvent(ev) {
    const rawValue = ev.target.value;
    const numericValue = rawValue.getUint8(0);
    const mappedEvent = EventMapping[numericValue];
    const eventName = `emc-${mappedEvent}-value-changed`;
    console.debug(
      `Event "${mappedEvent}" (0x0${numericValue}) received, firing internal event "${eventName}"`,
    );
    const event = new CustomEvent(eventName, { bubbles: true });
    window.dispatchEvent(event);
  }

  setReadButton(enabled) {
    const el = this.buttonEl;
    el.disabled = !enabled;
  }

  setCheckbox({ checked, enabled }) {
    const el = this.checkboxEl;
    if (typeof checked !== "undefined") {
      el.checked = checked;
    }
    if (typeof enabled !== "undefined") {
      el.disabled = !enabled;
    }
  }
}

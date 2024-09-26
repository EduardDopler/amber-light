import html from "./EmcNotifications.html?raw";
import { NotificationSettings } from "../NotificationSettings.js";
import { NotificationType } from "../NotificationType.js";

export class EmcNotifications extends HTMLElement {
  static localStorageKeyNotiesEnabled = "notifications-enabled";

  static enabled = false;
  static lastBatteryValue = 100;
  static lastLiquidStateValue = 0;

  async connectedCallback() {
    this.innerHTML = `${html}`;

    this.restoreLastState();
    this.initValueListeners();
    this.initUiListeners();
  }

  initValueListeners() {
    window.addEventListener(
      "emc-battery-value-changed",
      this.checkBatteryValue.bind(this),
    );

    window.addEventListener(
      "emc-liquid-state-value-changed",
      this.checkCurrentLiquidStateValue.bind(this),
    );
  }

  /**
   * @param {CustomEvent} ev
   */
  async checkBatteryValue(ev) {
    if (!this.constructor.enabled) {
      return;
    }

    const { value } = ev.detail;
    const lastValue = this.constructor.lastBatteryValue;
    // show only if last value was not in range to prevent duplicate notifications
    if (
      value <= NotificationSettings.BatteryVeryLowValue &&
      lastValue > NotificationSettings.BatteryVeryLowValue
    ) {
      this.showNotification(NotificationType.BatteryVeryLow, value);
    } else if (
      value <= NotificationSettings.BatteryLowValue &&
      lastValue > NotificationSettings.BatteryLowValue
    ) {
      this.showNotification(NotificationType.BatteryLow, value);
    } else if (
      value >= NotificationSettings.BatteryFullValue &&
      lastValue > NotificationSettings.BatteryFullValue
    ) {
      this.showNotification(NotificationType.BatteryFull, value);
    }
    this.constructor.lastBatteryValue = value;
  }

  /**
   * @param {CustomEvent} ev
   */
  async checkCurrentLiquidStateValue(ev) {
    if (!this.constructor.enabled) {
      return;
    }

    const value = ev.detail;
    const lastValue = this.constructor.lastLiquidStateValue;
    // show only if last value was not in range to prevent duplicate notifications
    // LiquidState 6 === Stable Temperature
    if (value === 6 && lastValue !== 6) {
      this.showNotification(NotificationType.StableTemperature);
    }
    this.constructor.lastLiquidStateValue = value;
  }

  /* ---------------------------------------------------------------------------
   * Notifications API
   * ------------------------------------------------------------------------ */

  restoreLastState() {
    const localStorageKey = this.constructor.localStorageKeyNotiesEnabled;

    // check support and permission first
    let checkboxState = { checked: false, enabled: false };
    if (!("Notification" in window)) {
      // unsupported
      checkboxState.suffix = "not supported";
    } else if (Notification.permission === "denied") {
      // denied
      checkboxState.suffix = "permission denied";
    } else if (Notification.permission === "granted") {
      // granted
      // restore checkbox state
      const wasEnabledBefore = localStorage.getItem(localStorageKey) === "true";
      if (wasEnabledBefore) {
        checkboxState = { checked: true, enabled: true };
      } else {
        checkboxState = { checked: false, enabled: true };
      }
    } else {
      checkboxState.enabled = true;
    }

    // set internal state
    this.constructor.enabled = checkboxState.checked;

    // if it's not checked now, remove localStorage entry,
    // just to be sure the state matches
    if (!checkboxState.checked) {
      localStorage.removeItem(localStorageKey);
    }

    this.setNotificationsCheckbox(checkboxState);
  }

  async enableNotifications() {
    if (Notification.permission === "denied") {
      this.setNotificationsCheckbox({
        checked: false,
        enabled: false,
        suffix: "permission denied",
      });
      return;
    }

    if (Notification.permission !== "granted") {
      const requestResult = await Notification.requestPermission();
      if (requestResult !== "granted") {
        this.setNotificationsCheckbox({
          checked: false,
          enabled: false,
          suffix: "permission denied",
        });
        return;
      }
    }

    const localStorageKey = this.constructor.localStorageKeyNotiesEnabled;
    localStorage.setItem(localStorageKey, "true");
    this.constructor.enabled = true;
    console.log("Notifications enabled");
  }

  disableNotifications() {
    const localStorageKey = this.constructor.localStorageKeyNotiesEnabled;
    localStorage.removeItem(localStorageKey);
    this.constructor.enabled = false;
    console.log("Notifications disabled");
  }

  /**
   * @param {NotificationType} type
   * @param {number} value
   */
  showNotification(type, value) {
    new Notification("ember mug control", {
      body: value ? `${type.text}: ${value}%` : type.text,
      tag: type.tag,
      renotify: true,
      icon: `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>${type.icon}</text></svg>`,
    });
  }

  /* ---------------------------------------------------------------------------
   * UI
   * ------------------------------------------------------------------------ */

  get notificationsCheckboxEl() {
    return this.querySelector("#emc-notifications-enabled");
  }
  get notificationsTextSuffixEl() {
    return this.querySelector("#emc-notifications-suffix");
  }

  initUiListeners() {
    this.notificationsCheckboxEl.addEventListener(
      "change",
      this.onChangeNotificationsCheckbox.bind(this),
    );
  }

  /**
   * @param {Event} ev
   */
  async onChangeNotificationsCheckbox(ev) {
    if (ev.target.checked) {
      await this.enableNotifications();
    } else {
      await this.disableNotifications();
    }
  }

  /**
   * @param {boolean} [checked]
   * @param {boolean} [enabled]
   * @param {string} [suffix]
   */
  setNotificationsCheckbox({ checked, enabled, suffix }) {
    const elCheckbox = this.notificationsCheckboxEl;
    const elTextSuffix = this.notificationsTextSuffixEl;
    if (typeof checked !== "undefined") {
      elCheckbox.checked = checked;
      // manually trigger change event so the checkbox listener logic can run
      elCheckbox.dispatchEvent(new Event("change"));
    }
    if (typeof enabled !== "undefined") {
      elCheckbox.disabled = !enabled;
    }
    if (typeof suffix !== "undefined") {
      elTextSuffix.innerHTML = `(${suffix})`;
    } else {
      elTextSuffix.innerHTML = "";
    }
  }
}

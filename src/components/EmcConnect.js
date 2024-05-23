import html from "./EmcConnect.html?raw";
import { service as serviceUuid } from "../uuids.json";
import { ConnectionStatus } from "../ConnectionStatus.js";
import { isBluetoothAvailable, isChromiumBrowser } from "../utils.js";

export class EmcConnect extends HTMLElement {
  static observedAttributes = ["status"];

  /** @type {boolean} */
  static isConnected = false;
  /** @type {BluetoothRemoteGATTService|null} */
  static service = null;
  /** @type {boolean} */
  static disconnectRequested = false;

  async connectedCallback() {
    this.innerHTML = `${html}`;

    this.setStatus(ConnectionStatus.Disconnected);

    if (!(await isBluetoothAvailable())) {
      console.error("Bluetooth not available");
      if (!isChromiumBrowser()) {
        console.warn("Bluetooth is only supported on Chromium browsers");
      }
      this.setButton({ text: "Bluetooth not available", enabled: false });
      return;
    }

    this.addEventListener("click", this.onClick);

    await this.tryReconnectToKnownDevices();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    // ignore initial change
    if (!oldValue) return;

    if (name === "status") {
      this.onStatusAttributeChanged(oldValue, newValue);
    }
  }

  async onClick() {
    if (this.constructor.isConnected) {
      this.disconnect();
    } else {
      await this.requestDevice();
    }
  }

  disconnect() {
    this.constructor.service = null;
    this.constructor.disconnectRequested = true;
    this.constructor.service?.device.gatt.disconnect();
    this.setStatus(ConnectionStatus.Disconnected);
    this.constructor.isConnected = false;
  }

  async requestDevice() {
    this.setStatus(ConnectionStatus.RequestingDevice);
    const options = { filters: [{ services: [serviceUuid] }] };
    try {
      const device = await navigator.bluetooth.requestDevice(options);
      await this.connect(device);
    } catch (e) {
      this.setStatus(ConnectionStatus.Error);
      console.error(e);
    }
  }

  async connect(device) {
    this.setStatus(ConnectionStatus.Connecting);
    try {
      const server = await device.gatt.connect();

      device.addEventListener("gattserverdisconnected", (ev) =>
        this.onGattServerDisconnected(ev),
      );

      this.constructor.service = await server.getPrimaryService(serviceUuid);
      this.constructor.isConnected = true;
      this.setStatus(ConnectionStatus.Connected);
    } catch (e) {
      this.setStatus(ConnectionStatus.Error);
      device.gatt.disconnect();
      this.constructor.service = null;
      this.constructor.isConnected = false;
      console.error(e);
    }
  }

  async tryReconnectToKnownDevices() {
    const knownDevices = await navigator.bluetooth.getDevices();
    // no previously known devices -> cancel
    if (!knownDevices.length) {
      console.log("No known devices yet, try actively connecting to one.");
      return;
    }

    for (const device of knownDevices) {
      console.log(
        `Waiting for previously known device "${device.name}" to appear…`,
      );
      const abortController = new AbortController();
      const signal = abortController.signal;
      try {
        await device.watchAdvertisements({ signal });
      } catch (e) {
        console.warn(
          "Cannot watch for device advertisements; try actively connecting to a device.",
          e,
        );
        return;
      }
      device.addEventListener(
        "advertisementreceived",
        (e) => this.onAdvertisementReceived(e, abortController),
        { once: true },
      );
    }
  }

  async onAdvertisementReceived(ev, abortController) {
    console.log(`Advertisement received from "${ev.device.name}"; connecting…`);
    // stop watching immediately first
    abortController.abort();
    await this.connect(ev.device);
  }

  async onGattServerDisconnected(ev) {
    // if disconnect was actively triggered, don't try to reconnect
    if (this.constructor.disconnectRequested) {
      this.constructor.disconnectRequested = false;
      return;
    }

    console.error("Connection lost", ev);
    this.constructor.isConnected = false;
    this.setStatus(ConnectionStatus.Error);
    await this.tryReconnectToKnownDevices();
  }

  setStatus(statusString) {
    this.setAttribute("status", statusString);

    // broadcast status
    const eventName = `emc-${statusString}`;
    const eventDetail = { service: this.constructor.service };
    const event = new CustomEvent(eventName, {
      bubbles: true,
      detail: eventDetail,
    });
    this.dispatchEvent(event);
  }

  setButton({ text, enabled = true }) {
    const button = this.querySelector("button");
    button.textContent = text;
    button.disabled = !enabled;
  }

  onStatusAttributeChanged(oldValue, newValue) {
    console.log(`Connection status changed: ${oldValue} -> ${newValue}`);

    switch (newValue) {
      case ConnectionStatus.Unknown:
      case ConnectionStatus.Disconnected:
        this.setButton({ text: "Connect", enabled: true });
        break;
      case ConnectionStatus.Connecting:
      case ConnectionStatus.RequestingDevice:
        this.setButton({ text: "Connecting...", enabled: false });
        break;
      case ConnectionStatus.Connected:
        this.setButton({ text: "Disconnect", enabled: true });
        break;
      case ConnectionStatus.Error:
        this.setButton({ text: "Retry", enabled: true });
    }
  }
}

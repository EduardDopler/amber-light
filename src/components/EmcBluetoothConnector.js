import html from "./EmcBluetoothConnector.html?raw";
import {
  battery as batteryUuid,
  color as colorUuid,
  currentTemp as currentTempUuid,
  liquidLevel as liquidLevelUuid,
  liquidState as liquidStateUuid,
  pushEvents as pushEventsUuid,
  service as serviceUuid,
  targetTemp as targetTempUuid,
} from "../uuids.json";
import { ConnectionStatus } from "../ConnectionStatus.js";
import { isBluetoothAvailable, isChromiumBrowser } from "../utils.js";
import {
  BatteryEvent,
  PushEvent,
  PushEventMapping,
  ValueType,
} from "../PushEventMapping.js";

export class EmcBluetoothConnector extends HTMLElement {
  /** @type {BluetoothRemoteGATTService|null} */
  static service = null;

  static characteristics = {
    /** @type {BluetoothRemoteGATTCharacteristic|null} */
    battery: null,
    /** @type {BluetoothRemoteGATTCharacteristic|null} */
    targetTemp: null,
    /** @type {BluetoothRemoteGATTCharacteristic|null} */
    currentTemp: null,
    /** @type {BluetoothRemoteGATTCharacteristic|null} */
    liquidLevel: null,
    /** @type {BluetoothRemoteGATTCharacteristic|null} */
    liquidState: null,
    /** @type {BluetoothRemoteGATTCharacteristic|null} */
    color: null,
  };

  /** @type {boolean} */
  static disconnectRequested = false;

  static listenerCallback = null;

  async connectedCallback() {
    this.innerHTML = `${html}`;

    this.setConnectionStatus(ConnectionStatus.Disconnected);

    if (!(await isBluetoothAvailable())) {
      console.error("Bluetooth not available");
      if (!isChromiumBrowser()) {
        console.warn("Bluetooth is only supported on Chromium browsers");
      }
      this.setConnectButton({
        text: "Bluetooth not available",
        enabled: false,
      });
      return;
    }

    this.initUiListeners();
    await this.tryReconnectToKnownDevices();
  }

  /* ---------------------------------------------------------------------------
   * Connection
   * ------------------------------------------------------------------------ */

  async tryReconnectToKnownDevices() {
    // TODO check if getDevices is available, if not: explain Chromium flag
    if (!(await navigator.bluetooth.getDevices)) return;

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

  disconnect() {
    this.constructor.service = null;
    this.constructor.disconnectRequested = true;
    this.constructor.service?.device.gatt.disconnect();
    this.setConnectionStatus(ConnectionStatus.Disconnected);
  }

  /**
   * @param {BluetoothDevice} device
   */
  async connect(device) {
    this.setConnectionStatus(ConnectionStatus.Connecting);
    try {
      const server = await device.gatt.connect();

      device.addEventListener("gattserverdisconnected", (ev) =>
        this.onGattServerDisconnected(ev),
      );

      await this.setServiceAndCharacteristics(server);
      this.constructor.characteristicBattery =
        await this.constructor.service.getCharacteristic(batteryUuid);
      this.setConnectionStatus(ConnectionStatus.Connected);
    } catch (e) {
      this.setConnectionStatus(ConnectionStatus.Error);
      // prevent automatic reconnect attempt
      this.constructor.disconnectRequested = true;
      device.gatt.disconnect();
      this.constructor.service = null;
      console.error(e);
    }
  }

  async requestDevice() {
    this.setConnectionStatus(ConnectionStatus.RequestingDevice);
    const options = { filters: [{ services: [serviceUuid] }] };
    try {
      const device = await navigator.bluetooth.requestDevice(options);
      await this.connect(device);
    } catch (e) {
      this.setConnectionStatus(ConnectionStatus.Error);
      console.error(e);
    }
  }

  /**
   * @param {Event} ev
   */
  async onGattServerDisconnected(ev) {
    await this.setServiceAndCharacteristics(null);

    // if disconnect was actively triggered, don't try to reconnect
    if (this.constructor.disconnectRequested) {
      this.constructor.disconnectRequested = false;
      return;
    }

    console.error("Connection lost", ev);
    this.setConnectionStatus(ConnectionStatus.Error);
    await this.tryReconnectToKnownDevices();
  }

  /**
   * @param {BluetoothAdvertisingEvent} ev
   * @param {AbortController} abortController
   */
  async onAdvertisementReceived(ev, abortController) {
    console.log(`Advertisement received from "${ev.device.name}"; connecting…`);
    // stop watching immediately first
    abortController.abort();
    await this.connect(ev.device);
  }

  /**
   * @param {BluetoothRemoteGATTServer|null} server
   */
  async setServiceAndCharacteristics(server) {
    const service = server ? await server.getPrimaryService(serviceUuid) : null;
    this.constructor.service = service || null;
    this.constructor.characteristics.battery =
      (await service?.getCharacteristic(batteryUuid)) || null;
    this.constructor.characteristics.targetTemp =
      (await service?.getCharacteristic(targetTempUuid)) || null;
    this.constructor.characteristics.currentTemp =
      (await service?.getCharacteristic(currentTempUuid)) || null;
    this.constructor.characteristics.liquidLevel =
      (await service?.getCharacteristic(liquidLevelUuid)) || null;
    this.constructor.characteristics.liquidState =
      (await service?.getCharacteristic(liquidStateUuid)) || null;
    this.constructor.characteristics.color =
      (await service?.getCharacteristic(colorUuid)) || null;
  }

  /**
   * @param {ConnectionStatus} status
   */
  setConnectionStatus(status) {
    console.log(`Connection status changed to: ${status}`);
    this.setAttribute("status", status.toString());
    document.body.dataset.connection = status.toString();

    // update own UI elements
    this.updateUiStatus(status);
    // broadcast status
    const eventName = "emc-connection-status-changed";
    const isConnected = status === ConnectionStatus.Connected;
    const eventDetail = { service: this.constructor.service, isConnected };
    const event = new CustomEvent(eventName, {
      bubbles: true,
      detail: eventDetail,
    });
    this.dispatchEvent(event);
  }

  /* ---------------------------------------------------------------------------
   * Push events/notifications
   * ------------------------------------------------------------------------ */

  async registerPushListener() {
    const characteristic =
      await this.constructor.service.getCharacteristic(pushEventsUuid);
    if (!characteristic) return;

    this.setReadCheckbox({ enabled: false });
    await characteristic.startNotifications();
    this.constructor.listenerCallback = this.onPushEvent.bind(this);
    characteristic.addEventListener(
      "characteristicvaluechanged",
      this.constructor.listenerCallback,
    );
    this.setReadCheckbox({ enabled: true });
    console.log("Event listener registered");
  }

  async unregisterPushListener() {
    const characteristic =
      await this.constructor.service?.getCharacteristic(pushEventsUuid);
    if (!characteristic) return;

    this.setReadCheckbox({ enabled: false });
    await characteristic.stopNotifications();
    characteristic.removeEventListener(
      "characteristicvaluechanged",
      this.constructor.listenerCallback,
    );
    this.setReadCheckbox({ enabled: true });
    console.log("Event listener unregistered");
  }

  /**
   * @param {Event} ev
   */
  async onPushEvent(ev) {
    const rawValue = ev.target.value;
    const numericValue = rawValue.getUint8(0);
    const [eventName, eventDetails] = PushEventMapping[numericValue];
    console.debug(
      `Event "${eventName}${eventDetails ? " " + eventDetails : ""}" (0x0${numericValue}) received`,
    );
    await this.evalPushEvent(eventName, eventDetails);
  }

  /**
   * @param {string} eventName
   * @param {string} [eventDetails]
   */
  async evalPushEvent(eventName, eventDetails) {
    // shortcut battery charging state change
    if (eventDetails && eventName === PushEvent.Battery) {
      this.onReadValueChanged(PushEvent.Battery, {
        charging: eventDetails === BatteryEvent.Charging,
      });
      return;
    }
    // other events
    await this.readValue(eventName);
  }

  /* ---------------------------------------------------------------------------
   * Read values
   * ------------------------------------------------------------------------ */

  async readAllValues() {
    const eventNames = Object.values(ValueType);
    for (const eventName of eventNames) {
      await this.readValue(eventName);
      // delay a bit, so the BT channel has time to breath
      // TODO maybe run readValue inside setTimeout instead
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }

  /**
   * @param {string} characteristicName
   */
  async readValue(characteristicName) {
    let value;
    if (characteristicName === ValueType.Battery) {
      const characteristic = await this.constructor.characteristics.battery;
      const rawValue = await characteristic.readValue();
      value = {
        value: rawValue.getUint8(0),
        charging: Boolean(rawValue.getUint8(1)),
        batteryTemp: rawValue.getUint16(2, true),
      };
    } else if (characteristicName === ValueType.TargetTemp) {
      const characteristic = await this.constructor.characteristics.targetTemp;
      const rawValue = await characteristic.readValue();
      value = rawValue.getUint16(0, true);
    } else if (characteristicName === ValueType.CurrentTemp) {
      const characteristic = await this.constructor.characteristics.currentTemp;
      const rawValue = await characteristic.readValue();
      value = rawValue.getUint16(0, true);
    } else if (characteristicName === ValueType.LiquidLevel) {
      const characteristic = await this.constructor.characteristics.liquidLevel;
      const rawValue = await characteristic.readValue();
      value = rawValue.getUint8(0);
    } else if (characteristicName === ValueType.LiquidState) {
      const characteristic = await this.constructor.characteristics.liquidState;
      const rawValue = await characteristic.readValue();
      value = rawValue.getUint8(0);
    } else if (characteristicName === ValueType.Color) {
      const characteristic = await this.constructor.characteristics.color;
      const rawValue = await characteristic.readValue();
      value = {
        r: rawValue.getUint8(0),
        g: rawValue.getUint8(1),
        b: rawValue.getUint8(2),
        a: rawValue.getUint8(3),
      };
    }
    this.onReadValueChanged(characteristicName, value);
  }

  /**
   * @param {string} characteristicName
   * @param {any} value
   */
  onReadValueChanged(characteristicName, value) {
    const eventName = `emc-${characteristicName}-value-changed`;
    const event = new CustomEvent(eventName, { bubbles: true, detail: value });
    this.dispatchEvent(event);
  }

  /* ---------------------------------------------------------------------------
   * UI
   * ------------------------------------------------------------------------ */

  get connectButtonEl() {
    return this.querySelector("#emc-connect");
  }
  get readButtonEl() {
    return this.querySelector("#emc-push-events-read-all");
  }
  get readCheckboxEl() {
    return this.querySelector("#emc-push-events-enabled");
  }

  initUiListeners() {
    this.connectButtonEl.addEventListener(
      "click",
      this.onClickConnectButton.bind(this),
    );
    this.readButtonEl.addEventListener(
      "click",
      this.onClickReadButton.bind(this),
    );
    this.readCheckboxEl.addEventListener(
      "change",
      this.onChangeReadCheckbox.bind(this),
    );
  }

  /**
   * @param {ConnectionStatus} status
   */
  updateUiStatus(status) {
    switch (status) {
      case ConnectionStatus.Unknown:
      case ConnectionStatus.Disconnected:
        this.setConnectButton({ text: "Connect", enabled: true });
        this.setReadButton({ enabled: false });
        this.setReadCheckbox({ enabled: false });
        break;
      case ConnectionStatus.Connecting:
      case ConnectionStatus.RequestingDevice:
        this.setConnectButton({ text: "Connecting...", enabled: false });
        this.setReadButton({ enabled: false });
        this.setReadCheckbox({ enabled: false });
        break;
      case ConnectionStatus.Connected:
        this.setConnectButton({ text: "Disconnect", enabled: true });
        this.setReadButton({ enabled: true });
        this.setReadCheckbox({ checked: true, enabled: true });
        break;
      case ConnectionStatus.Error:
        this.setConnectButton({ text: "Retry", enabled: true });
        this.setReadButton({ enabled: false });
        this.setReadCheckbox({ checked: false, enabled: false });
        return;
      default:
        console.warn(`Unknown connection status "${status}"`);
    }
  }

  async onClickConnectButton() {
    const isConnected =
      this.getAttribute("status") === ConnectionStatus.Connected;
    if (isConnected) {
      this.disconnect();
    } else {
      await this.requestDevice();
    }
  }

  async onClickReadButton() {
    await this.readAllValues();
  }

  /**
   * @param {Event} ev
   */
  async onChangeReadCheckbox(ev) {
    if (ev.target.checked) {
      await this.registerPushListener();
      // immediately update all values
      await this.readAllValues();
    } else {
      await this.unregisterPushListener();
    }
  }

  /**
   * @param {string} text
   * @param {boolean} enabled
   */
  setConnectButton({ text, enabled = true }) {
    const button = this.connectButtonEl;
    button.textContent = text;
    button.disabled = !enabled;
  }

  /**
   * @param {boolean} enabled
   */
  setReadButton({ enabled }) {
    this.readButtonEl.disabled = !enabled;
  }

  /**
   * @param {boolean} [checked]
   * @param {boolean} [enabled]
   */
  setReadCheckbox({ checked, enabled }) {
    const el = this.readCheckboxEl;
    if (typeof checked !== "undefined") {
      el.checked = checked;
      // manually trigger change event so the checkbox listener logic can run
      el.dispatchEvent(new Event("change"));
    }
    if (typeof enabled !== "undefined") {
      el.disabled = !enabled;
    }
  }
}

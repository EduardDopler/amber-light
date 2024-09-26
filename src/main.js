import "./style.css";
import { EmcBluetoothConnector } from "./components/EmcBluetoothConnector.js";
import { EmcNotifications } from "./components/EmcNotifications.js";
import { EmcBattery } from "./components/EmcBattery.js";
import { EmcCurrentTemp } from "./components/EmcCurrentTemp.js";
import { EmcTargetTemp } from "./components/EmcTargetTemp.js";
import { EmcLiquidState } from "./components/EmcLiquidState.js";
import { EmcLiquidLevel } from "./components/EmcLiquidLevel.js";
import { EmcColor } from "./components/EmcColor.js";

customElements.define("emc-bluetooth-connector", EmcBluetoothConnector);
customElements.define("emc-notifications", EmcNotifications);
customElements.define("emc-battery", EmcBattery);
customElements.define("emc-current-temp", EmcCurrentTemp);
customElements.define("emc-target-temp", EmcTargetTemp);
customElements.define("emc-liquid-state", EmcLiquidState);
customElements.define("emc-liquid-level", EmcLiquidLevel);
customElements.define("emc-color", EmcColor);

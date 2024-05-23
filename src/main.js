import "./style.css";
import { EmcConnect } from "./components/EmcConnect";
import { EmcBattery } from "./components/EmcBattery.js";
import { EmcCurrentTemp } from "./components/EmcCurrentTemp.js";
import { EmcTargetTemp } from "./components/EmcTargetTemp.js";
import { EmcLiquidLevel } from "./components/EmcLiquidLevel.js";
import { EmcLiquidState } from "./components/EmcLiquidState.js";
import { EmcPushEvents } from "./components/EmcPushEvents.js";
import { EmcColor } from "./components/EmcColor.js";

customElements.define("emc-connect", EmcConnect);
customElements.define("emc-push-events", EmcPushEvents);
customElements.define("emc-battery", EmcBattery);
customElements.define("emc-current-temp", EmcCurrentTemp);
customElements.define("emc-target-temp", EmcTargetTemp);
customElements.define("emc-liquid-state", EmcLiquidState);
customElements.define("emc-liquid-level", EmcLiquidLevel);
customElements.define("emc-color", EmcColor);

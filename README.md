# ☕️ amber-light

Web-based dashboard and controls for the [Ember Mug²](https://google.com/search?q=ember.com+mug)

---

## See it in action

🔗 https://EduardDopler.github.io/amber-light/

## Browser support

Chromium-based browsers are the only browsers supporting the [Bluetooth API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API), which is kind of essential for a bluetooth connection.

Tested with Google Chrome 124+.

Bluetooth API is only available in secure contexts (HTTPS). I use [Caddy](https://caddyserver.com/) locally.

### Persistent connection

Chrome has experimental support for persistent bluetooth connections. This way, the browser is able to access devices it connected to in the past without querying permission again after every browser restart.

Enable it via this Chrome flag: `chrome://flags/#enable-web-bluetooth-new-permissions-backend`

And vote for this feature [here](https://issues.chromium.org/issues/40632400) and [here](https://issues.chromium.org/issues/40452449).

## Reconnection issues

In general, the mug struggles with reconnecting itself to a previous bluetooth host. Sometimes we can observe bluetooth beacons (advertisements) being sent but the connection still fails, or just takes a long time. As the same happens with the native Ember app, it is probably safe to assume this cannot be fixed by software.

If you run into this, press and hold the mug's power button until the LED flashes blue to initiate a new connection.

If the LED still flashes after successfully connecting, just press the button again to return to normal operation mode.

## Log/Debug

See your browser's console for connection info, warnings errors.

## Roadmap

- Setting target temperature, unit (°C/°F), mug color and mug name
- Notifications
  - Connection status
  - Target temp reached
  - Battery low/full
- Styling
- Offline support/PWA

## Motivation

I love good coffee. Among other things, it has to have the perfect temperature. In theory, the Ember mug is a good temperature-controlled mug, doing its job. At this price point you would expect a company to build a decent, reliable app that also doesn't collect a ton of your personal and device data. Disappointed in all aspects, I built this minimal alternative.

Main goals:
- Fast
- Simple
- No thrills
- No data collection

## Technologies
- The Web™️ (Web Bluetooth API)
- No runtime dependencies/libraries, only plain: HTML, CSS, JS
- Web components/custom elements (Light DOM)
- Dev dependencies: [Vite](https://vitejs.dev/), [Prettier](https://prettier.io/), [ESLint](https://eslint.org/), [Caddy](https://caddyserver.com/)

## Special thanks

- Paul Orlob: https://github.com/orlopau/ember-mug
  - For reverse engineering the UUIDs and the meaning of values transmitted by the mug and the app 

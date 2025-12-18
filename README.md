# Soul:23 coming soon page

A responsive landing page built with Bootstrap 4 that displays a countdown and a notification form.

## Local Installation

```bash
npm install
npm start
```

The Express server serves all assets from the root and exposes a `/healthchecker` endpoint with the health script as `text/plain`, ready for operators to download with `curl`.

## Countdown and Form

The time component reads the `data-date` attribute in `#countdown-timer`. Change it to any valid date:

```html
<div id="countdown-timer" data-date="January 17, 2025 03:24:00">
```

If you prefer to program it with JavaScript, reassign the `countDownDate` variable inside `js/countdown.js` before the interval starts.

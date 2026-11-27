# WhatsApp Customer Desk — Unofficial

A small opt-in customer messaging dashboard using a WhatsApp Web session through Baileys. This is **not** the official WhatsApp Business API and is not affiliated with Meta.

## Important risks
- Unofficial automation may violate WhatsApp's terms and can lead to temporary or permanent account restrictions.
- Use only with people who explicitly agreed to receive messages. Honor opt-outs immediately. Do not use for unsolicited bulk messaging.
- Use a separate business number, not your personal WhatsApp number. Never share the QR code or `auth_info` folder.
- This starter has a small per-batch cap and an 8-second interval, but these measures do not guarantee account safety.

## Run on Windows / Linux
1. Install Node.js 20 or newer.
2. Copy `.env.example` to `.env` and set a strong `DASHBOARD_PASSWORD`.
3. In this folder run `npm install` then `npm start`.
4. Open `http://localhost:3000` and enter the dashboard password.
5. In WhatsApp on the phone: Settings / Linked devices / Link a device; scan the QR shown in the dashboard.
6. Import CSV with columns `phone,name,consent`. Use international numbers without spaces, e.g. `937XXXXXXXX`; `consent` must be `yes` or `true`.

## Hosting
This requires a persistent Node.js process and persistent storage for `auth_info`. Netlify Functions are not suitable for maintaining this WhatsApp Web session. Use a VPS or an always-on computer. Do not deploy publicly without HTTPS, a strong password, firewall restrictions, and persistent storage.

## Limitations
This is a starter, not a production CRM. It has no user accounts, encrypted database, opt-out management UI, delivery receipts, or webhook support. Add these before business-critical use. The QR/session can expire and require relinking.

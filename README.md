# WhatsApp Sender — Netlify + Official WhatsApp Cloud API

A small Persian RTL dashboard for sending approved WhatsApp template messages to contacts who have explicitly opted in.

## Features
- CSV import (`phone,name,consent`)
- Manual contact entry with an explicit consent checkbox
- Approved template message sending through Meta WhatsApp Cloud API
- Server-side credentials (never expose the access token in browser code)
- Basic pacing, stop control, and per-recipient result log

## Deploy
1. Create a Netlify site and deploy this folder (or connect its GitHub repository).
2. In Netlify Site configuration → Environment variables, add:
   - `WHATSAPP_TOKEN` — permanent/system-user access token from Meta
   - `WHATSAPP_PHONE_NUMBER_ID` — WhatsApp Business phone number ID
   - `WHATSAPP_API_VERSION` — optional, e.g. `v23.0`; use a version currently supported by Meta.
3. Redeploy after adding environment variables.
4. Create and get approval for a message template in WhatsApp Manager. Enter its exact name and language code in the dashboard.

## CSV format
```csv
phone,name,consent
93700111222,Ahmad,true
989121234567,Sara,yes
```
Phone numbers must be international digits only (country code, no plus sign). Only rows with `consent=true/yes/1` are imported.

## Important compliance notes
- Use only with people who explicitly agreed to receive WhatsApp messages from your business.
- Honor opt-outs immediately; this starter dashboard does not yet include a persistent suppression database or webhook-based STOP processing.
- Outside the customer-service window, use approved templates. Follow Meta's current messaging, quality, rate, and regional rules.
- Do not use this project for unsolicited bulk messaging, scraping numbers, or bypassing WhatsApp limits.
- This is an MVP starter, not a production CRM. Add authentication, a database-backed consent ledger, webhook verification, audit logs, and robust queue/retry handling before real customer campaigns.

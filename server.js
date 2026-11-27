require('dotenv').config();
const express = require('express');
const pino = require('pino');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));
const PORT = Number(process.env.PORT || 3000);
const PASSWORD = process.env.DASHBOARD_PASSWORD;
const AUTH_DIR = process.env.AUTH_DIR || './auth_info';
let sock = null, qrDataUrl = null, connected = false, statusText = 'در حال آماده‌سازی';
let sending = false;
const logs = [];
const addLog = (message, type='info') => { logs.unshift({ time: new Date().toISOString(), message, type }); if (logs.length > 200) logs.pop(); };

function auth(req, res, next) {
  if (!PASSWORD || req.headers['x-dashboard-password'] !== PASSWORD) return res.status(401).json({ error: 'رمز داشبورد نادرست است.' });
  next();
}

async function startWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  let version;
  try { ({ version } = await fetchLatestBaileysVersion()); } catch (_) {}
  sock = makeWASocket({ auth: state, version, logger: pino({ level: 'silent' }), printQRInTerminal: false, browser: ['Customer Desk', 'Chrome', '1.0.0'] });
  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
    if (qr) { qrDataUrl = await QRCode.toDataURL(qr); statusText = 'QR آماده است؛ از WhatsApp دستگاه اصلی اسکن کنید.'; addLog('QR تازه ساخته شد.'); }
    if (connection === 'open') { connected = true; qrDataUrl = null; statusText = 'وصل است'; addLog('اتصال WhatsApp برقرار شد.'); }
    if (connection === 'close') {
      connected = false;
      const code = lastDisconnect?.error?.output?.statusCode;
      statusText = 'اتصال قطع شد'; addLog('اتصال قطع شد؛ تلاش برای وصل مجدد.', 'warn');
      if (code !== DisconnectReason.loggedOut) setTimeout(startWhatsApp, 3000);
      else { statusText = 'از حساب خارج شده‌اید؛ پوشه auth_info را پاک و دوباره وصل کنید.'; addLog('نشست خارج شد.', 'error'); }
    }
  });
}

app.get('/api/status', auth, (req, res) => res.json({ connected, statusText, qrDataUrl, logs: logs.slice(0, 40), sending }));
app.post('/api/send', auth, async (req, res) => {
  if (!connected || !sock) return res.status(409).json({ error: 'اول WhatsApp را وصل کنید.' });
  if (sending) return res.status(409).json({ error: 'یک صف ارسال در حال اجرا است.' });
  const { contacts, message } = req.body || {};
  if (!Array.isArray(contacts) || !message || message.length > 3000) return res.status(400).json({ error: 'فهرست مخاطبین یا متن پیام معتبر نیست.' });
  const eligible = contacts.filter(c => c && c.consent === true && /^\+?[1-9]\d{7,14}$/.test(String(c.phone || '').replace(/[\s()-]/g, '')));
  if (!eligible.length) return res.status(400).json({ error: 'هیچ شماره معتبر با رضایت ثبت‌شده پیدا نشد.' });
  if (eligible.length > 30) return res.status(400).json({ error: 'در هر نوبت حداکثر ۳۰ مخاطب رضایت‌داده‌شده وارد کنید.' });
  sending = true;
  res.json({ accepted: eligible.length, message: 'صف ارسال آغاز شد؛ صفحه را باز نگه دارید.' });
  (async () => {
    for (const c of eligible) {
      const digits = String(c.phone).replace(/\D/g, '');
      try {
        const jid = `${digits}@s.whatsapp.net`;
        await sock.sendMessage(jid, { text: message });
        addLog(`ارسال شد: ${digits}`, 'success');
      } catch (e) { addLog(`ناموفق: ${digits} — ${e.message || 'خطا'}`, 'error'); }
      await new Promise(r => setTimeout(r, 8000));
    }
    sending = false; addLog('صف ارسال پایان یافت.');
  })().catch(e => { sending = false; addLog(`خطای صف: ${e.message}`, 'error'); });
});
app.post('/api/parse-csv', auth, (req, res) => {
  try {
    const { csv } = req.body || {};
    const rows = parse(String(csv || ''), { columns: true, skip_empty_lines: true, trim: true });
    const contacts = rows.map(r => ({ phone: r.phone || r.Phone || r.number || '', name: r.name || r.Name || '', consent: String(r.consent || r.Consent || '').toLowerCase() === 'yes' || String(r.consent || r.Consent || '').toLowerCase() === 'true' }));
    res.json({ contacts });
  } catch (e) { res.status(400).json({ error: 'CSV خوانده نشد: ' + e.message }); }
});
app.listen(PORT, () => { console.log(`Dashboard: http://localhost:${PORT}`); if (!PASSWORD) console.warn('WARNING: Set DASHBOARD_PASSWORD in .env before use.'); startWhatsApp().catch(e => { console.error(e); process.exit(1); }); });

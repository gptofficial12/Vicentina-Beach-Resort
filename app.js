'use strict';
const $ = id => document.getElementById(id);
const KEY = 'vicentina_staff_scans_v1';
let stream = null;
let detector = null;
let scanTimer = null;
let scanning = false;
let lastRaw = '';
let lastAt = 0;
let latestId = null;

const peso = n => '₱' + Number(n || 0).toLocaleString('en-PH');
function getRecords() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
      .filter(x => Date.now() - new Date(x.scannedAt || 0).getTime() < 24 * 60 * 60 * 1000);
  } catch { return []; }
}
function saveRecords(records) { localStorage.setItem(KEY, JSON.stringify(records)); }
function toast(message) {
  $('toast').textContent = message;
  $('toast').classList.add('show');
  setTimeout(() => $('toast').classList.remove('show'), 4000);
}
function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}
function decodePayload(raw) {
  let data;
  try { data = JSON.parse(raw); }
  catch { throw new Error('Hindi mabasa ang QR bilang booking JSON. Siguraduhing Vicentina Beach Resort QR Booking Pass ang ini-scan.'); }
  if (!data.bookingId || data.resort !== 'Vicentina Beach Resort' || !data.guest) {
    throw new Error('Hindi ito valid na Vicentina Beach Resort booking QR.');
  }
  return data;
}
function processQR(raw) {
  try {
    if (!raw) throw new Error('Walang QR data na nabasa. Subukang ilapit at patatagin ang QR sa frame.');
    const data = decodePayload(raw);
    const records = getRecords();
    const existing = records.find(row => row.bookingId === data.bookingId);
    if (existing) {
      existing.lastScannedAt = new Date().toISOString();
      saveRecords(records);
      latestId = existing.bookingId;
      render(); focusRecord(existing.bookingId);
      toast('Na-scan na dati ang booking. Ipinakita ang naka-save na record.');
      return;
    }
    const row = {
      ...data,
      scannedAt: new Date().toISOString(),
      paymentStatus: data.paymentStatus || 'PENDING VERIFICATION',
      bookingStatus: data.bookingStatus || 'REQUEST RECEIVED'
    };
    records.unshift(row);
    saveRecords(records);
    latestId = row.bookingId;
    render(); focusRecord(row.bookingId);
    toast('QR verified. Pansamantalang na-save ang booking sa browser na ito.');
  } catch (error) { toast(error.message || 'Hindi ma-verify ang QR code.'); }
}
function focusRecord(id) {
  const row = getRecords().find(item => item.bookingId === id);
  if (!row) return;
  $('focusCard').classList.remove('emptyfocus');
  $('focusCard').innerHTML = `<span class="eyebrow">LATEST SCAN · ${esc(row.bookingId)}</span><h3>${esc(row.guest)}</h3><span class="status ${row.paymentStatus === 'PAID' ? 'paid' : 'pending'}">${esc(row.paymentStatus)}</span><div class="focus-grid"><div class="focus-item">Mobile<b>${esc(row.mobile || 'Not provided')}</b></div><div class="focus-item">Email<b>${esc(row.email || 'Not provided')}</b></div><div class="focus-item">Accommodation<b>${esc(row.room || 'Not provided')}</b></div><div class="focus-item">Dates<b>${esc(row.checkIn || '—')} → ${esc(row.checkOut || '—')}</b></div><div class="focus-item">Guests / rooms<b>${esc(row.guests ?? '—')} guest(s) / ${esc(row.rooms ?? '—')} room(s)</b></div><div class="focus-item">Estimated total<b>${peso(row.total)}</b></div><div class="focus-item">Payment method<b>${esc(row.paymentMethod || 'Not provided')}</b></div><div class="focus-item">Booking status<b>${esc(row.bookingStatus || 'REQUEST RECEIVED')}</b></div><div class="focus-item">Scanned at<b>${new Date(row.scannedAt).toLocaleString()}</b></div></div><p>Payment must be checked separately. Choosing GCash or Palawan Pay is not proof of payment. For Over the Counter, mark paid only after staff receives payment.</p>`;
}
function render() {
  const all = getRecords();
  const paidRows = all.filter(row => row.paymentStatus === 'PAID');
  $('countAll').textContent = all.length;
  $('countPaid').textContent = paidRows.length;
  $('countPending').textContent = all.length - paidRows.length;
  $('countTotal').textContent = peso(all.reduce((sum, row) => sum + Number(row.total || 0), 0));
  const query = $('tableSearch').value.trim().toLowerCase();
  const visible = all.filter(row => [row.bookingId, row.guest, row.mobile, row.room].some(value => String(value || '').toLowerCase().includes(query)));
  $('bookingRows').innerHTML = visible.length ? visible.map(row => `<tr><td><strong>${esc(row.bookingId)}</strong><br><span class="muted">${new Date(row.scannedAt).toLocaleDateString()}</span></td><td><strong>${esc(row.guest)}</strong><br>${esc(row.mobile || '—')}<br>${esc(row.email || '')}</td><td><strong>${esc(row.room || '—')}</strong><br>${esc(row.checkIn || '—')} → ${esc(row.checkOut || '—')}<br>${esc(row.nights ?? '—')} night(s) · ${esc(row.guests ?? '—')} guest(s)</td><td><strong>${peso(row.total)}</strong></td><td>${esc(row.paymentMethod || '—')}<br><span class="status ${row.paymentMethod === 'Over the Counter' ? 'pending' : 'paid'}">${row.paymentMethod === 'Over the Counter' ? 'PAY AT COUNTER' : 'ONLINE METHOD'}</span></td><td><span class="status ${row.paymentStatus === 'PAID' ? 'paid' : 'pending'}">${esc(row.paymentStatus)}</span></td><td><button class="table-action" data-focus="${esc(row.bookingId)}">View</button> <button class="table-action" data-paid="${esc(row.bookingId)}" ${row.paymentStatus === 'PAID' ? 'disabled' : ''}>${row.paymentMethod === 'Over the Counter' ? 'Mark counter paid' : 'Verify & mark paid'}</button></td></tr>`).join('') : '<tr><td colspan="7" class="emptyrow">No matching scanned reservations.</td></tr>';
  if (latestId) focusRecord(latestId);
}
$('bookingRows').addEventListener('click', event => {
  const view = event.target.closest('[data-focus]');
  if (view) { latestId = view.dataset.focus; focusRecord(latestId); $('focusCard').scrollIntoView({behavior:'smooth', block:'center'}); return; }
  const paidButton = event.target.closest('[data-paid]');
  if (!paidButton) return;
  const rows = getRecords();
  const row = rows.find(item => item.bookingId === paidButton.dataset.paid);
  if (!row) return;
  const message = row.paymentMethod === 'Over the Counter' ? 'Confirm na natanggap na ang bayad sa counter?' : 'Nakumpirma mo ba ang bayad sa opisyal na payment record?';
  if (!confirm(message)) return;
  row.paymentStatus = 'PAID';
  row.paymentVerifiedAt = new Date().toISOString();
  row.paymentVerifiedBy = 'Staff (local browser)';
  saveRecords(rows); latestId = row.bookingId; render(); toast('Payment status updated sa browser na ito.');
});

function setCameraStatus(message, isError = false) {
  $('cameraStatus').textContent = message;
  $('cameraStatus').classList.toggle('error', isError);
}
async function startCamera() {
  if (scanning) return;
  if (!window.isSecureContext || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    setCameraStatus('Camera requires HTTPS or http://localhost. Buksan gamit ang VS Code Live Server.', true);
    toast('Hindi available ang camera sa file:// URL. Gumamit ng Live Server (localhost) o HTTPS.');
    return;
  }
  if (!('BarcodeDetector' in window)) {
    setCameraStatus('Hindi supported ng browser na ito ang built-in QR detector. Subukan ang latest Chrome o Edge.', true);
    toast('QR detector not supported. Gumamit ng updated Chrome/Edge.');
    return;
  }
  try {
    detector = new BarcodeDetector({ formats: ['qr_code'] });
    stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } } });
    const video = $('video');
    video.srcObject = stream;
    await new Promise((resolve, reject) => {
      if (video.readyState >= 2) return resolve();
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error('Hindi mabuksan ang camera video.'));
      setTimeout(() => video.readyState >= 2 ? resolve() : reject(new Error('Nag-timeout ang camera.')), 8000);
    });
    await video.play();
    scanning = true;
    $('startScan').disabled = true;
    setCameraStatus('Camera active — itapat ang QR sa frame.');
    let busy = false;
    const scanFrame = async () => {
      if (!scanning || !stream) return;
      if (!busy && video.readyState >= 2 && video.videoWidth > 0) {
        busy = true;
        try {
          const codes = await detector.detect(video);
          if (codes.length && codes[0].rawValue) {
            const raw = codes[0].rawValue;
            const now = Date.now();
            if (raw !== lastRaw || now - lastAt > 5000) {
              lastRaw = raw; lastAt = now;
              processQR(raw);
              setCameraStatus('QR nabasa. Maaari nang i-scan ang susunod na booking.');
            }
          }
        } catch (error) {
          // Keep scanning; a transient frame decode error should not stop the camera.
        } finally { busy = false; }
      }
      if (scanning) scanTimer = setTimeout(scanFrame, 180);
    };
    scanFrame();
  } catch (error) {
    stopCamera();
    const message = error && error.name === 'NotAllowedError' ? 'Camera permission denied. Payagan ang camera sa browser site settings.' : error && error.name === 'NotFoundError' ? 'Walang camera na nakita sa device.' : `Hindi mabuksan ang camera: ${error.message || 'check permission and browser settings'}`;
    setCameraStatus(message, true); toast(message);
  }
}
function stopCamera() {
  scanning = false;
  if (scanTimer) clearTimeout(scanTimer);
  scanTimer = null;
  if (stream) stream.getTracks().forEach(track => track.stop());
  stream = null;
  $('video').srcObject = null;
  $('startScan').disabled = false;
  setCameraStatus('Camera stopped. Pindutin ang Start camera scanner para magsimula.');
}
$('startScan').addEventListener('click', startCamera);
$('stopScan').addEventListener('click', stopCamera);
$('processManual').addEventListener('click', () => processQR($('manualQr').value.trim()));
$('tableSearch').addEventListener('input', render);
$('qrImage').addEventListener('change', async event => {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  if (!('BarcodeDetector' in window)) { toast('Hindi supported ng browser ang QR image scanning. Subukan ang updated Chrome/Edge o i-paste ang decoded QR text.'); event.target.value = ''; return; }
  try {
    const bitmap = await createImageBitmap(file);
    const imageDetector = new BarcodeDetector({ formats: ['qr_code'] });
    const codes = await imageDetector.detect(bitmap);
    if (codes.length) processQR(codes[0].rawValue);
    else toast('Walang QR code na nakita. Gumamit ng malinaw at hindi cropped na QR image.');
    bitmap.close?.();
  } catch (error) { toast('Hindi mabasa ang QR image sa browser na ito.'); }
  event.target.value = '';
});
$('clearTemp').addEventListener('click', () => {
  if (!confirm('Burahin ang lahat ng pansamantalang scanned bookings sa browser na ito?')) return;
  localStorage.removeItem(KEY); latestId = null; render(); $('focusCard').classList.add('emptyfocus');
  $('focusCard').innerHTML = '<div><span class="eyebrow">LATEST SCAN</span><h3>No QR scanned yet</h3><p>Scan a guest QR to show their booking information here.</p></div>';
  toast('Temporary records cleared from this browser.');
});
$('exportCsv').addEventListener('click', () => {
  const rows = getRecords();
  if (!rows.length) { toast('Walang records na ma-export.'); return; }
  const columns = ['bookingId','guest','mobile','email','room','checkIn','checkOut','guests','rooms','total','paymentMethod','paymentStatus','bookingStatus','scannedAt'];
  const csv = [columns.join(','), ...rows.map(row => columns.map(key => '"' + String(row[key] ?? '').replaceAll('"','""') + '"').join(','))].join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = 'vicentina-scanned-bookings.csv'; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
function tick() {
  $('clock').textContent = new Date().toLocaleString();
  $('connection').textContent = navigator.onLine ? 'Online · local storage' : 'Offline · local storage';
  $('connection').style.background = navigator.onLine ? '#edf5ed' : '#fff1d8';
  $('connection').style.color = navigator.onLine ? '#276747' : '#8b5b0a';
}
window.addEventListener('online', tick);
window.addEventListener('offline', tick);
tick(); setInterval(tick, 1000); render();
// Do not auto-request camera permission on page load; staff starts it explicitly.
setCameraStatus('Pindutin ang Start camera scanner. Gumamit ng localhost o HTTPS.');

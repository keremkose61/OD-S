import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = 8199;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

let browserProc = null;
let testTimeout = null;

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/api/test-results') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok' }));

      try {
        const results = JSON.parse(body);
        handleTestResults(results);
      } catch (err) {
        console.error('Test sonucu ayrıştırma hatası:', err);
        finishTest(false);
      }
    });
    return;
  }

  let reqPath = decodeURI(req.url.split('?')[0]);
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';

  const filePath = path.join(__dirname, reqPath);
  const ext = path.extname(filePath).toLowerCase();

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    });
    res.end(data);
  });
});

function handleTestResults(results) {
  clearTimeout(testTimeout);

  console.log('\n============================================================');
  console.log('            ODİS v3 TEST SENARYOSU DOĞRULAMA RAPORU         ');
  console.log('============================================================\n');

  if (results.error) {
    console.error('Hata oluştu:', results.error);
    finishTest(false);
    return;
  }

  const stepNames = [
    '2025-2026 Yılı Öğrenci Kaydı Oluşturma',
    'Öğrenci Hakkında 3 Disiplin Kaydı Girişi',
    'Aktif Eğitim Yılını 2026-2027 Olarak Değiştirme',
    'Öğrencinin Yeni Yıl Ekranı Kontrolü (Aktif Kayıtlar Boş)',
    'Geçmiş Yıl Kayıtlarına Tekrar Erişim (3 Kayıt Korundu)',
  ];

  results.steps.forEach((s, idx) => {
    const icon = s.pass ? '✓' : '✗';
    const status = s.pass ? 'BAŞARILI (PASS)' : 'BAŞARISIZ (FAIL)';
    console.log(`[ADIM ${idx + 1}] ${stepNames[idx]}`);
    console.log(`         Durum: ${icon} ${status}`);
  });

  console.log('\n------------------------------------------------------------');
  console.log(`BEKLENEN SONUÇ: Yeni yılın aktif kayıtları boş olmalı, geçmiş yılın üç kaydı ise korunmalı.`);
  console.log(`SONUÇ:          ${results.passed ? '✅ TÜM ŞARTLAR TAM SAĞLANDI (TEST BAŞARILI)' : '❌ ŞARTLAR SAĞLANAMADI'}`);
  console.log('------------------------------------------------------------\n');

  finishTest(results.passed);
}

function finishTest(success) {
  if (browserProc) {
    try { browserProc.kill(); } catch (e) {}
  }
  server.close(() => {
    process.exit(success ? 0 : 1);
  });
}

server.listen(PORT, async () => {
  console.log(`[TEST RUNNER] Test sunucusu hazır: http://localhost:${PORT}`);

  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const browserBin = fs.existsSync(edgePath) ? edgePath : chromePath;

  console.log(`[TEST RUNNER] Headless tarayıcı başlatılıyor: ${browserBin}`);

  const targetUrl = `http://localhost:${PORT}/test-scenario.html`;

  browserProc = spawn(browserBin, [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-web-security',
    targetUrl,
  ]);

  testTimeout = setTimeout(() => {
    console.error('\n[TEST RUNNER] Zaman aşımı (Timeout: 20s). Test sonucu alınamadı.');
    finishTest(false);
  }, 20000);
});

import fs from 'node:fs';

const swContent = fs.readFileSync('sw.js', 'utf8');
const match = swContent.match(/const PRECACHE_ASSETS = \[([\s\S]*?)\];/);
if (!match) {
  console.error('PRECACHE_ASSETS bulunamadı!');
  process.exit(1);
}

const assets = match[1]
  .split('\n')
  .map(l => l.trim().replace(/^['"]|['"],?$/g, ''))
  .filter(l => l.startsWith('.'));

let missing = 0;
for (const a of assets) {
  let p = a.replace(/^\.\//, '');
  if (p === '') p = 'index.html';
  if (!fs.existsSync(p)) {
    console.error('EKSİK DOSYA:', a);
    missing++;
  } else {
    console.log('✓ MEVCUT:', a);
  }
}

// Check manifest
const manifestRaw = fs.readFileSync('manifest.json', 'utf8');
const manifest = JSON.parse(manifestRaw);
console.log('\n--- MANIFEST.JSON KONTROLÜ ---');
console.log('Name:', manifest.name);
console.log('Short name:', manifest.short_name);
console.log('Display:', manifest.display);
console.log('Start URL:', manifest.start_url);
console.log('Scope:', manifest.scope);
console.log('Icon count:', manifest.icons.length);

let missingIcons = 0;
for (const icon of manifest.icons) {
  const p = icon.src.replace(/^\.\//, '');
  if (!fs.existsSync(p)) {
    console.error('EKSİK İKON:', icon.src);
    missingIcons++;
  } else {
    console.log(`✓ İkon [${icon.sizes} | ${icon.type}]:`, icon.src);
  }
}

console.log('\n--- SONUÇ ---');
console.log(`Önbellek Varlıkları: Toplam ${assets.length}, Eksik: ${missing}`);
console.log(`Manifest İkonları: Toplam ${manifest.icons.length}, Eksik: ${missingIcons}`);

if (missing === 0 && missingIcons === 0) {
  console.log('✅ PWA DOSYA VE ÖNBELLEK KONTROLÜ TAMAMEN BAŞARILI!');
  process.exit(0);
} else {
  console.error('❌ EKSİK DOSYALAR VAR!');
  process.exit(1);
}

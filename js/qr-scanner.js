/* ========================================
   ODİS — QR Scanner Module
   Camera-based QR code scanning with fallback.
   ======================================== */

let html5QrCodeScanner = null;
let scannerActive = false;

/**
 * Check if the QR code library is available.
 */
function isLibraryAvailable() {
  return typeof Html5Qrcode !== 'undefined';
}

/**
 * Start the QR code scanner.
 */
async function startScanner(containerId, onSuccess, onError) {
  if (!isLibraryAvailable()) {
    onError('QR kod kütüphanesi yüklenemedi. Simülasyon modunu kullanın.');
    return false;
  }

  try {
    if (html5QrCodeScanner) {
      await stopScanner();
    }

    html5QrCodeScanner = new Html5Qrcode(containerId);

    await html5QrCodeScanner.start(
      { facingMode: 'environment' },
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      },
      (decodedText) => {
        onSuccess(decodedText);
      },
      (errorMessage) => {
        // Ignore scan errors (they happen every frame without a QR code)
      }
    );

    scannerActive = true;
    return true;
  } catch (err) {
    console.error('QR Scanner error:', err);
    let message = 'Kamera başlatılamadı.';

    if (err.toString().includes('NotAllowedError')) {
      message = 'Kamera izni verilmedi. Lütfen tarayıcı ayarlarından kamera iznini etkinleştirin.';
    } else if (err.toString().includes('NotFoundError')) {
      message = 'Kamera bulunamadı. Cihazınızda kamera olduğundan emin olun.';
    } else if (err.toString().includes('NotReadableError')) {
      message = 'Kamera başka bir uygulama tarafından kullanılıyor olabilir.';
    } else if (err.toString().includes('OverconstrainedError')) {
      message = 'İstenen kamera ayarları desteklenmiyor.';
    }

    onError(message);
    return false;
  }
}

/**
 * Stop the QR code scanner.
 */
async function stopScanner() {
  if (html5QrCodeScanner && scannerActive) {
    try {
      await html5QrCodeScanner.stop();
    } catch (err) {
      console.warn('Scanner stop error:', err);
    }
    scannerActive = false;
  }

  if (html5QrCodeScanner) {
    try {
      html5QrCodeScanner.clear();
    } catch (err) {
      // Ignore
    }
    html5QrCodeScanner = null;
  }
}

/**
 * Process a scanned QR code value.
 * Returns the matching student or null.
 */
async function processQrCode(value) {
  if (!value || !value.trim()) return null;

  const trimmed = value.trim();

  // Try matching by student number
  let student = await Students.getByNo(trimmed);
  if (student) return student;

  // Try matching by student ID
  student = await Students.getById(trimmed);
  if (student) return student;

  // Try matching with prefix (e.g., "ODIS:1001")
  if (trimmed.includes(':')) {
    const parts = trimmed.split(':');
    const no = parts[parts.length - 1].trim();
    student = await Students.getByNo(no);
    if (student) return student;
  }

  return null;
}

/**
 * Check if scanner is currently active.
 */
function isScannerActive() {
  return scannerActive;
}

// Public API
window.QrScanner = {
  isLibraryAvailable,
  start: startScanner,
  stop: stopScanner,
  processQrCode,
  isActive: isScannerActive,
};

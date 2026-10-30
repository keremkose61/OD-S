# ODİS v3 — Çok Okullu Okul Düzen, Gözlem, Rehberlik ve Yönetim Sistemi

![ODİS Sürüm](https://img.shields.io/badge/S%C3%BCr%C3%BCm-3.0.0-blue)
![PWA Uyumlu](https://img.shields.io/badge/PWA-Uyumlu-success)
![Çok Okullu Mimari](https://img.shields.io/badge/Mimari-%C3%87ok_Okullu_Multi--Tenant-green)
![IndexedDB v4](https://img.shields.io/badge/IndexedDB-v4_E%C4%9Fitim_Y%C4%B1l%C4%B1_Y%C3%B6netimi-orange)
![Lisans](https://img.shields.io/badge/Lisans-MIT-lightgrey)

**ODİS v3 (Okul Düzen, Gözlem ve Rehberlik Sistemi)**; 17 Ekim 2026 Sistem İnceleme ve Yeniden Tasarım Raporu doğrultusunda, tek okula yönelik bir prototipten **merkezi çok okullu (multi-tenant)**, güvenli ve sürdürülebilir bir kurumsal okul yönetim ve öğrenci destek platformuna dönüştürülmüştür.

---

## 🏛️ v3 Sistem Mimarisi ve Temel İlkeler

```text
ODİS — Çok Okullu Merkezi Mimari
│
├── Kaşif Kalkavan Anadolu Lisesi (school_kasif)
│   ├── Personel (Öğretmen, İdare, Rehberlik)
│   ├── Eğitim-Öğretim Yılları (2025-2026 Arşiv, 2026-2027 Aktif...)
│   ├── Öğrenciler & Sınıflar (9-A, 10-B, 11-A...)
│   ├── Düzen Kayıtları & Aynı Gün Tekrar Kontrolü
│   ├── Gözlemler & Rehberlik Yönlendirmeleri (Disiplin Süreci Odaklı)
│   └── Çoklu Filtreli Raporlar & XLSX / PDF Dışa Aktarımı
│
├── Atatürk Fen Lisesi (school_ataturk)
│   └── [Tam Yalıtılmış Okul Veri Seti - cross-school isolation]
│
└── Cumhuriyet MTAL (school_cumhuriyet)
    └── [Tam Yalıtılmış Okul Veri Seti - cross-school isolation]
```

### 🎯 Temel Tasarım İlkeleri
1. **Öğrencileri Etiketlemeyen Yaklaşım:** Düzen kayıtları asla otomatik bir "risk puanı" veya "sorunlu öğrenci" etiketi üretmez.
2. **Çok Okullu Veri Yalıtımı:** Her okul benzersiz bir `school_id` ile tanımlanır. Bir okulun personeli veya idarecisi diğer okulun kayıtlarına asla erişemez.
3. **Net Sistem Ayrımı (ODİS vs. Okul Güvenliği):** ODİS yalnızca öğrenci kural ve disiplin süreçlerine odaklanır. Güvenlik görevlileri, hizmetliler, acil durum ve bina/kapı fiziki yönetimi ayrı **"Okul Güvenliği Sistemi"**nde yer alır; ODİS'te bu roller yer almaz.
4. **Rehberliğin Disiplin Destek Kapsamı:** Rehberlik servisi ODİS'te yalnızca idarenin yönlendirdiği disiplin süreçlerini takip eder ve geri bildirim verir. Gizli psikolojik danışmanlık seans notları ODİS bünyesinde tutulmaz.
5. **Eğitim-Öğretim Yılı ve Sınıf Tarihçesi:** Her kayıt oluşturulduğu dönemin `academicYearId` ve öğrencinin o anki sınıfı (`studentClass`) ile saklanır. Yıl atlatma ve terfilerde geçmiş veriler bozulmaz.

---

## 🚀 Öne Çıkan v3 Modülleri

### 1. Çok Okullu (Multi-Tenant) Mimari & Eğitim Yılı Yönetimi
- Tüm veritabanı tablolarında (`students`, `staff`, `classes`, `academic_years`, `order_records`, `observations`, `support_cases`, `admin_actions`, `audit_logs`) `schoolId` indekslemesi ve sorgu kapsamı.
- İdare panelinde tek tıkla okul değiştirme ve anlık veri yalıtımı testi.
- Öğrenci numaraları okul bazında tekildir; farklı okullar aynı öğrenci numarasını çakışma olmadan kullanabilir.

### 2. XLSX / CSV 7 Aşamalı Aktarım Motoru (Section 3)
Öğrenci ve personel listelerini toplu olarak sisteme güvenle aktaran entegre motor:
1. **Dosya Yükle:** `.xlsx`, `.xls` veya `.csv` dosyasını sürükleyip bırakın (SheetJS entegrasyonu + çevrimdışı CSV ayrıştırıcı).
2. **Sütunları Eşleştir:** Dosya sütun başlıklarını sistem alanlarıyla otomatik eşleştirme.
3. **Kontrol Et:** Zorunlu alan doğrulaması, geçerli sınıf/şube/rol kontrolü ve mükerrer kayıt tespiti.
4. **Hataları Göster:** Hatalı satırları ve eksik alanları açıkça listeleme.
5. **Önizle:** *Yeni Kayıtlar*, *Güncellenecek Kayıtlar* ve *Hatalı/Atlanacak Satırlar* olarak kategorize edilmiş tablo görünümü.
6. **Onayla ve Aktar:** Kullanıcı onayının ardından işlem bütünlüğüyle güvenli kayıt ve otomatik denetim günlüğü (`audit_log`).
7. **Sonucu Raporla:** Başarılı, güncellenen ve atlanan satırların detaylı istatistik raporu.
*(Öğrenci ve Personel için tek tıkla örnek CSV şablonu indirme desteği mevcuttur).*

### 3. Öğretmenler Arası Kayıt Görünürlüğü & Rehberlik Gizliliği (Section 4)
- **Nöbetçi Öğretmenler:** Nöbet devir teslimlerinde ve öğrenci bağlamında geçmiş genel düzen kayıtlarını (Tarih, saat, kural türü, oluşturan öğretmen) şeffaf biçimde görebilir.
- **Hassas Rehberlik Gizliliği (KVKK):** Öğrencinin bir destek sürecinde olduğu bilgisi yetkili öğretmenlerce bilinirken, psikolojik danışmanlık özel görüşme notları ve değerlendirmeleri (`privateNotes`) **yalnızca Rehberlik personeline** açıktır. Öğretmen veya idareci ekranlarında bu alanlar sansürlenir ve KVKK gizlilik rozeti gösterilir.

### 4. Aynı Gün Tekrar Kontrolü (Section 5)
- Bir öğrenciye aynı gün içerisinde aynı kural türünde (örn. "Okul Arması") yeni bir kayıt eklenmek istendiğinde sistem kullanıcıyı uyarır:
  > *"Bugün benzer bir kayıt var. Ahmet Yılmaz için bugün 08:14'te 'Okul Arması' kaydı oluşturulmuş. Önceki kaydı ve saatini kontrol edin."*
- Kullanıcıya **[İptal]** ve **[Yine de Kaydet]** seçenekleri sunulur; isteğe bağlı olarak tekrar gerekçesi girilebilir. Bu sayede mükerrer kayıtlar önlenirken meşru tekrarlar engellenmez.

### 5. Gelişmiş Raporlama, Analiz ve Dışa Aktarma (Section 6)
- **Çoklu Filtreleme Motoru:** Tarih aralığı (Bugün, Bu Hafta, Bu Ay, Özel Tarih), Sınıf/Şube, Kural Kategorisi, Personel/Öğretmen, Tekrar durumu filtreleri.
- **Analitik Göstergeler:** Kategori bazında dağılım yüzdeleri, sınıf yoğunlukları ve tekrar kayıt analizleri.
- **Dışa Aktarma Formatları:**
  - **Excel (`.xlsx`):** SheetJS kütüphanesiyle otomatik sütun genişlikli biçimlendirilmiş kurumsal tablo.
  - **CSV (UTF-8 BOM):** Excel ve diğer araçlarla %100 Türkçe karakter uyumlu dışa aktarım.
  - **Yazdır / PDF:** `@media print` stil desteğiyle A4 formatında temiz çıktı.

### 6. Personel Yönetimi (Section 8.2)
- Kurumsal Roller: **Öğretmen**, **İdareci**, **Rehberlik Servisi**. *(Güvenlik görevlisi ve hizmetli personeli ayrı Okul Güvenliği Sisteminde yer alır)*
- Personel arama, yeni personel ekleme, rol atama ve Aktif/Pasif durum yönetimi.

### 7. Sistem Denetim Günlüğü (Audit Trail - Section 7)
- Veri oluşturma, güncelleme, silme ve XLSX toplu aktarım işlemleri; işlem zamanı, işlem yapan kullanıcı, okul kimliği ve açıklama bilgisiyle değişmez `audit_logs` günlüğüne kaydedilir.

---

### 8. ODİS v1 PDF Şartnamesi & Karar Destek Çerçevesi
Kaşif Kalkavan Anadolu Lisesi Tanıtım ve Kullanım Çerçevesi uyarınca sisteme entegre edilen mimari özellikler:
- **Renkli Noktalar ve Dinamik Eşik Motoru (`js/status-engine.js`):**
  - 🟢 **Normal Takip:** Son 30 günde 0–2 kayıt.
  - 🟠 **Tekrarlayan Durum:** Son 30 günde 3–5 kayıt VEYA son 14 günde aynı kuralın 3 kez tekrarlanması.
  - 🔴 **Yoğun Tekrar:** Son 30 günde 6+ kayıt VEYA son 30 günde aynı kuralın 5+ tekrarı.
  - Eşikler okul idaresi tarafından dinamik olarak yapılandırılabilir; kod içine sabitlenmez.
- **8 Kural Kategorisi:** Kılık/Kıyafet, Saç, Sakal, Okul Arması, Makyaj, Aksesuar, Geç Gelme, Diğer.
- **Öğretmen Çoklu Kategori ve Son Bildirimler:** Tek işlemde birden fazla kategori seçebilme, anlık mükerrer kontrolü ve öğretmenin kendi girdiği son kayıtları izleyebilmesi.
- **Hatalı Kayıt İptal Döngüsü (Soft Delete):** Öğretmen gerekçe ile iptal talebi açar, idare onaylar; kayıt veritabanından silinmez (`status: 'cancelled'`), sayaçtan düşer ve denetim izinde saklanır.
- **İdari Değerlendirme Noktası (Checkpoint):** İdari işlem yapılan tarih milat kabul edilir; sonrasında gelen yeni ihlaller `⚡ İdari İşlem Sonrası Tekrar` olarak vurgulanır.
- **Rehberlik Çift Katmanlı Not Ayrımı:** 🔒 `Özel Rehberlik Notu` (yalnızca rehberliğe açık, audit loguna kopyalanmaz) ile 📤 `İdareye Sonuç Notu` (idareye özet bildirim) kesin çizgilerle ayrılır.

---

## 👥 Roller ve Hızlı Demo Girişleri

ODİS ilk sürümünde yalnızca temel disiplin paydaşlarına odaklanır:

| Okul | Rol | Kullanıcı Adı | Şifre | Görev Kapsamı |
|---|---|---|---|---|
| **Kaşif Kalkavan AL** | Nöbetçi Öğretmen | `ogretmen` | `odis123` | Düzen kaydı ekleme, tekrar uyarısı kontrolü, öğrenci sorgulama. |
| **Kaşif Kalkavan AL** | Rehberlik Servisi | `rehberlik` | `odis123` | İdari yönlendirmeleri inceleme, disiplin destek geri bildirimi. |
| **Kaşif Kalkavan AL** | Müdür Yardımcısı | `mudur` | `odis123` | Yönetim paneli, dönem yönetimi, personel, XLSX aktarımı, denetim günlüğü. |
| **Atatürk Fen Lisesi** | Müdür | `afl_mudur` | `odis123` | Farklı okul kapsamında tam yalıtılmış yönetim ve veri seti. |
| **Atatürk Fen Lisesi** | Öğretmen | `afl_ogretmen` | `odis123` | Atatürk Fen Lisesi öğrenci ve düzen verileri. |
| **Atatürk Fen Lisesi** | Rehberlik | `afl_rehberlik` | `odis123` | Atatürk Fen Lisesi rehberlik yönlendirme takibi. |

---

## 💻 Çalıştırma Talimatı

ODİS v3, harici derleme/build adımı gerektirmeyen saf modern JavaScript (ES6+), PWA ve IndexedDB mimarisiyle çalışır.

### VS Code Live Server ile
1. `odis` klasörünü VS Code ile açın.
2. `index.html` dosyasına sağ tıklayıp **"Open with Live Server"** seçin.
3. Tarayıcınızda `http://127.0.0.1:5500` adresinde uygulama açılacaktır.

### Python Yerel Sunucusu ile
```bash
cd odis
python -m http.server 8000
```
Tarayıcınızda `http://localhost:8000` adresine gidin.

### Node.js / npx ile
```bash
cd odis
npx serve .
```

---

## 📁 Proje Dosya Yapısı

```text
odis/
├── index.html              # Çok okullu uygulama ana iskeleti ve SheetJS CDN bağlantısı
├── manifest.json           # PWA manifest yapılandırması
├── sw.js                   # Service Worker (v2.1.0 çevrimdışı önbellekleme)
├── css/
│   ├── base.css            # Renk paleti, tipografi, grid ve değişkenler
│   └── components.css      # Kartlar, modal pencereler, XLSX yükleyici, rapor filtreleri
├── js/
│   ├── database.js         # IndexedDB v3 (schools, staff, classes, audit_logs ve schoolId indeksleri)
│   ├── schools.js          # Okul yönetimi, Personel CRUD, Denetim günlüğü, 7 Adımlı XLSX Aktarımı
│   ├── auth.js             # Çok okullu oturum yönetimi, KVKK gizlilik kontrolleri
│   ├── seed-data.js        # Kaşif Kalkavan AL ve Atatürk FL örnek çok okullu veri seti (v3)
│   ├── students.js         # Okul kapsamlı öğrenci sorguları ve numara tekilliği
│   ├── records.js          # Düzen, gözlem, destek ve aynı gün tekrar kontrol mekanizması
│   ├── dashboard.js        # Okul bazlı yönetici ve öğretmen gösterge metrikleri
│   ├── ui.js               # UI bileşenleri, tekrar kontrol modalı, Excel (.xlsx) & CSV dışa aktarıcı
│   └── app.js              # Uygulama yönlendiricisi, çok okullu arayüz ve 8 bölümlü yönetim paneli
└── README.md               # Detaylı sistem dokümantasyonu
```

---

## 🛡️ Güvenlik ve KVKK Uyumluluğu Özeti

- **Yetki Sınırlandırması:** Bir öğretmenin öğrencinin rehberlik sürecinde olduğunu bilmesi, özel psikolojik danışma notlarını okuyabileceği anlamına gelmez.
- **Tekrar Kontrolü:** Aynı gün mükerrer kayıtlar uyarıyla tespit edilir ancak kullanıcı gerekçe belirterek meşru durumları kaydedebilir.
- **Denetlenebilirlik:** Tüm veri aktarımları, durum güncellemeleri ve kritik işlemler zaman damgası ve kullanıcı kimliğiyle `audit_logs` üzerinde izlenir.

---
*ODİS v3 — Kaşif Kalkavan Anadolu Lisesi & Çok Okullu Eğitim Yönetim Platformu*

# Apps Script Setup

Gunakan script di `Code.gs` untuk menerima form dari website statis, upload file bukti transfer ke Google Drive, dan simpan data ke Google Sheet.

## 1) Buat Google Sheet

Nama sheet tab: `submissions`

Header row (baris 1) wajib persis ini:

`submission_id | created_at | donor_name | batch_year | amount_claimed | transfer_datetime | sender_bank | receipt_drive_url | note | status | verified_amount | verified_at | verified_by | campaign_id`

Catatan: kolom `transfer_datetime` tetap ada untuk kompatibilitas data, tapi sekarang tidak diisi dari form (akan kosong kecuali diisi manual oleh admin).

## 2) Pasang Apps Script

1. Buka Sheet -> `Extensions -> Apps Script`
2. Paste isi `Code.gs`
3. Buat folder Google Drive untuk menampung bukti transfer.
4. Ambil `Folder ID` dari URL Drive folder tersebut.
5. Di `Code.gs`, ubah konstanta:

```js
const DRIVE_FOLDER_ID = "REPLACE_WITH_YOUR_FOLDER_ID";
```

6. `Deploy -> New deployment -> Web app`
7. Execute as: `Me`
8. Who has access: `Anyone`
9. Deploy, lalu copy URL ending `/exec`

## 3) Hubungkan ke website

Edit `assets/js/config.js`:

```js
window.APP_CONFIG = {
  appsScriptUrl: "https://script.google.com/macros/s/REPLACE_THIS/exec",
};
```

## 4) Verifikasi

1. Isi form di website + upload file bukti transfer.
2. Submit.
3. Cek row baru di sheet dengan status `pending`.
4. Cek Drive folder: file bukti transfer harus otomatis masuk.

## 5) Operasional rutin

- Verifikasi transfer dari mutasi bank
- Update kolom:
  - `status`: `verified` atau `rejected`
  - `verified_amount`
  - `verified_at`
  - `verified_by`

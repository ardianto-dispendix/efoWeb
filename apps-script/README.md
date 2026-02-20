# Apps Script Setup

Gunakan script di `Code.gs` untuk menerima form dari website statis dan menyimpan ke Google Sheet.

## 1) Buat Google Sheet

Nama sheet tab: `submissions`

Header row (baris 1) wajib persis ini:

`submission_id | created_at | donor_name | batch_year | amount_claimed | transfer_datetime | sender_bank | receipt_drive_url | note | status | verified_amount | verified_at | verified_by | campaign_id`

## 2) Pasang Apps Script

1. Buka Sheet -> `Extensions -> Apps Script`
2. Paste isi `Code.gs`
3. `Deploy -> New deployment -> Web app`
4. Execute as: `Me`
5. Who has access: `Anyone`
6. Deploy, lalu copy URL ending `/exec`

## 3) Hubungkan ke website

Edit `assets/js/config.js`:

```js
window.APP_CONFIG = {
  appsScriptUrl: "https://script.google.com/macros/s/REPLACE_THIS/exec",
};
```

## 4) Verifikasi

1. Isi form di website
2. Submit
3. Cek row baru di sheet dengan status `pending`

## 5) Operasional rutin

- Verifikasi transfer dari mutasi bank
- Update kolom:
  - `status`: `verified` atau `rejected`
  - `verified_amount`
  - `verified_at`
  - `verified_by`

const SHEET_NAME = "submissions";
const DRIVE_FOLDER_ID = "REPLACE_WITH_YOUR_FOLDER_ID";
const MAX_RECEIPT_BYTES = 2 * 1024 * 1024;
const ALLOWED_RECEIPT_MIME = {
  "image/jpeg": true,
  "image/png": true,
  "application/pdf": true,
};

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const p = e.parameter;

    if (p.website && p.website.trim() !== "") {
      return json({ ok: true, message: "Submission received" });
    }

    const required = [
      "donor_name",
      "amount_claimed",
      "sender_bank",
      "receipt_filename",
      "receipt_mime",
      "receipt_base64",
      "campaign_id",
    ];

    for (const key of required) {
      if (!p[key] || String(p[key]).trim() === "") {
        return json({ ok: false, message: `Field wajib kosong: ${key}` });
      }
    }

    if (!ALLOWED_RECEIPT_MIME[p.receipt_mime]) {
      return json({ ok: false, message: "Format bukti transfer harus JPG/PNG/PDF" });
    }

    if (String(DRIVE_FOLDER_ID).indexOf("REPLACE_WITH") === 0) {
      return json({ ok: false, message: "Konfigurasi Drive folder ID belum diisi" });
    }

    const amount = Number(p.amount_claimed);
    if (!Number.isFinite(amount) || amount < 1000) {
      return json({ ok: false, message: "Nominal transfer tidak valid" });
    }

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) {
      return json({ ok: false, message: `Sheet '${SHEET_NAME}' tidak ditemukan` });
    }

    const id = Utilities.getUuid();
    const now = new Date();
    const receiptUrl = saveReceiptToDrive({
      submissionId: id,
      filename: p.receipt_filename,
      mimeType: p.receipt_mime,
      base64Payload: p.receipt_base64,
    });

    sheet.appendRow([
      id,
      now,
      sanitize(p.donor_name),
      sanitize(p.batch_year || ""),
      amount,
      sanitize(p.transfer_datetime || ""),
      sanitize(p.sender_bank),
      sanitize(receiptUrl),
      sanitize(p.note || ""),
      "pending",
      "",
      "",
      "",
      sanitize(p.campaign_id),
    ]);

    return json({ ok: true, submission_id: id, receipt_url: receiptUrl });
  } catch (_error) {
    return json({ ok: false, message: "Terjadi kesalahan saat menyimpan data" });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return json({ ok: true, service: "donation-confirmation", timestamp: new Date().toISOString() });
}

function saveReceiptToDrive(input) {
  const bytes = Utilities.base64Decode(String(input.base64Payload || ""));
  if (!bytes || bytes.length === 0) {
    throw new Error("Bukti transfer kosong");
  }

  if (bytes.length > MAX_RECEIPT_BYTES) {
    throw new Error("Ukuran file melebihi 2MB");
  }

  const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
  const safeName = createSafeFileName(input.filename, input.submissionId, input.mimeType);
  const blob = Utilities.newBlob(bytes, input.mimeType, safeName);
  const file = folder.createFile(blob);

  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return file.getUrl();
}

function createSafeFileName(filename, submissionId, mimeType) {
  const cleanName = String(filename || "receipt")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 80);

  const ext = guessExt(mimeType);
  const stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd-HHmmss");
  const base = cleanName.indexOf(".") > -1 ? cleanName.split(".").slice(0, -1).join(".") : cleanName;
  return `${stamp}_${submissionId}_${base}.${ext}`;
}

function guessExt(mimeType) {
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/png") return "png";
  return "pdf";
}

function sanitize(value) {
  const text = String(value || "").trim();
  if (/^[=+\-@]/.test(text)) {
    return `'${text}`;
  }
  return text;
}

function json(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}

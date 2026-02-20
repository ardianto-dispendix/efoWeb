const SHEET_NAME = "submissions";

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
      "transfer_datetime",
      "sender_bank",
      "receipt_drive_url",
      "campaign_id",
    ];

    for (const key of required) {
      if (!p[key] || String(p[key]).trim() === "") {
        return json({ ok: false, message: `Field wajib kosong: ${key}` });
      }
    }

    if (!isGoogleDriveUrl(p.receipt_drive_url)) {
      return json({ ok: false, message: "Link bukti transfer harus Google Drive" });
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

    sheet.appendRow([
      id,
      now,
      sanitize(p.donor_name),
      sanitize(p.batch_year || ""),
      amount,
      sanitize(p.transfer_datetime),
      sanitize(p.sender_bank),
      sanitize(p.receipt_drive_url),
      sanitize(p.note || ""),
      "pending",
      "",
      "",
      "",
      sanitize(p.campaign_id),
    ]);

    return json({ ok: true, submission_id: id });
  } catch (_error) {
    return json({ ok: false, message: "Terjadi kesalahan saat menyimpan data" });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return json({ ok: true, service: "donation-confirmation", timestamp: new Date().toISOString() });
}

function isGoogleDriveUrl(url) {
  return /drive\.google\.com|docs\.google\.com/.test(String(url || ""));
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

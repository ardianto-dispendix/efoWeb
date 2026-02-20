function formatIdr(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function setProgress(data) {
  const target = Number(data.target_amount || 0);
  const current = Number(data.verified_collected_amount || 0);
  const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0;

  const numbers = document.getElementById("progressNumbers");
  const meta = document.getElementById("progressMeta");
  const updated = document.getElementById("progressUpdated");
  const progressFill = document.getElementById("progressFill");
  const progressBar = document.getElementById("progressBar");
  const campaignId = document.getElementById("campaignId");

  numbers.textContent = `${formatIdr(current)} / ${formatIdr(target)}`;
  meta.textContent = `${pct.toFixed(1)}% tercapai • ${data.verified_donor_count || 0} donatur terverifikasi`;
  updated.textContent = `Pembaruan: ${data.updated_at || "-"}`;
  progressFill.style.width = `${pct}%`;
  progressBar.setAttribute("aria-valuenow", String(Math.round(pct)));

  if (data.campaign_id) {
    campaignId.value = data.campaign_id;
  }
}

function renderHistory(items) {
  const list = document.getElementById("historyList");
  list.innerHTML = "";

  (items || []).forEach((item) => {
    const li = document.createElement("li");
    li.innerHTML = `<a href="${item.url}" target="_blank" rel="noopener noreferrer">${item.title}</a><small>${item.description || ""}</small>`;
    list.appendChild(li);
  });
}

async function loadStaticData() {
  const [progressRes, historyRes] = await Promise.all([
    fetch(`data/progress.json?v=${Date.now()}`),
    fetch(`data/historical.json?v=${Date.now()}`),
  ]);

  const progressData = await progressRes.json();
  const historyData = await historyRes.json();

  setProgress(progressData);
  renderHistory(historyData.items);
}

function toBase64Payload(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      const marker = "base64,";
      const idx = result.indexOf(marker);
      if (idx === -1) {
        reject(new Error("Invalid file encoding"));
        return;
      }
      resolve(result.slice(idx + marker.length));
    };
    reader.onerror = () => reject(new Error("Failed reading file"));
    reader.readAsDataURL(file);
  });
}

function isAllowedReceiptFile(file) {
  const allowed = {
    "image/jpeg": true,
    "image/png": true,
    "application/pdf": true,
  };
  const maxBytes = 2 * 1024 * 1024;
  return Boolean(file && allowed[file.type] && file.size > 0 && file.size <= maxBytes);
}

function setupForm() {
  const form = document.getElementById("donationForm");
  const status = document.getElementById("formStatus");
  const submitBtn = document.getElementById("submitBtn");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    status.textContent = "";
    status.className = "status";

    const formData = new FormData(form);
    const scriptUrl = (window.APP_CONFIG && window.APP_CONFIG.appsScriptUrl || "").trim();
    const receiptFile = formData.get("receipt_file");

    if (!(receiptFile instanceof File) || !isAllowedReceiptFile(receiptFile)) {
      status.textContent = "Bukti transfer harus JPG/PNG/PDF dan maksimal 2MB.";
      status.classList.add("err");
      return;
    }

    if (!scriptUrl) {
      status.textContent = "Apps Script URL belum diisi di assets/js/config.js";
      status.classList.add("err");
      return;
    }

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = "Mengirim...";

      const encodedReceipt = await toBase64Payload(receiptFile);
      const payload = new URLSearchParams();

      formData.forEach((value, key) => {
        if (key !== "receipt_file") {
          payload.append(key, String(value));
        }
      });

      payload.append("receipt_filename", receiptFile.name);
      payload.append("receipt_mime", receiptFile.type);
      payload.append("receipt_base64", encodedReceipt);

      const res = await fetch(scriptUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
        body: payload.toString(),
      });

      const data = await res.json();

      if (data && data.ok) {
        status.textContent = "Konfirmasi berhasil dikirim. Tim akan verifikasi transfer Anda.";
        status.classList.add("ok");
        form.reset();
      } else {
        status.textContent = data && data.message ? data.message : "Gagal mengirim konfirmasi.";
        status.classList.add("err");
      }
    } catch (_error) {
      status.textContent = "Terjadi kendala jaringan. Silakan coba lagi.";
      status.classList.add("err");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Kirim Konfirmasi";
    }
  });
}

loadStaticData();
setupForm();

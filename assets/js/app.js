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

function isGoogleDriveUrl(url) {
  return /drive\.google\.com|docs\.google\.com/.test(url || "");
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
    const receiptUrl = formData.get("receipt_drive_url");

    if (!isGoogleDriveUrl(receiptUrl)) {
      status.textContent = "Link bukti transfer harus menggunakan Google Drive.";
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

      const res = await fetch(scriptUrl, {
        method: "POST",
        body: formData,
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

function setupTabs() {
  const buttons = document.querySelectorAll(".tab-btn");
  const tabs = document.querySelectorAll(".tab-content");

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.tabTarget;
      if (!target) return;

      buttons.forEach((b) => b.classList.remove("active"));
      tabs.forEach((t) => t.classList.remove("active"));

      btn.classList.add("active");
      const panel = document.getElementById(target);
      if (panel) {
        panel.classList.add("active");
      }
    });
  });
}

loadStaticData();
setupForm();
setupTabs();

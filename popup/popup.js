let currentTab = "contacts";
let allData = {
  contacts: [],
  deals: [],
  leads: [],
  activities: [],
  lastSync: {},
};
let searchTerm = "";

document.addEventListener("DOMContentLoaded", () => {
  loadData();
  setupEventListeners();
  setupStorageListener();
});

function setupEventListeners() {
  // Extract button
  document
    .getElementById("extractBtn")
    .addEventListener("click", handleExtract);

  // Tab buttons
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", (e) => {
      const tabName = e.currentTarget.dataset.tab;
      switchTab(tabName);
    });
  });

  // Search input
  document.getElementById("searchInput").addEventListener("input", (e) => {
    searchTerm = e.target.value;
    renderRecords();
  });

  // Export buttons
  document
    .getElementById("exportJsonBtn")
    .addEventListener("click", exportJSON);
  document.getElementById("exportCsvBtn").addEventListener("click", exportCSV);

  // Clear button
  document.getElementById("clearBtn").addEventListener("click", handleClear);
}

// Listen for storage changes
function setupStorageListener() {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local" && changes.monday_data) {
      allData = changes.monday_data.newValue;
      updateUI();
    }
  });
}

// Loading

async function loadData() {
  chrome.runtime.sendMessage({ type: "GET_DATA" }, (response) => {
    if (response) {
      allData = response;
      updateUI();
    }
  });
}

//Extraction

async function handleExtract() {
  const btn = document.getElementById("extractBtn");
  const text = document.getElementById("extractText");
  const spinner = document.getElementById("extractSpinner");

  btn.disabled = true;
  text.style.display = "none";
  spinner.style.display = "inline-block";

  chrome.runtime.sendMessage({ type: "TRIGGER_EXTRACTION" }, (response) => {
    btn.disabled = false;
    text.style.display = "inline";
    spinner.style.display = "none";

    if (response.success) {
      showNotification(
        `Successfully extracted ${response.count} ${response.boardType}`,
        "success",
      );
      chrome.runtime.sendMessage({ type: "GET_DATA" }, (data) => {
        allData = data;
        currentTab = response.boardType;
        switchTab(currentTab);
      });
    } else {
      showNotification(response.error || "Extraction failed", "error");
    }
  });
}

// Tab Switch

function switchTab(tabName) {
  currentTab = tabName;
  searchTerm = "";
  document.getElementById("searchInput").value = "";

  // Update tab buttons
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.tab === tabName);
  });

  updateUI();
}

function updateUI() {
  ["contacts", "deals", "leads", "activities"].forEach((type) => {
    const badge = document.getElementById(`badge-${type}`);
    if (badge) {
      badge.textContent = allData[type]?.length || 0;
    }
  });

  const lastSync = allData.lastSync?.[currentTab];
  const lastSyncEl = document.getElementById("lastSync");
  if (lastSyncEl) {
    lastSyncEl.textContent = lastSync
      ? `Last sync: ${new Date(lastSync).toLocaleString()}`
      : "Last sync: Never";
  }

  renderRecords();
}

// Rendering

function renderRecords() {
  const container = document.getElementById("recordsContainer");
  const records = getFilteredRecords();

  if (records.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>No ${currentTab} found</p>
        <small>Click "Extract Current Board" to get started</small>
      </div>
    `;
    return;
  }

  container.innerHTML = records
    .map((record) => createRecordCard(record))
    .join("");

  // Event listeners to cards
  container.querySelectorAll(".btn-expand").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const card = e.target.closest(".record-card");
      const details = card.querySelector(".record-details");
      if (details.style.display === "none") {
        details.style.display = "block";
        e.target.textContent = "▲";
      } else {
        details.style.display = "none";
        e.target.textContent = "▼";
      }
    });
  });

  container.querySelectorAll(".btn-delete").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const recordId = e.target.dataset.id;
      handleDelete(recordId);
    });
  });
}

function getFilteredRecords() {
  const records = Array.isArray(allData[currentTab]) ? allData[currentTab] : [];

  if (!searchTerm) return records;

  const term = searchTerm.toLowerCase();
  return records.filter((record) => {
    return Object.values(record).some((value) =>
      String(value).toLowerCase().includes(term),
    );
  });
}

function createRecordCard(record) {
  const fields = getRecordFields(record);
  const primary = fields[0];
  const preview = fields.slice(1, 3).filter((f) => f.value);
  const details = fields.slice(3).filter((f) => f.value);

  return `
    <div class="record-card">
      <div class="record-header">
        <div class="record-title">${escapeHtml(primary.value || "Untitled")}</div>
        <div class="record-actions">
          <button class="btn-expand">▼</button>
          <button class="btn-delete" data-id="${record.id}">✕</button>
        </div>
      </div>
      <div class="record-preview">
        ${preview
          .map(
            (f) => `
          <div class="record-field">
            <span class="field-label">${f.label}:</span> ${escapeHtml(f.value)}
          </div>
        `,
          )
          .join("")}
      </div>
      <div class="record-details" style="display:none;">
        ${details
          .map(
            (f) => `
          <div class="record-field">
            <span class="field-label">${f.label}:</span> ${escapeHtml(f.value)}
          </div>
        `,
          )
          .join("")}
      </div>
    </div>
  `;
}

function getRecordFields(record) {
  switch (currentTab) {
    case "contacts":
      return [
        { label: "Name", value: record.name },
        { label: "Email", value: record.email },
        { label: "Phone", value: record.phone },
        { label: "Company", value: record.company },
        { label: "Title", value: record.title },
      ];

    case "deals":
      return [
        { label: "Deal", value: record.deal },
        {
          label: "Value",
          value: record.value ? `$${record.value.toLocaleString()}` : "",
        },
        { label: "Stage", value: record.stage },
        { label: "Group", value: record.group },
        {
          label: "Probability",
          value: record.probability ? `${record.probability}%` : "",
        },
        { label: "Close Date", value: record.closeDate },
        { label: "Owner", value: record.owner },
        { label: "Contact", value: record.contact },
      ];

    case "leads":
      return [
        { label: "Name", value: record.name },
        { label: "Company", value: record.company },
        { label: "Status", value: record.status },
        { label: "Email", value: record.email },
        { label: "Phone", value: record.phone },
        { label: "Owner", value: record.owner },
      ];

    case "activities":
      return [
        { label: "Activity Type", value: record.activityType },
        { label: "Subject", value: record.subject },
        { label: "Date", value: record.date },
        { label: "Associated Contact", value: record.associatedContact },
      ];

    default:
      return [];
  }
}

// Delete and Clear

function handleDelete(recordId) {
  if (!confirm("Delete this record?")) return;

  chrome.runtime.sendMessage(
    {
      type: "DELETE_RECORD",
      boardType: currentTab,
      recordId: recordId,
    },
    (response) => {
      if (response.success) {
        showNotification("Record deleted", "success");
      }
    },
  );
}

function handleClear() {
  if (!confirm(`Clear all ${currentTab}? This cannot be undone.`)) return;

  chrome.runtime.sendMessage(
    {
      type: "CLEAR_BOARD",
      boardType: currentTab,
    },
    (response) => {
      if (response.success) {
        showNotification(`All ${currentTab} cleared`, "success");
      }
    },
  );
}

// Export

function exportJSON() {
  const dataStr = JSON.stringify(allData, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  downloadFile(blob, `monday-crm-data-${Date.now()}.json`);
  showNotification("Data exported as JSON", "success");
}

function exportCSV() {
  const records = allData[currentTab];
  if (records.length === 0) {
    showNotification("No data to export", "error");
    return;
  }

  const headers = Object.keys(records[0]);
  const rows = [headers.join(",")];

  records.forEach((record) => {
    const values = headers.map((h) => {
      const val = String(record[h] || "").replace(/"/g, '""');
      return `"${val}"`;
    });
    rows.push(values.join(","));
  });

  const csv = rows.join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  downloadFile(blob, `${currentTab}-${Date.now()}.csv`);
  showNotification("Data exported as CSV", "success");
}

function downloadFile(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Notification

function showNotification(message, type) {
  const notification = document.getElementById("notification");
  notification.textContent = message;
  notification.className = `notification ${type}`;
  notification.style.display = "block";

  setTimeout(() => {
    notification.style.display = "none";
  }, 3000);
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Board Detection

function detectBoardType() {
  const headers = Array.from(
    document.querySelectorAll(
      '[data-testid="column-header"], [class*="column-header"]',
    ),
  ).map((el) => el.textContent.toLowerCase());

  if (!headers.length) {
    return "activities";
  }

  const hasDealValue = headers.some(
    (h) => h.includes("deal") || h.includes("value") || h.includes("amount"),
  );

  const hasStatus = headers.some((h) => h.includes("status"));

  const hasEmail = headers.some((h) => h.includes("email"));
  const hasPhone = headers.some((h) => h.includes("phone"));

  if (hasDealValue) return "deals";
  if (hasStatus) return "leads";
  if (hasEmail && hasPhone) return "contacts";

  return "activities";
}

window.detectBoardType = detectBoardType;

// Generate ID

function generateId(element) {
  const pulseId =
    element.getAttribute("data-pulse-id") ||
    element.getAttribute("data-id") ||
    element.querySelector("[data-id]")?.getAttribute("data-id");

  if (pulseId) return pulseId;
  const content = element.textContent.trim().substring(0, 50);
  return (
    "row_" +
    btoa(content)
      .substring(0, 16)
      .replace(/[^a-zA-Z0-9]/g, "")
  );
}
window.generateId = generateId;

// Shadow DOM

function createStatusIndicator() {
  const existing = document.getElementById("monday-extractor-indicator");
  if (existing) existing.remove();

  const host = document.createElement("div");
  host.id = "monday-extractor-indicator";
  host.style.cssText = "position:fixed;top:20px;right:20px;z-index:999999;";

  const shadow = host.attachShadow({ mode: "open" });
  shadow.innerHTML = `
    <style>
      .indicator {
        background: white;
        border-radius: 8px;
        padding: 16px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        font-family: Arial, sans-serif;
        min-width: 220px;
      }
      .title {
        font-weight: bold;
        color: #0073ea;
        margin-bottom: 8px;
        font-size: 14px;
      }
      .message {
        color: #666;
        font-size: 12px;
      }
      .spinner {
        display: inline-block;
        width: 12px;
        height: 12px;
        border: 2px solid #f3f3f3;
        border-top: 2px solid #0073ea;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-right: 8px;
      }
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      .success { color: #00ca72; }
      .error { color: #e44258; }
    </style>
    <div class="indicator">
      <div class="title" id="title">Extracting data...</div>
      <div class="message" id="message">
        <span class="spinner"></span>
        <span id="msg-text">Initializing...</span>
      </div>
    </div>
  `;

  document.body.appendChild(host);

  return {
    update(title, message, type) {
      const titleEl = shadow.getElementById("title");
      const msgText = shadow.getElementById("msg-text");
      const spinner = shadow.querySelector(".spinner");

      if (titleEl) titleEl.textContent = title;
      if (msgText) msgText.textContent = message;

      if (type === "success") {
        if (spinner) spinner.style.display = "none";
        if (titleEl) titleEl.className = "title success";
      } else if (type === "error") {
        if (spinner) spinner.style.display = "none";
        if (titleEl) titleEl.className = "title error";
      }
    },
    remove() {
      setTimeout(() => host.remove(), 3000);
    },
  };
}

// Extraction

async function extractCurrentBoard() {
  const indicator = createStatusIndicator();

  try {
    // Wait for board to load
    await new Promise((resolve) => {
      if (document.querySelector('[data-testid="board-row"], .board-row')) {
        resolve();
      } else {
        setTimeout(resolve, 2000);
      }
    });

    const boardType = detectBoardType();

    if (!boardType) {
      indicator.update("Error", "Could not detect board type", "error");
      indicator.remove();
      return { success: false, error: "Unknown board type" };
    }

    indicator.update(
      `Extracting ${boardType}`,
      "Reading board data...",
      "loading",
    );

    // Extract based on board type
    let data = [];
    switch (boardType) {
      case "contacts":
        data = extractContacts();
        break;
      case "deals":
        data = extractDeals();
        break;
      case "leads":
        data = extractLeads();
        break;
      case "activities":
        data = extractActivities();
        break;
    }

    // Save to storage
    const result = await StorageManager.saveBoardData(boardType, data);

    indicator.update(
      "Success!",
      `Extracted ${data.length} ${boardType}`,
      "success",
    );
    indicator.remove();

    return { success: true, boardType, count: data.length };
  } catch (error) {
    indicator.update("Error", error.message, "error");
    indicator.remove();
    return { success: false, error: error.message };
  }
}

// Listner

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "EXTRACT_BOARD") {
    extractCurrentBoard().then(sendResponse);
    return true; // Keep message channel open
  }
});

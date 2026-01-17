const STORAGE_KEY = "monday_data";

// Initialize
chrome.runtime.onInstalled.addListener(() => {
  console.log("Monday.com CRM Extractor installed");

  chrome.storage.local.get(STORAGE_KEY, (result) => {
    if (!result[STORAGE_KEY]) {
      const initialData = {
        contacts: [],
        deals: [],
        leads: [],
        activities: [],
        lastSync: {
          contacts: null,
          deals: null,
          leads: null,
          activities: null,
        },
      };
      chrome.storage.local.set({ [STORAGE_KEY]: initialData });
    }
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Trigger extraction on active tab
  if (request.type === "TRIGGER_EXTRACTION") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]) {
        sendResponse({ success: false, error: "No active tab" });
        return;
      }

      // If on Monday.com
      if (!tabs[0].url.includes("monday.com")) {
        sendResponse({ success: false, error: "Not on a Monday.com page" });
        return;
      }

      chrome.tabs.sendMessage(
        tabs[0].id,
        { type: "EXTRACT_BOARD" },
        (response) => {
          if (chrome.runtime.lastError) {
            sendResponse({
              success: false,
              error: "Content script not ready. Refresh the page.",
            });
          } else {
            sendResponse(response);
          }
        },
      );
    });
    return true;
  }

  // Get all data
  if (request.type === "GET_DATA") {
    chrome.storage.local.get(STORAGE_KEY, (result) => {
      const data = result[STORAGE_KEY] || {
        contacts: [],
        deals: [],
        leads: [],
        activities: [],
        lastSync: {
          contacts: null,
          deals: null,
          leads: null,
          activities: null,
        },
      };
      sendResponse(data);
    });
    return true;
  }

  // Delete
  if (request.type === "DELETE_RECORD") {
    chrome.storage.local.get(STORAGE_KEY, (result) => {
      const data = result[STORAGE_KEY];
      if (data) {
        data[request.boardType] = data[request.boardType].filter(
          (item) => item.id !== request.recordId,
        );
        chrome.storage.local.set({ [STORAGE_KEY]: data }, () => {
          sendResponse({ success: true });
        });
      } else {
        sendResponse({ success: false });
      }
    });
    return true;
  }

  // Clear
  if (request.type === "CLEAR_BOARD") {
    chrome.storage.local.get(STORAGE_KEY, (result) => {
      const data = result[STORAGE_KEY];
      if (data) {
        data[request.boardType] = [];
        data.lastSync[request.boardType] = null;
        chrome.storage.local.set({ [STORAGE_KEY]: data }, () => {
          sendResponse({ success: true });
        });
      } else {
        sendResponse({ success: false });
      }
    });
    return true;
  }
});

const STORAGE_KEY = "monday_data";

const StorageManager = {
  // Initial data structure
  getInitialData() {
    return {
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
  },

  // Get all data from storage
  async getData() {
    return new Promise((resolve) => {
      chrome.storage.local.get(STORAGE_KEY, (result) => {
        resolve(result[STORAGE_KEY] || this.getInitialData());
      });
    });
  },

  // Save data for a specific board type
  async saveBoardData(boardType, records) {
    const data = await this.getData();

    // Deduplicate: merge with existing data
    const existingMap = new Map(data[boardType].map((item) => [item.id, item]));

    records.forEach((record) => {
      existingMap.set(record.id, record);
    });

    data[boardType] = Array.from(existingMap.values());
    data.lastSync[boardType] = Date.now();

    return new Promise((resolve) => {
      chrome.storage.local.set({ [STORAGE_KEY]: data }, () => {
        resolve({
          success: true,
          count: records.length,
          total: data[boardType].length,
        });
      });
    });
  },

  // Delete a single record
  async deleteRecord(boardType, recordId) {
    const data = await this.getData();
    data[boardType] = data[boardType].filter((item) => item.id !== recordId);

    return new Promise((resolve) => {
      chrome.storage.local.set({ [STORAGE_KEY]: data }, () => {
        resolve({ success: true });
      });
    });
  },

  // Clear all data for a board type
  async clearBoard(boardType) {
    const data = await this.getData();
    data[boardType] = [];
    data.lastSync[boardType] = null;

    return new Promise((resolve) => {
      chrome.storage.local.set({ [STORAGE_KEY]: data }, () => {
        resolve({ success: true });
      });
    });
  },
};

if (typeof window !== "undefined") {
  window.StorageManager = StorageManager;
}

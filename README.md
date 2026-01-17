# Monday.com CRM Data Extractor

A Chrome Extension that intelligently extracts CRM data from Monday.com boards using DOM parsing, stores it locally, and provides a dashboard for managing the extracted data.


## Features

### Core Functionality

**Multi-Board Support**
- Extracts from 4 board types: Contacts, Deals, Leads, Activities
- Automatic board type detection
- Handles both Table and Kanban views

**Data Extraction**
- Regex-based parsing for emails, phones, dates
- Context-aware field extraction
- Group context preservation for Deals board

**Data Management**
- Local persistence with `chrome.storage.local`
- Automatic deduplication by unique IDs
- Real-time sync across browser tabs
- Search functionality

**Export Options**
- JSON export (complete dataset)
- CSV export (per board type)
- One-click downloads

**Visual Feedback**
- Shadow DOM status indicator
- Extraction progress display
- Success/error notifications
- Board type detection display

## Installation

### Prerequisites
- Google Chrome 
- Monday.com account

### Installation Steps

1. **Download the Extension**
   ```bash
   git clone [https://github.com/ahezamahewark-01/Monday.com-CRM-Extractor/tree/main]
   cd monday.com-crm-extractor
   ```

2. **Verify File Structure**
  
monday.com-crm-extractor/
│
├── manifest.json
├── background.js
│
├── content/
│   ├── content.js             
│   │
│   └── extractors/
│       ├── contacts.js
│       ├── leads.js
│       ├── deals.js
│       └── activities.js
│
├── popup/
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
│
└── icons/


3. **Load in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable **Developer mode** (toggle in top-right corner)
   - Click **Load unpacked**
   - Select the `monday.com-crm-extractor` folder
   - Extension icon appears in toolbar ✓

4. **Verify Installation**
   - Click extension icon
   - Popup should display "Monday.com CRM Extractor"
   - All tabs should show "0" badges




##  Usage Guide

### Getting Started with Monday.com

1. **Create Account**
   - Visit [monday.com](https://monday.com)
   - Sign up for "CRM" free trial
   - Choose "Start from scratch"

2. **Create Sample Boards**

   **Contacts Board:**
   - Add columns: Name, Email, Phone, Company, Title, Owner
   - Add 5-10 sample contacts
   
   **Deals Board:**
   - Add columns: Deal Name, Value, Stage, Probability, Close Date, Owner
   - Create groups: "Active Deals", "Won", "Lost"
   - Add 5-10 deals across different groups
   
   **Leads Board:**
   - Add columns: Name, Company, Status, Email, Phone, Owner
   - Add 5-10 sample leads
   
   **Activities Board:**
   - Add columns: Activity Type, Subject, Date, Associated Contact
   - Add 5-10 sample activities

### Extracting Data

1. **Navigate to Board**
   - Open any Monday.com CRM board in Chrome

2. **Trigger Extraction**
   - Click extension icon in toolbar
   - Click "Extract Current Board" button
   - Watch for status indicator on page (top-right)

3. **Monitor Progress**
   - Status indicator shows:
     - "Extracting [board type]..." (blue spinner)
     - "Success! Extracted X records" (green checkmark)
     - "Error: [message]" (red X)
   - Indicator auto-disappears after 3 seconds

4. **View Results**
   - Popup automatically switches to extracted board tab
   - Records appear in cards
   - Badge shows count



#### Viewing Records

- **Switch Tabs**: Click board type tabs (Contacts/Deals/Leads/Activities)
- **Expand Details**: Click ▼ arrow on any record card
- **Collapse Details**: Click ▲ arrow to hide details

#### Searching & Filtering

```
1. Click into search box
2. Type search term (searches all fields)
3. Results filter in real-time
4. Clear search to show all records
```

#### Deleting Records

- **Single Delete**: Click ✕ button on any record → Confirm
- **Bulk Delete**: Click "Clear" button → Confirms → Clears entire board type

#### Exporting Data

- **JSON Export**: 
  - Click "JSON" button
  - Downloads `monday-crm-data-[timestamp].json`
  - Contains all board types

- **CSV Export**:
  - Switch to desired board tab
  - Click "CSV" button
  - Downloads `[boardtype]-[timestamp].csv`
  - Opens in Excel/Google Sheets



## Executionn Flow

1️. User clicks "Extract" in Popup
    │
    ▼
2️. popup.js
    - Sends EXTRACT_BOARD message
    │
    ▼
3️. background.js
    - Receives message
    - Finds active monday.com tab
    - Forwards message to content script
    │
    ▼
4️. content.js (in page context)
    - Shows Shadow DOM indicator
    - detectBoardType()
    │
    ▼
5️. Board-specific extractor
    - extractContacts() / extractLeads()
    - extractDeals() / extractActivities()
    │
    ▼
6️. Extractor logic
    - Reads visible DOM
    - Handles virtualized rows
    - Parses text / groups / dates
    - Normalizes schema
    │
    ▼
7️. StorageManager
    - Saves data by board type
    - Deduplicates by generated ID
    │
    ▼
8️. content.js
    - Updates Shadow DOM (success / error)
    │
    ▼
9️. popup.js
    - Reads stored data
    - Renders table
    - Enables export (JSON / CSV)





## DOM Selection Strategy

### Overview

This extension extracts CRM data directly from the Monday.com UI using DOM-based selection.
The strategy uses pattern recognition and intelligent text parsing to identify and extract structured information from what users actually see on screen.
The strategy is designed to be resilient to UI changes and inconsistent DOM structures used by Monday.com across different board types.

---

## Why DOM-Based Extraction?

Monday.com UI is heavily React-driven and virtualized. As a result:

* Traditional table selectors (`<tr>`, `<td>`, `role="row"`) are unreliable
* Column elements may not exist in the DOM at all times
* Column headers are sometimes virtualized or not rendered
* CSS class names change frequently

Because of this, the extension extracts data only from what is visibly rendered, ensuring consistency with what the user actually sees.


## Selection Strategy Used


### Detect Board Type by Analyzing Column Headers

Rather than guessing from URLs or board titles (which users can change), the extension scans for specific column types:

Has "deal" or "value" column → Deals board
Has "activity" or "task" column → Activities board
Has "status" column → Leads board
Has both "email" AND "phone" columns → Contacts board

### 1. Select Visible Item Containers

Instead of assuming a table structure, the extension selects row-like UI elements that represent individual records.

These elements are identified using stable attributes such as:

* `data-testid*="item"`
* Repeated UI patterns within the board list area

This avoids:
* Sidebar items
* Navigation elements
* Header rows


### 2. Avoid Column-Based DOM Assumptions

Although boards visually resemble tables, they are not semantically tables in the DOM.

Therefore, the extension deliberately avoids:

* Column index assumptions
* `<tr>` / `<td>` selectors
* Relying on column headers for data extraction

Each record is treated as a single visible text block, not a row with discrete cells.

---

### 3. Extract Only User-Visible Text

For each selected record:

* `innerText` is read
* Whitespace is normalized
* Hidden or offscreen DOM nodes are ignored

This ensures:

* Stability across re-renders
* Accuracy aligned with what the user sees
* No dependency on internal implementation details

---

### 4. Board-Specific Parsing Logic

Each board type (Contacts, Leads, Deals, Activities) uses its own extractor.

This is intentional:

* Board schemas differ
* UI representations differ
* A generic extractor would be brittle and inaccurate

All extractors share the same DOM selection strategy, but apply board-specific parsing rules.

---

## Summary

The DOM selection strategy prioritizes:

* Stability 
* Visibility 
* Correctness 

By selecting visible item blocks and reconstructing structured data using semantic anchors, the extension remains resilient to DOM changes and works consistently across all supported Monday.com CRM boards.




##  Storage Schema

```javascript
{
  "monday_data": {
    "contacts": [
      {
        "id": "",             
        "name": "",          
        "email": "",
        "phone": "",
        "company": "",
        "title": "",
      }
    ],
    "deals": [
      {
        "id": "",
        "deal": "",    
        "value": ,              
        "stage": "",
        "group": "",     
        "probability": ,      
        "closeDate": "", 
        "owner": ""       
      }
    ],
    "leads": [
      {
        "id": "",
        "name": "",
        "company": "",
        "status": "",
        "email": "",
        "phone": "",
        "owner": ""
      }
    ],
    "activities": [
      {
        "id": "",
        "activityType": "",
        "subject": "",       
        "date": "",
        "associatedContact": ""
      }
    ]
  }
}
```

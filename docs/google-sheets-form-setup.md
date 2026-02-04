# Contact form → Google Sheets (free, no library)

Submissions are sent to a **Google Apps Script** web app that appends a row to a Google Sheet. No npm package needed.

## 1. Create a Google Sheet

1. Go to [Google Sheets](https://sheets.google.com) and create a new spreadsheet (e.g. “Tails and Trainers – Contact”).
2. In row **1**, add headers: `Name` | `Email` | `Message` | `Timestamp`.
3. Copy the **Sheet ID** from the URL:  
   `https://docs.google.com/spreadsheets/d/**SHEET_ID_HERE**/edit`  
   (the long string between `/d/` and `/edit`).

## 2. Add the script

1. In the spreadsheet: **Extensions → Apps Script**.
2. Replace the default `function myFunction() {}` with the code below.
3. Replace `YOUR_SHEET_ID_HERE` with your actual Sheet ID (from step 1).
4. Save (Ctrl/Cmd + S). Name the project if you like (e.g. “Contact form”).

```javascript
const SHEET_ID = "YOUR_SHEET_ID_HERE";

function doPost(e) {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getActiveSheet();
    const params = e.parameter || (e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : {});

    const name = (params.from_name || params.name || "").toString().trim();
    const email = (params.from_email || params.email || "").toString().trim();
    const message = (params.message || "").toString().trim();

    sheet.appendRow([name, email, message, new Date()]);

    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

## 3. Deploy as web app

1. In Apps Script: **Deploy → New deployment**.
2. Click the gear icon next to “Select type” and choose **Web app**.
3. **Description:** e.g. “Contact form”.
4. **Execute as:** Me (your Google account).
5. **Who has access:** Anyone (so the site can POST from the browser).
6. Click **Deploy**, authorize the app when asked, then copy the **Web app URL** (looks like `https://script.google.com/macros/s/.../exec`).

## 4. Wire it to the site

In `src/config/site.mjs`, set:

```js
googleSheetsScriptUrl: "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec",
```

Leave `web3formsAccessKey` empty if you’re only using Google Sheets. The contact form will POST to this URL and submissions will appear as new rows in your sheet.

---

**Optional:** To accept JSON instead of form data, the form can send `JSON.stringify({ from_name, from_email, message })` with `Content-Type: application/json`; the script already handles `e.postData.contents` for that.

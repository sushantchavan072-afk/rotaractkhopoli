# Saving form responses to Google Sheets

This guide connects every form on the website to one Google Sheet. Each response is added as a new row, and each form gets its own tab:

| Form on the website | Sheet tab |
|---|---|
| Join page application | `Membership application` |
| Board (BOD) application | `Board application` |
| Sponsorship enquiry | `Sponsorship enquiry` |
| Contact page message | `Website enquiry` |
| Footer "Subscribe" box | `Club updates` |
| "Send to the club" on a note (Reviews page) | `Notes` |

Tabs are created automatically the first time a form is used. The first row of each tab holds the column headings: **Submitted at**, then one column per question. If you add a question to a form later, a new column appears for it.

It takes about 10 minutes and costs nothing. It uses Google Apps Script, which comes free with any Google account.

---

## Step 1: Create the sheet

1. Go to [sheets.google.com](https://sheets.google.com) and sign in with the club's Google account (the one that should own the responses).
2. Click **Blank spreadsheet**.
3. Name it, for example **Rotaract Khopoli website responses**.

## Step 2: Add the script

1. In the sheet, open the menu **Extensions → Apps Script**. A new tab opens with a code editor.
2. Delete everything in the editor (the `function myFunction() {}` placeholder).
3. Copy the whole script below and paste it in.
4. Optional: to get an email for every response, put an address between the quotes on the `NOTIFY_EMAIL` line, for example `'rtrvageeshb@gmail.com'`.
5. Click the **Save** icon (or press Ctrl + S). Name the project **Website forms** if asked.

```js
/**
 * Rotaract Club of Khopoli website → Google Sheets.
 * Every form on the website posts its answers here; each form gets its own tab in this spreadsheet.
 */

// Optional: an address to email every response to. Leave it as '' for no emails.
const NOTIFY_EMAIL = '';

const MAX_FIELDS = 40;     // ignore anything beyond this many answers in one response
const MAX_LENGTH = 5000;   // longest answer kept, in characters

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000); // two responses at the same moment are written one after the other
    const data = JSON.parse(e.postData.contents);
    const form = String(data._form || 'Responses').replace(/[\[\]*?\/\\:]/g, ' ').trim().slice(0, 90) || 'Responses';
    const subject = String(data._subject || 'New ' + form);
    delete data._form;
    delete data._subject;
    const keys = Object.keys(data).slice(0, MAX_FIELDS);

    const book = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = book.getSheetByName(form) || book.insertSheet(form);

    // Header row: "Submitted at", then one column per question. New questions get new columns.
    const lastCol = sheet.getLastColumn();
    const headers = lastCol ? sheet.getRange(1, 1, 1, lastCol).getValues()[0] : ['Submitted at'];
    keys.forEach(function (k) { if (headers.indexOf(k) === -1) headers.push(k); });
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
    sheet.setFrozenRows(1);

    sheet.appendRow(headers.map(function (h) { return h === 'Submitted at' ? new Date() : clean(data[h]); }));

    if (NOTIFY_EMAIL) {
      MailApp.sendEmail(NOTIFY_EMAIL, subject, keys.map(function (k) { return k + ': ' + clean(data[k]); }).join('\n\n'));
    }
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// Opening the web app address in a browser shows this, which confirms the deployment works.
function doGet() {
  return json({ ok: true, message: 'The Rotaract Khopoli form endpoint is working.' });
}

function clean(value) {
  if (value === undefined || value === null) return '';
  let text = String(value).slice(0, MAX_LENGTH);
  // Answers starting with = + - or @ would be read as formulas; the apostrophe keeps them as plain text
  // (it also keeps phone numbers like +91 98… exactly as typed).
  if (/^[=+\-@]/.test(text)) text = "'" + text;
  return text;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
```

## Step 3: Publish it as a web app

1. At the top right of the Apps Script editor, click **Deploy → New deployment**.
2. Click the gear icon next to **Select type** and choose **Web app**.
3. Fill in:
   - **Description:** `Website forms`
   - **Execute as:** **Me** (your account)
   - **Who has access:** **Anyone**
4. Click **Deploy**.
5. Google asks you to authorise the script:
   1. Click **Authorize access** and choose your account.
   2. You may see **"Google hasn't verified this app"**. This is normal for your own scripts. Click **Advanced**, then **Go to Website forms (unsafe)**.
   3. Click **Allow**.
6. Copy the **Web app URL**. It looks like `https://script.google.com/macros/s/AKfy…/exec`.

**Check it works:** paste that URL into a new browser tab. You should see:
`{"ok":true,"message":"The Rotaract Khopoli form endpoint is working."}`

> **"Anyone" only means anyone can *send* a response**, which the public website needs. Nobody can read the sheet unless you share it with them.

## Step 4: Give the address to the website (Vercel)

1. Open [vercel.com](https://vercel.com), go to the **rotaractkhopolii** project, then **Settings → Environment Variables**.
2. Add a variable:
   - **Key:** `NEXT_PUBLIC_FORM_ENDPOINT`
   - **Value:** the Web app URL from step 3
   - **Environments:** tick **Production** and **Preview**
3. Click **Save**.
4. Go to **Deployments**, open the menu (**⋯**) on the latest deployment and click **Redeploy**.

   You must redeploy: the address is built into the site when it is deployed, so saving the variable alone does nothing.

## Step 5: Test every form

After the redeploy finishes, submit each form once on the live site:
- Join
- Board application
- Sponsorship
- Contact
- the footer Subscribe box
- "Send to the club" on a note on the Reviews page

Each should show "Thank you…" on the page, and a new row should appear in its tab in the sheet. Delete the test rows afterwards.

---

## Running it on your own computer

Create a file named `.env.local` in the project folder (next to `package.json`) containing:

```
NEXT_PUBLIC_FORM_ENDPOINT=https://script.google.com/macros/s/AKfy…/exec
```

Then restart `npm run dev`. This file is not uploaded to GitHub.

## Changing the script later

When you edit the script, the website keeps using the old version until you publish the new one:

1. Click **Deploy → Manage deployments**.
2. Click the pencil (edit) icon.
3. Set **Version** to **New version**.
4. Click **Deploy**.

The web app URL stays the same, so the website needs no change.

Do not use **New deployment** for an update. That creates a new URL, and you would have to update Vercel again.

## Without the sheet

If `NEXT_PUBLIC_FORM_ENDPOINT` is not set, every form opens the visitor's email app with the message ready to send to the club email (`clubEmail` in `data/club.js`). This is how the site works today.

## Troubleshooting

| What you see | What to do |
|---|---|
| The form says "Sorry, that did not go through" | Open the web app URL in a browser. If it does not show `"ok":true`, redeploy the script (step 3) and make sure **Who has access** is **Anyone**. |
| Nothing arrives, and the form still opens the email app | The variable is missing from the live site. Check its name is exactly `NEXT_PUBLIC_FORM_ENDPOINT`, then **Redeploy** on Vercel (step 4). |
| `{"ok":false,"error":"…"}` | The script hit an error. Open **Executions** in the Apps Script sidebar to see the details. Usually the script was pasted incompletely; paste it again, then publish a new version. |
| No email notifications | Check the `NOTIFY_EMAIL` address, publish a new version, and look in spam. Google allows about 100 emails a day on a free account. |
| You renamed a tab | The next response creates a new tab with the original name. Rename it back, or leave the tabs as they are. |
| You want to change which account owns the responses | Make a copy of the sheet under the other account, repeat steps 2–4 from that copy, and use its new URL on Vercel. |

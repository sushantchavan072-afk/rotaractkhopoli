# Rotaract Club of Khopoli website: what is left to do

The website is built and live. The design, pages, animations, forms, mobile layout and checks are finished. What remains is:

- **settings** that only the club's account owner can change;
- **real content** that only the club has;
- **a few decisions**.

Each item below says what is needed, why it matters and where it goes. Send anything in the "content" sections to your developer (or to Claude in this project) and it can be added in minutes.

Tick items off as you go by changing `[ ]` to `[x]`.

---

## Part 1: Settings (you do these yourself)

### 1. Connect the forms to Google Sheets
- [ ] Done

**Why:** right now every form (Join, Board application, Sponsorship, Contact, the footer Subscribe box and "Send to the club" on notes) only opens the visitor's email app with the message pre-filled. Many visitors never press Send, so responses get lost. Once Google Sheets is connected, every response is saved automatically as a row in a sheet, with one tab per form.

**How:** follow **`GOOGLE-SHEETS-SETUP.md`** in this project. It takes about 10 minutes. In short:
1. Create a Google Sheet.
2. Paste the script into **Extensions → Apps Script**.
3. Deploy it as a web app with access set to **Anyone**.
4. Copy the web app address into Vercel as the environment variable `NEXT_PUBLIC_FORM_ENDPOINT`.
5. Redeploy.
6. Submit each form once to test it.

**Tip:** do this after item 4 below (the club email), so the sheet and the optional email alerts belong to the club account rather than a personal one.

### 1a. Switch on the AI assistant (free, with Google Gemini)
- [ ] Done

**What it is:** Joey, the club's AI assistant. The robot button in the menu (and the round pink button on phones) opens a chat where visitors can ask anything about the club. It searches this website's own content (events, team, avenues, FAQs, blog, district and Rotary pages) and has an AI write a short answer from what it found, with numbered links to the pages it used. It never answers from outside the site.

**Right now** it runs in search-only mode: it lists the most relevant pages but doesn't write answers.

**Free option: Google Gemini.** A Gemini Pro subscription on its own doesn't include API access, but Google AI Studio gives every Google account a free API key with daily limits, which is plenty for a club website.
1. Sign in at **aistudio.google.com** with the club's Google account (item 4).
2. Click **Get API key → Create API key** (let it create a new project). Copy the key. No card or billing needed.
3. In **Vercel → Project → Settings → Environment Variables**, add `GEMINI_API_KEY` with that key, for Production (and Preview if you like).
4. Go to **Deployments → ⋯ → Redeploy**, then open the site, press the robot and ask a question.

Good to know:
- The free tier has per-minute and per-day limits. If they are reached, the assistant doesn't break: it lists the best-matching pages until the limit resets.
- On the free tier Google may use the questions and answers to improve its products. The questions are about the club's public information, and the chat asks visitors not to type personal details. The Privacy Policy says so too.
- To try a different Gemini model, add `GEMINI_MODEL` (default `gemini-3.8-flash`).
- When this website doesn't answer a question about the club or Rotary, the assistant looks it up with Google Search and marks that part "From the web" with links. Google Search has its own free daily allowance; when it runs out, the assistant answers from the site only. Add `AI_WEB_SEARCH` = `off` to switch web search off.
- Each Gemini model has its own small daily free allowance; the assistant moves to the next model automatically when one is used up.

**Paid option: Anthropic Claude.** Add `ANTHROPIC_API_KEY` instead (from console.anthropic.com, with a monthly spend limit set under Billing). It uses Claude Opus 5.5 at roughly $0.01–0.02 per answer. If both keys are set, Claude is used; add `AI_PROVIDER` = `gemini` to choose Gemini.

### 2. Get the site into Google (Search Console)
- [ ] Done

The website now works out its own address: on Vercel it uses the project's production domain (today `rotaractkhopolii.vercel.app`, and the club's own domain automatically once one is added in Vercel). Link previews, the sitemap and each page's "official" address all follow it, so nothing needs setting. `NEXT_PUBLIC_SITE_URL` still overrides it if ever needed.

**Why Search Console:** it tells Google the site exists, shows which searches bring people to it, and warns about problems.

**How:**
1. Open **search.google.com/search-console** with the club's Google account (see item 4) and choose **Add property → URL prefix**, entering the site's address.
2. For the verification step, choose **HTML tag** and copy the code inside `content="…"`. Send it to your developer: it goes into `app/layout.jsx` as `verification: { google: '…' }`. Then press **Verify**.
3. Under **Sitemaps**, submit `sitemap.xml`.
4. Optional: do the same at **bing.com/webmasters** (it can import from Search Console in one click).

**If the club buys a domain** (for example rotaractkhopoli.org or .in): add it in **Vercel → Project → Settings → Domains**, follow Vercel's DNS steps and set it as the production domain, then add it in Search Console as above.

### 3. Check Vercel is still linked to GitHub
- [ ] Done

**Why:** GitHub reported that the repository was renamed (between `rotaractkhopolii` and `rotaractkhopoli`). If Vercel lost the link, new changes pushed to GitHub would stop appearing on the live site.

**How:**
1. Open **Vercel → Project → Settings → Git** and check it shows the repository and the `main` branch.
2. Open **Deployments** and check the newest one matches the latest change, "Page and navbar animations, mobile fixes, Google Sheets forms, clean-up".
3. If it doesn't, reconnect the repository on that same Git settings page.

---

## Part 2: Content needed from the club

### 4. A shared club email address
- [ ] Received

**Why:** forms, the footer and the Contact page currently use **Vageesh's personal Gmail (rtrvageeshb@gmail.com)**. When the club's office bearers change next year, messages would still go to him. A shared inbox such as `rotaractkhopoli@gmail.com` stays with the club.

**Needed:**
- the new email address;
- which account should own the Google Sheet from item 1.

**Where it goes:** `data/club.js` → `contact.email`. The forms and the footer use it automatically.

### 5. Social media links
- [ ] Received

**Why:** the footer and Contact page have spots for social icons, but they stay hidden until links are added.

**Needed:** full links to any of these the club uses:
- Instagram
- LinkedIn
- YouTube
- Facebook

**Where it goes:** `data/club.js` → `contact.social`.

**Optional:** members' personal Instagram or LinkedIn links. They appear as small icons when someone hovers over that member's card on the Teams page.

### 6. Member photos still missing
- [ ] Received

These members show initials instead of a photo:

| Member | Role(s) |
|---|---|
| Rtr. Aniket Sardar | Immediate Past President, Rotaract-Rotary Relations Officer |
| Rtr. Harsh | Club Editor, Sports Chair |

**Needed:** one photo per person, **named with the person's name** (for example `aniket-sardar.jpg`).
- Best: a head-and-shoulders photo against a plain background, like the existing portraits.
- Any size works; they are cropped automatically.

Photos already on the site: Vageesh, Srushti, Mihir, Rohan, Khadija, Gargi, Sarvesh, Jayesh, Gaurav, Rutika, Piyush, Shreya and Anmay.

### 6a. Board for Rotaract year 2026–27
- [ ] Confirmed

The club's event reports say that at the 7th Installation Ceremony (2 August 2026) **Rtr. Vaishnav Phatak** was installed as President and **Rtr. Vageesh Baheti** as Secretary, with **Rtr. Mihir Butala** as Vice President, **Rtr. Aniket Sardar** as IPP and **Rtr. Anmay Narvekar** as Treasurer. The Team page and the Contact page still show the earlier board (Vageesh Baheti as President, Srushti Sathe as Secretary, Anmay Narwekar as Treasurer). The Ramparva banner in the hero photo also names Vageesh Baheti as President, so please confirm which board is current before the Team page is changed.

### 7. Full names
- [ ] Received

These members appear with first names only: **Rtr. Harsh**, **Rtr. Sarvesh**, **Rtr. Gaurav**.

**Needed:** their full names as they should appear on the site.

### 8. The Secretary's contact details (optional)
- [ ] Received / decided not to publish

**Needed:** Rtr. Srushti Sathe's email and/or phone, **only if** she is happy for them to be shown on the Contact page next to the President's.

### 9. Project photos
- [ ] Received

All stock photos have been removed: every photo on the site is now the club's own (see `public/images/CREDITS.md`). With only five group and event photos, some of them appear in more than one place, and most event pages show a coloured placeholder.

**Needed:**
- a photo for each event, named with the event's web address name (the `slug` in `data/club.js`), for example `project-bachpan.jpg`, `installation-ceremony.jpg`, `tree-plantation.jpg`, `paintscape.jpg`. Landscape photos work best;
- more photos for the Gallery page and the home page (fellowship, meetings, projects). Any good club photos help.

Extra photos from an event can also be added as a small gallery on that event's page.

### 10. Event details to confirm or complete
- [ ] Confirmed

The event list now comes from the club's own monthly reports (July, August, September and October 2026, and the Ramparva / Project Bachpan 2.0 report). Internal board and general body meetings are left out, and records of one event filed under several avenues are merged. A few details are still missing from the reports:

| Event | What is missing |
|---|---|
| Ramparva – Ek Diwali Sandhya (7 October) | Venue (shown as "Khopoli") and time |
| Mazha Bappa (13–26 September) | What the initiative was, and where |
| Samyati 4.0 (18 September – 20 October) | What the activity was |
| Gajsanskruti 10.0 (26 September) | What the club did there |
| ICYE visits (1 October) | A line on each exchange |
| Most events | Start and end times (shown only where the reports give them) |

**Where it goes:** `data/club.js` → `events`.

### 11. Results of completed projects
- [ ] Received

**Why:** the FAQ tells visitors that the club reports beneficiary numbers and spend for every project, and sponsors look for this. Each event page can show a row of figures, plus a short write-up of what happened.

Attendance from the reports is now shown on every event page, along with figures the reports give (trees planted, children reached, schools and so on). Beneficiary numbers and spend are still missing.

**Needed per event (whatever you have):**
- number of beneficiaries;
- volunteers or members present;
- money spent or raised;
- one or two other figures (saplings planted, kits given, attendees and so on);
- a few lines on what happened and what went well.

**Where it goes:** `data/club.js` → each event's `outcomes` and `report` fields.

### 12. The new Rotaract year's event calendar
- [ ] Received

**Why:** every event on the site is now in the past, so the "Upcoming" filter on the Events page is empty. Once the new dates are added, they appear straight away in the **club calendar** on the Events page (with "Next up", a countdown and Google Calendar / .ics buttons), and each upcoming event page gets an **Add to calendar** button.

**Needed for each planned event:**
- name;
- date and time;
- venue;
- avenue (Community Service, Professional Development and so on);
- partner club or organisation, if any;
- a one-line summary.

### 13. Real testimonials
- [ ] Received

**Why:** the testimonials section is **hidden** until there are real quotes. The old site's quotes were marked illustrative, so they were not used.

**Needed:** 3–6 short quotes from members, partners, beneficiaries or sponsors. For each:
- the quote;
- the person's name and role (for example "Headmistress, ZP School, Vavoshi");
- **their permission** to publish it.

The "Leave a note" wall on the Reviews page lets visitors send notes to the club. Good ones (with permission) can become testimonials.

---

## Part 3: Decisions

### 14. Membership fee
- [ ] Decided

The FAQ currently says there is "a nominal annual subscription" without an amount. Decide whether to publish the exact fee (and what it covers) or keep it vague.

### 15. Partners named on the site
- [ ] Confirmed

Event pages now name the partner clubs and organisations given in the club's reports (for example Rotary Club of Khopoli, Rotaract Club of KGRDCP, Rotaract Club of Bicholim, Khopoli Municipal Council, the Traffic Police Department, and Project Bachpan 2.0's sponsors Weblution and Artist Duck – Media and Tech). Please confirm they are happy to be named.

### 16. Blog posts
- [ ] Reviewed

The blog has 6 articles. They were written for the site from the club's information:
1. Our story: a Rotaract club built during a difficult year
2. The seven avenues of service, explained
3. A year of projects: from Paintscape to Project Bachpan (rewritten from the club's event reports)
4. How to join Rotaract Club of Khopoli
5. What is Rotaract District 3131?
6. Rotary, Rotaract and Interact: one family

Please have someone read them for accuracy and tone. Correct, replace or remove any of them, and add new posts (for example a write-up after each project). Each post needs a title, a date, a cover photo, a two-line summary and the text.

---

## Quick summary

| # | Item | Who | Priority |
|---|---|---|---|
| 1 | Connect forms to Google Sheets | You | **High** |
| 1a | Switch on the AI assistant (free Gemini key) | You | **High** |
| 2 | Add the site to Google Search Console | You | **High** |
| 3 | Check the Vercel and GitHub link | You | **High** |
| 4 | Shared club email | Club | **High** |
| 9 | Event and gallery photos | Club | **High** |
| 10 | Confirm event details | Club | **High** |
| 5 | Social media links | Club | Medium |
| 6a | Confirm the 2026–27 board | Club | **High** |
| 6 | Missing member photos | Club | Medium |
| 7 | Full names (Harsh, Sarvesh, Gaurav) | Club | Medium |
| 12 | New event calendar | Club | Medium |
| 11 | Project results | Club | Medium |
| 13 | Testimonials | Club | Medium |
| 16 | Review blog posts | Club | Medium |
| 8 | Secretary's contact details | Club | Low |
| 14 | Membership fee | Board decision | Low |
| 15 | Partners named | Board decision | Low |

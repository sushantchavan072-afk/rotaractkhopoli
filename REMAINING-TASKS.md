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

### 2. Set the website's real address
- [ ] Done

**Why:** the site currently assumes its address is `https://rotaractkhopoli.org`. That address is used for:
- link previews when the site is shared on WhatsApp, Instagram or LinkedIn;
- the sitemap that Google reads;
- the "official" address of each page in search results.

If the club does not own that domain, previews and search results point to a site that doesn't exist.

**How (choose one):**
- **No custom domain yet:**
  1. In Vercel go to **Project → Settings → Environment Variables**.
  2. Add `NEXT_PUBLIC_SITE_URL` = `https://rotaractkhopolii.vercel.app` for Production.
  3. Go to **Deployments → ⋯ → Redeploy**.
- **The club buys a domain** (for example rotaractkhopoli.org or .in):
  1. Add it in **Vercel → Project → Settings → Domains** and follow Vercel's DNS steps.
  2. Set `NEXT_PUBLIC_SITE_URL` to that domain.
  3. Redeploy.

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
| Rtr. Anvay Narwekar | Treasurer |
| Rtr. Piyush Phatak | Club Service Director |
| Rtr. Shreya Salunkhe | Community Service Director, Sergeant-at-Arms |
| Rtr. Aniket Sardar | Immediate Past President, Rotaract-Rotary Relations Officer |
| Rtr. Harsh | Club Editor, Sports Chair |

**Needed:** one photo per person, **named with the person's name** (for example `anvay-narwekar.jpg`).
- Best: a head-and-shoulders photo against a plain background, like the existing portraits.
- Any size works; they are cropped automatically.

Photos already on the site: Vageesh, Srushti, Mihir, Rohan, Khadija, Gargi, Sarvesh, Jayesh, Gaurav and Rutika.

### 7. Full names
- [ ] Received

These members appear with first names only: **Rtr. Harsh**, **Rtr. Sarvesh**, **Rtr. Gaurav**.

**Needed:** their full names as they should appear on the site.

### 8. The Secretary's contact details (optional)
- [ ] Received / decided not to publish

**Needed:** Rtr. Srushti Sathe's email and/or phone, **only if** she is happy for them to be shown on the Contact page next to the President's.

### 9. Real project photos (to replace the stock photos)
- [ ] Received

Several images are still **temporary stock photos** from Unsplash (listed in `public/images/CREDITS.md`). They look fine, but a club site is far more convincing with its own pictures.

| Where it appears | Current file | What would suit it |
|---|---|---|
| Home page hero (also in the intro animation and on link previews) | `hero.jpg` | A bright group photo of members at a project, landscape |
| Home and About "Our story" photo | `volunteer.jpg` | A member at a project |
| Gallery page and photos around the home page | `gallery/1.jpg` … `gallery/7.jpg` | Any 7 good project or fellowship photos |
| Event: Maha Aarti | `events/maha-aarti.jpg` | Photo from that event |
| Event: Paintscape | `events/paintscape.jpg` | 〃 |
| Event: Joint Meeting with RAC Saanjh Delhi | `events/joint-meeting.jpg` | A screenshot of the online meeting is fine |
| Event: Gau Seva | `events/gau-seva.jpg` | Photo from that event |
| Event: Zoo Day with RAC Bicholim | `events/zoo-day.jpg` | 〃 |
| Event: DEI Session | `events/dei-session.jpg` | 〃 |
| Event: Tree Plantation | `events/tree-plantation.jpg` | 〃 |
| Event: PD Session (Canva Hacks) | `events/pd-session.jpg` | A screenshot of the session is fine |
| Blog post covers | reuse the gallery and event photos | Not needed separately |

Already real: Cyber Crime Awareness, Road Safety Drive, the team photo in "Together, we can make a difference", leaders' photos and logos.

**Needed:** photos labelled with the event name. Landscape photos work best for events and the hero. Extra photos from an event can also be added as a small gallery on that event's page.

### 10. Event details to confirm or complete
- [ ] Confirmed

The event list came from the old website, and its dates, times and venues were marked as **indicative**. Please check each row and correct anything wrong:

| Date on site | Time on site | Event | Venue on site |
|---|---|---|---|
| 14 June 2026 | 6:30 PM - 9:00 PM | Maha Aarti | Shree Ram Mandir, Khopoli |
| 1 July 2026 | 11:00 AM onwards | Paintscape | Shaniwarwada Premises, Khopoli |
| 26 July 2026 | 7:00 PM - 8:30 PM | Joint Meeting with RAC Saanjh Delhi | Online · Zoom |
| 9 August 2026 | 8:00 AM - 12:00 PM | Gau Seva | Gaushala, Vavoshi Road, Khopoli |
| 23 August 2026 | 9:30 AM - 3:00 PM | Zoo Day with RAC Bicholim | Bondla Wildlife Sanctuary, Goa |
| 6 September 2026 | 5:00 PM - 7:00 PM | DEI Session | Rotary Bhavan, Khopoli |
| 20 September 2026 | 7:30 AM - 11:00 AM | Tree Plantation | Khopoli Municipal Ground & Hill Slope |
| 7 October 2026 | **missing** | Cyber Crime Awareness | **"Khopoli" only** (exact place?) |
| 11 October 2026 | 6:00 PM - 8:00 PM | PD Session: Creative PPT Making & Canva Hacks | Online · Google Meet |
| 15 October 2026 | **missing** | Road Safety Awareness Drive | **"Khopoli" only** (exact place?) |

**Where it goes:** `data/club.js` → `events`.

### 11. Results of completed projects
- [ ] Received

**Why:** the FAQ tells visitors that the club reports beneficiary numbers and spend for every project, and sponsors look for this. Each event page can show a row of figures, plus a short write-up of what happened.

**Needed per event (whatever you have):**
- number of beneficiaries;
- volunteers or members present;
- money spent or raised;
- one or two other figures (saplings planted, kits given, attendees and so on);
- a few lines on what happened and what went well.

**Where it goes:** `data/club.js` → each event's `outcomes` and `report` fields.

### 12. The new Rotaract year's event calendar
- [ ] Received

**Why:** every event on the site is now in the past, so the "Upcoming" filter on the Events page is empty. Upcoming events also get an **Add to calendar** button.

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

These organisations are named as partners on event pages:
- Rotary Club of Khopoli
- Rotaract Club Saanjh, Delhi
- Rotaract Club of Bicholim
- Khopoli Municipal Council
- Interact Club of Khopoli
- the Traffic Police Department

Please confirm they are happy to be named.

### 16. Blog posts
- [ ] Reviewed

The blog has 6 articles. They were written for the site from the club's information:
1. Our story: a Rotaract club built during a difficult year
2. The seven avenues of service, explained
3. A year of projects: from Maha Aarti to Canva hacks
4. How to join Rotaract Club of Khopoli
5. What is Rotaract District 3131?
6. Rotary, Rotaract and Interact: one family

Please have someone read them for accuracy and tone. Correct, replace or remove any of them, and add new posts (for example a write-up after each project). Each post needs a title, a date, a cover photo, a two-line summary and the text.

---

## Quick summary

| # | Item | Who | Priority |
|---|---|---|---|
| 1 | Connect forms to Google Sheets | You | **High** |
| 2 | Set the real website address | You | **High** |
| 3 | Check the Vercel and GitHub link | You | **High** |
| 4 | Shared club email | Club | **High** |
| 9 | Real project photos | Club | **High** |
| 10 | Confirm event details | Club | **High** |
| 5 | Social media links | Club | Medium |
| 6 | Missing member photos | Club | Medium |
| 7 | Full names (Harsh, Sarvesh, Gaurav) | Club | Medium |
| 12 | New event calendar | Club | Medium |
| 11 | Project results | Club | Medium |
| 13 | Testimonials | Club | Medium |
| 16 | Review blog posts | Club | Medium |
| 8 | Secretary's contact details | Club | Low |
| 14 | Membership fee | Board decision | Low |
| 15 | Partners named | Board decision | Low |

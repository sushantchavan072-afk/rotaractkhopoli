# Rotaract Club of Khopoli — website

A multi-page Next.js website for **Rotaract Club of Khopoli** (Club ID 21869318, Rotaract District 3131), styled after the Kindora layout: Urbanist type, a coral, green and yellow palette, pill labels, rounded cards and dark pill buttons.

All content comes from the club's existing site ([rotaractkhopoli](https://github.com/sushantchavan072-afk/rotaractkhopoli)): club facts, avenues, events, members, FAQs, district and Rotary information, sponsorship tiers and join commitments.

## Run it

**Windows:** install Node.js 22 LTS, then double-click `START-WINDOWS-KEEP-OPEN.cmd`. Open http://localhost:3000 once it says *Ready*.

**Any OS:**

```bash
npm install
npm run dev
```

**Production:** `npm run build` then `npm start`. This also deploys to Vercel as-is.

## Pages

| URL | Page |
|---|---|
| `/` | Home: hero, club numbers, who we are, avenues, events, district stats, board, testimonials, FAQs |
| `/about` | Story, structure, charter facts, Rotary / Rotaract / Interact |
| `/avenues` | All seven avenues of service |
| `/events` and `/events/<slug>` | Event list and one page per event |
| `/members` | Core team, board of directors, chairpersons |
| `/district-3131` | Rotaract District 3131 |
| `/rotary-information` | Rotary International |
| `/faqs` | All FAQs, grouped |
| `/join` | Membership commitments and the application form |
| `/sponsorship` | Partnership tiers and the enquiry form |
| `/contact` | Board contacts and a message form |

## Editing content

Everything is in **`data/club.js`**: officers, events, members, avenues, FAQs and testimonials. Edit that file and the pages update.

- Add an event by appending to `events` with a unique `slug`. Its page is created automatically.
- Page layouts are in `components/pages.jsx`. The header, footer, forms and image helper are in `components/ui.jsx`.
- Styles are in `app/globals.css`. The design tokens are at the top, and the Rotaract-specific additions are at the bottom.

## Photos

Until a photo is added, its slot shows a soft coloured tile with a label, so nothing looks broken. To add photos, drop files into `public/images/` with these names:

| File | Used for |
|---|---|
| `public/images/hero.jpg` | Home page hero (large, portrait-ish) |
| `public/images/about.jpg` | About page hero |
| `public/images/events/<slug>.jpg` | Each event, e.g. `tree-plantation.jpg`, `maha-aarti.jpg`, `paintscape.jpg`, `joint-meeting.jpg`, `gau-seva.jpg`, `zoo-day.jpg`, `dei-session.jpg`, `pd-session.jpg` |
| `public/images/members/<photo>.png` | Member portraits: `rohan.png`, `gargi-gaikwad.png`, `khadija-bearingwala.png`, `sarvesh.png`, `jayesh-dalvi.png`, `gaurav.png` (set `photo:` in `data/club.js` for others) |

The original site stored these photos in Lovable's asset storage, not in its Git repo, so they could not be copied over automatically.

## Forms

The Join, Sponsorship and Contact forms open the visitor's email app with the message pre-filled and addressed to the club email (`clubEmail` in `data/club.js`). This needs no backend. To store submissions in a database instead, as the old Supabase setup did, replace `MailForm`'s submit handler in `components/ui.jsx`.

## Not carried over

- The **Ask the club** AI chat. It needs a server-side AI key and backend.
- The **BOD application** form and the member badge / lanyard dialogs.

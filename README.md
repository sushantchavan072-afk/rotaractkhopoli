# Rotaract Club of Khopoli — website

The website of **Rotaract Club of Khopoli** (Club ID 21869318, Rotaract District 3131), built with Next.js.

- **Design:** modelled on the Kindora charity layout:
  - pill navigation over the home-page hero photo, and a header that sticks to the top on scroll;
  - coral, black, yellow and green cards, a green volunteering block, a bordered "ways to help" grid, a coral closing call-to-action and a grey FAQ panel;
  - a white footer (with "Made with ♥ by Gargi Gaikwad");
  - the **Segoe UI** font (from the visitor's device; Windows has it built in, other devices use their closest system font) and the **react-icons** (Font Awesome 6) icon set Kindora uses.
- **Content:** everything lives in **`data/club.js`**.

## Run it

**Windows:** install Node.js 22 LTS, then double-click `START-WINDOWS-KEEP-OPEN.cmd`. Open http://localhost:3000 once it says *Ready*.

```bash
npm install
npm run dev      # local preview
npm run lint     # code checks
npm run build    # production build
```

## Deploy (recommended: Vercel, free)

1. Import this GitHub repo at https://vercel.com/new. No extra settings are needed.
2. Add these environment variables under Project → Settings → Environment Variables:

   | Variable | Example | What it does |
   |---|---|---|
   | `NEXT_PUBLIC_SITE_URL` | `https://rotaractkhopoli.org` | Used for the sitemap, share links and Google |
   | `NEXT_PUBLIC_FORM_ENDPOINT` | `https://formspree.io/f/abcdwxyz` | Optional. Delivers form submissions to the club inbox, with no email app needed (see below) |

3. Connect your domain under Project → Settings → Domains.

Visitor statistics (Vercel Analytics, which uses no cookies) switch on automatically when the site runs on Vercel.

## Pages

| URL | Page (Kindora equivalent) |
|---|---|
| `/` | Home: hero, impact cards, results with charts, volunteering, projects, numbers, ways to help, banner, call-to-action, FAQ |
| `/about` | About Us |
| `/teams` | Our Team (Teams). `/members` redirects here |
| `/events` and `/events/<slug>` | Projects with a featured project, filters and pagination, plus detail pages (Programs) |
| `/avenues` and `/avenues/<slug>` | The seven avenues, each with its projects and leads |
| `/blog`, `/blog/<slug>` and `/blog/page/<n>` | Blog list, pagination and posts (Blog) |
| `/reviews` | Reviews. Shows real testimonials, or a form to collect them |
| `/sponsorship` | Sponsorship form and partnership packages (Donation) |
| `/contact` | Contact cards, "Why reach out" and the chat form |
| `/gallery`, `/join`, `/bod-application`, `/faqs` | Gallery, membership, board application and FAQs |
| `/district-3131`, `/rotary-information` | The district and Rotary International |
| `/privacy-policy`, `/terms-and-conditions` | Legal pages |

Kindora's `/elements` page is a template style guide, so it is not included.

## Header, background, cursor and colours

**Page changes:** every new page opens at the top (`useScrollToTopOnPageChange` in `components/ui.jsx`). Back/forward keeps your place, and links to a `#section` still scroll smoothly.

**Header:** the logo sits on its own with no box, and fades away once you scroll so it never covers text. The menu items float in one pill that stays while scrolling. On the home page the pill sits inside the hero photo with even space around it, and on phones the menu opens as a floating rounded card.

**Team members** (`components/ui/team-02.tsx`, from 21st.dev, with shadcn's `Badge` in `components/ui/badge.tsx`):
- Used on the home page, the Teams page and each avenue's leads.
- Each member shows a large photo (or initials), their name and roles.
- On hover, the photo darkens and shows "View badge" and any social links, which come from an optional `socials: { instagram, linkedin }` on the member in `data/club.js`.
- Clicking opens the member's lanyard badge.
- The header and cards animate in with `motion`.

**World map** (`components/ui/map.tsx`, from Aceternity) on the International Service avenue page:
- Arcs run from Khopoli to RAC Saanjh (Delhi), RAC Bicholim (Goa) and Rotary International (Evanston).
- The dotted map is a pre-built static file, `public/images/world-dots.svg` (rebuild it with `node scripts/build-world-map.mjs`).
- Points are placed at build time by `lib/world-map.js`, so visitors never download `dotted-map`.
- To add a place, add it to `INTERNATIONAL_ARCS` in `components/pages.jsx`.

**Why no Tailwind:** both components were written for Tailwind and shadcn. Their classes are translated into plain CSS in `app/globals.css` (`.team02-*`, `.badge*`, `.world-map*`). The site has no Tailwind, and adding it would reset the existing styles. `next-themes`, `lucide-react`, `class-variance-authority` and `framer-motion` were not needed: the site is light only, the icons are inline SVG, the badge variants are plain classes, and `motion` is the current name of framer-motion.


The site is **light mode only**.

**Home page intro** (`components/ui/intro-overlay.jsx`), modelled on radiatinghope.org:
1. The club logo fades in on white with a plain fade, then **turns to dust** as it leaves. This uses [vanilla-disintegrate](https://github.com/uvarov-frontend/vanilla-disintegrate)'s `dust` preset with SnapDOM, with the sound off. The library is downloaded only when the intro plays, and browsers without WebGL2 get a simple fade instead.
2. The hero photo fades in, rising from the bottom as a big rounded card that almost fills the screen.
3. The card slides across into its place in the hero on the right while the headline rises. On phones, where the hero photo is below the fold, it slides off to the right instead.
4. Once the photo has landed, the menu pill and the things on the photo (quote, gallery link, project card) come in.

For smoothness, only transform, opacity and clip-path are animated, so the browser can hand the work to the GPU. The photo is never resized frame by frame.

It plays once per browser session, only on the home page. It never plays for visitors who prefer reduced motion. Any click, key press, scroll or tap skips it.
- A small script in `app/layout.jsx` decides before the first paint, so nothing flashes, and it always uncovers the page after 8 seconds.
- Add `?intro=1` to the home page URL to replay it.


**Background:** a drafting grid (`public/images/grid.svg`, a 120px tile: fine dots every 6px, a darker dot every 60px and a cross every 120px) shown at 20% through a white veil, with a soft wash of coral, Rotary blue, cranberry and green on top (`--page-gradient` on `body` in `app/globals.css`). It is static, with no warp.

**Mouse trail** (`components/ui/background-dot-glow.tsx`):
- Moving the mouse leaves a short trail of characters in the Rotary family colours.
- Nothing is redrawn while the mouse is still, and the animation stops while the tab is hidden.
- Touch screens and visitors who prefer reduced motion get no trail.

**Cursor** (`components/ui/custom-cursor.tsx`), matched to rotaractscop.org:
- On mouse and trackpad devices, the system pointer is replaced by a 14px arrow. Its colour depends on the page: navy on the home page, cranberry on Teams, Rotary blue on the Rotary page, and so on (`PAGES` in `lib/accent.js`).
- Every click gives a small spark burst.
- Phones and tablets keep their normal behaviour. Tapping no longer flashes a blue box or selects text.

**Colours that follow the scroll** (`lib/accent.js`): the click sparks blend through Rotaract cranberry, Rotary blue, Rotary gold, Interact blue, green and coral as you scroll, one colour every 700px. Each page starts at a different colour.

**Member badges** (`components/ui/lanyard-badge.tsx`, from the club's original site): clicking any member on the Teams page or the home page opens their badge on a swinging lanyard.
- You can drag it and flick it to spin.
- Tap it, or use "Show back", to flip it. The front has their photo and name; the back lists every role they hold this year.
- Esc, the × button or a click outside closes it.
- It loads only when someone opens a badge.

**Hover to expand** (`useHoverIntent` in `components/ui.jsx`):
- **FAQs:** rest the mouse on a question for a moment and it opens, while the one that was open closes.
- **Leader messages** (RI President, District Governor, DRR): the full message unfolds smoothly and stays open; "Show less" folds it.
- **Testimonial cards** show long quotes in full on hover, and notes on the Reviews wall lift and grow.
- Clicking and keyboard work as before, and touch screens use taps.
- When something opens or closes, the page shifts under a still mouse. Only real mouse movement counts, so one item opening never sets off a chain of others.

**Button hover colours:**
- Each button lights up in its own colour when the mouse is over it: Rotary blue, cranberry, green, Rotary gold, Interact blue or coral.
- Neighbouring buttons get different colours, and buttons in the "ways to help" cards match their card's icon.
- The colours are assigned in `tintButtons` in `components/ui.jsx` and styled by `[data-hue]` in `app/globals.css`.
- Hover shadows are kept light.

**Rotary family colours** (`--rotary-blue`, `--rotary-gold`, `--rotaract`, `--interact` and their light tints, at the top of `app/globals.css`) are used alongside the Kindora palette:
- section label dots, and the blue card tint;
- the leader cards: Rotary blue for the RI President, Rotary gold for the District Governor, Rotaract cranberry for the DRR;
- the number cards: Rotary gold and blue on the Rotary page, cranberry on the District page;
- the event partner badge, the line above the footer's bottom row, text selection, the sparks and the trail.

### Why there is TypeScript but no Tailwind or shadcn

The background and cursor components are TypeScript, so the project now includes TypeScript (`tsconfig.json`, with the `@/*` import alias). It also uses shadcn's convention of keeping shared UI components in `components/ui/`, so tools and copy-paste components find them at the expected path.

Tailwind is **not** installed on purpose. The background only used a few utility classes (`block h-full w-full text-foreground`, plus `fixed inset-0` for placement), which are now the `.site-bg` rule in `globals.css`. Tailwind's base styles ("preflight") would reset this site's hand-written stylesheet. If you later want Tailwind or shadcn components anyway:

```bash
npx shadcn@latest init
```

This sets up Tailwind and `components.json`. Then check every page, because the base styles will change spacing and typography.

## Updating content (`data/club.js`)

- **Club email:** set `contact.email` to a shared club inbox. Until then, forms go to the president's address.
- **Social links:** fill in `contact.social`. Icons appear automatically.
- **New Rotaract year:** update `rotaractYear`, `officers`, `coreMembers`, `boardOfDirectors` and `chairpersons`.
- **Blog:** add to `posts` in `data/club.js`. The blog lists 6 per page, and `/blog/page/2` appears automatically once there are more.
- **Events:** add to `events` with a unique `slug` and its own page appears. Add a photo at `public/images/events/<slug>.jpg`. For completed projects, add `outcomes`, `report` and `gallery` to show results on the event page.
- **Upcoming/Completed labels** are worked out in the visitor's browser, so they stay correct without a rebuild.
- **Testimonials:** add only real, consented quotes to `testimonials`. The section stays hidden while the list is empty.
- **Member photos:** save them as `public/images/members/<photo>.webp` (or `.png` / `.jpg`) and set `photo:` on the member. Members without a photo show their initials.

## Leave a note (Reviews page)

The "Share your experience" section on `/reviews` is a note wall (`NoteWall` in `components/ui.jsx`):

- visitors write a short note (up to 140 characters), add their name if they like, pick a colour and pin it to the wall;
- notes are saved only in that visitor's browser, so the wall is a keepsake, not a public guestbook;
- each note has a **Send to the club** button, which sends it like the other forms (see below).

A public wall that everyone can see would need a database. Ask if you want one.

## Forms

The Join, Board application, Sponsorship, Contact and footer forms work in two ways:

1. **With `NEXT_PUBLIC_FORM_ENDPOINT` set** (recommended): submissions are posted to a form service such as [Formspree](https://formspree.io), which emails them to the club inbox. The visitor sees a confirmation on the page.
2. **Without it:** the form opens the visitor's email app with the message ready to send to the club email.

## Logos

The official logos are in `public/images/logos/`:

- `rotaract-khopoli.png`: the club logo, used in the header, the footer and on the share image. `rotaract-khopoli-white.png` is a white version for dark backgrounds.
- `rotaract-district-3131.png`, `rotary-district-3131.png` and `interact-district-3131.png`: used in the "Rotary family" strip on the home page, on the About page, and on the District and Rotary pages.

The browser-tab icon (`app/icon.png`) and the home-screen icon (`app/apple-icon.png`) are cut from the club logo's wheel. Use the logos unchanged, as Rotary's brand guidelines require.

## Photos

Until a photo is added, its slot shows a soft coloured tile with a label, so nothing looks broken.

**Member portraits** are in `public/images/members/` as `<photo>.webp`. `<photo>` is the `photo:` value in `data/club.js`, and `.png` or `.jpg` also work. The current files are `vageesh`, `rohan`, `khadija-bearingwala`, `gargi-gaikwad`, `sarvesh`, `jayesh-dalvi` and `gaurav` (from the club's original Lovable site), plus `mihir-butala`, `rutika-zavar` and `srushti-sathe`. To add someone, drop in a square portrait and set `photo:` on every entry for that person.

## Still needed from the club

- [ ] A shared club email (`contact.email`) and social media links
- [ ] Real photos of projects and members
- [ ] Full names for Rtr. Harsh, Rtr. Sarvesh and Rtr. Gaurav
- [ ] The secretary's contact details
- [ ] Real, consented testimonials
- [ ] Outcomes for completed projects (beneficiaries, volunteers, money spent)
- [ ] The new Rotaract year's event calendar
- [ ] The membership fee, if it should be published
- [ ] Confirmation that the partners listed under "Working alongside" are happy to be named

# Rotaract Club of Khopoli — website

The website of **Rotaract Club of Khopoli** (Club ID 21869318, Rotaract District 3131), built with Next.js.

- **Design:** modelled on the Kindora charity layout:
  - pill navigation over the home-page hero photo, and a header that sticks to the top on scroll;
  - coral, black, yellow and green cards, a green volunteering block, a bordered "ways to help" grid, a coral closing call-to-action and a grey FAQ panel;
  - a footer over a dithered mountain range (the Sahyadri ghats Khopoli sits under);
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

## Background and footer

The site is **light mode only**.

**Background:** `components/ui/background-ascii-wake.tsx` (WakeGlyph). A faint scatter of monospace characters sits behind the page. When the mouse moves, it leaves a short trail of characters that fades away. It is tuned to stay light:

- it draws once and then does nothing until the mouse moves, so an idle page uses no CPU;
- the animation runs only while a trail is fading, and stops while the tab is hidden;
- touch drags (scrolling on phones) don't draw trails, and visitors who prefer reduced motion get the still scatter only;
- the character colour is the `color` of `.site-bg` in `app/globals.css`.

**Footer:** `components/ui/ridgeline-dither-footer.tsx` (Ridgeline Dither Footer), set up in `Footer()` in `components/ui.jsx`. That function holds the club's logo, tagline, link columns, copyright and "Made with ♥" credit.

- The mountains build in when the footer scrolls into view.
- The mist drifts while the footer is on screen, at about 15 fps. The pointer clears the mist and shows an altitude readout, and a click sends a gust of wind.
- Nothing runs while the footer is off screen or the tab is hidden.
- Social icons appear automatically once `contact.social` is filled in `data/club.js` (Instagram, LinkedIn, YouTube).

### Why there is TypeScript but no Tailwind or shadcn

These components are TypeScript, so the project now includes TypeScript (`tsconfig.json`, with the `@/*` import alias). It also uses shadcn's convention of keeping shared UI components in `components/ui/`, so tools and copy-paste components find them at the expected path.

Tailwind is **not** installed on purpose. The background only used a few utility classes (`block h-full w-full text-foreground`, plus `fixed inset-0` for placement), which are now the `.site-bg` rule in `globals.css`; the footer carries its own scoped styles. Tailwind's base styles ("preflight") would reset this site's hand-written stylesheet. If you later want Tailwind or shadcn components anyway:

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
- **Member photos:** save them as `public/images/members/<photo>.png` and set `photo:` on the member. Members without a photo show their initials.

## Forms

The Join, Board application, Sponsorship and Contact forms work in two ways:

1. **With `NEXT_PUBLIC_FORM_ENDPOINT` set** (recommended): submissions are posted to a form service such as [Formspree](https://formspree.io), which emails them to the club inbox. The visitor sees a confirmation on the page.
2. **Without it:** the form opens the visitor's email app with the message ready to send to the club email.

## Logos

The official logos are in `public/images/logos/`:

- `rotaract-khopoli.png`: the club logo, used in the header, the footer and on the share image. `rotaract-khopoli-white.png` is a white version for dark backgrounds.
- `rotaract-district-3131.png`, `rotary-district-3131.png` and `interact-district-3131.png`: used in the "Rotary family" strip on the home page, on the About page, and on the District and Rotary pages.

The browser-tab icon (`app/icon.png`) and the home-screen icon (`app/apple-icon.png`) are cut from the club logo's wheel. Use the logos unchanged, as Rotary's brand guidelines require.

## Photos

Many photos are **temporary Unsplash stock images** (see `public/images/CREDITS.md`). To use the club's own photos, replace each file and keep its name. Then regenerate the share image `public/og.jpg` (1200×630).

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

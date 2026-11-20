# Rotaract Club of Khopoli — website

The website of **Rotaract Club of Khopoli** (Club ID 21869318, Rotaract District 3131), built with Next.js.

- **Design:** Rotaract cranberry, Rotary azure and gold on warm cream. Headings use **Fraunces**, a warm serif. Body text uses **Open Sans**, Rotary's recommended web font. Both fonts are self-hosted, so pages don't wait on Google Fonts.
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

| URL | Page |
|---|---|
| `/` | Home: hero, impact numbers, mission, what we do, ways to get involved, avenues, recent projects, gallery, board |
| `/about` | Story, structure, charter facts, the Rotary family |
| `/avenues` and `/avenues/<slug>` | All avenues, plus one page per avenue with its projects and leads |
| `/events` and `/events/<slug>` | Events with Upcoming/Completed and avenue filters; event pages with add-to-calendar and share |
| `/gallery` | Photo gallery |
| `/members` | Core team, board and chairs for the current Rotaract year |
| `/district-3131`, `/rotary-information` | The district and Rotary International |
| `/faqs` | Searchable FAQs |
| `/join`, `/bod-application`, `/sponsorship`, `/contact` | Forms |
| `/privacy-policy` | How form data is handled |

## Updating content (`data/club.js`)

- **Club email:** set `contact.email` to a shared club inbox. Until then, forms go to the president's address.
- **Social links:** fill in `contact.social`. Icons appear automatically.
- **New Rotaract year:** update `rotaractYear`, `officers`, `coreMembers`, `boardOfDirectors` and `chairpersons`.
- **Events:** add to `events` with a unique `slug` and its own page appears. Add a photo at `public/images/events/<slug>.jpg`. For completed projects, add `outcomes`, `report` and `gallery` to show results on the event page.
- **Upcoming/Completed labels** are worked out in the visitor's browser, so they stay correct without a rebuild.
- **Testimonials:** add only real, consented quotes to `testimonials`. The section stays hidden while the list is empty.
- **Member photos:** save them as `public/images/members/<photo>.png` and set `photo:` on the member. Members without a photo show their initials.

## Forms

The Join, Board application, Sponsorship, Contact and footer forms work in two ways:

1. **With `NEXT_PUBLIC_FORM_ENDPOINT` set** (recommended): submissions are posted to a form service such as [Formspree](https://formspree.io), which emails them to the club inbox. The visitor sees a confirmation on the page.
2. **Without it:** the form opens the visitor's email app with the message ready to send to the club email.

## Photos

Many photos are **temporary Unsplash stock images** (see `public/images/CREDITS.md`). To use the club's own photos, replace each file and keep its name. Then regenerate the share image `public/og.jpg` (1200×630).

## Still needed from the club

- [ ] The official Rotaract club logo from Rotary's Brand Center, to replace the placeholder wheel in `components/ui.jsx` (`Logo`)
- [ ] A shared club email (`contact.email`) and social media links
- [ ] Real photos of projects and members
- [ ] Full names for Rtr. Harsh, Rtr. Sarvesh and Rtr. Gaurav
- [ ] The secretary's contact details
- [ ] Real, consented testimonials
- [ ] Outcomes for completed projects (beneficiaries, volunteers, money spent)
- [ ] The new Rotaract year's event calendar
- [ ] The membership fee, if it should be published
- [ ] Confirmation that the partners listed under "Working alongside" are happy to be named

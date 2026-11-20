import { existsSync } from 'node:fs';
import { join } from 'node:path';
import Link from 'next/link';
import {
  ArrowRight, CalendarDays, Clock, MapPin, Handshake, Mail, Phone, Quote, Check,
  HandHeart, GraduationCap, Users, Globe2, Megaphone, HeartHandshake, Sparkles, Award,
} from 'lucide-react';
import {
  club, clubFacts, officers, clubEmail, contact, avenues, events, eventsNewestFirst, formatDate,
  coreMembers, boardOfDirectors, chairpersons, uniqueMemberCount, initials, testimonials,
  faqGroups, district, rotary, sponsorTiers, joinCommitments, rotaractYear,
  membersWithRoles, eventsForAvenue, SITE_URL, FAMILY_LOGOS,
} from '../data/club';
import {
  Btn, Eyebrow, Intro, Section, PageHero, Photo, FaqSearch, MailForm, SocialLinks,
  EventCard, EventsExplorer, EventStatus, EventActions, FamilyLogos,
} from './ui';
import Image from 'next/image';

const ICONS = { HandHeart, GraduationCap, Users, Globe2, Megaphone, HeartHandshake, Sparkles };
const eventImage = (e) => `/images/events/${e.slug}.jpg`;
/** Only point at a member photo that actually exists in /public, so missing portraits never trigger a 404. */
const memberImage = (m) => {
  if (!m.photo) return undefined;
  const rel = `/images/members/${m.photo}.png`;
  return existsSync(join(process.cwd(), 'public', rel)) ? rel : undefined;
};
const partnerCount = new Set(events.map((e) => e.partner).filter(Boolean)).size;
const TINTS = ['rose', 'sky', 'gold'];

/** Every photo on the site with a caption, used by the gallery page. Replace with the club's own photos. */
export const GALLERY = [
  ['/images/gallery/1.jpg', 'Sorting supplies for families'],
  ['/images/events/tree-plantation.jpg', 'Saplings ready for planting'],
  ['/images/gallery/2.jpg', 'Children at a school session'],
  ['/images/gallery/3.jpg', 'Hands joined before a project'],
  ['/images/events/maha-aarti.jpg', 'Diya at the Maha Aarti evening'],
  ['/images/gallery/5.jpg', 'Smiles after a community visit'],
  ['/images/events/paintscape.jpg', 'Colours from Paintscape'],
  ['/images/gallery/6.jpg', 'Seedlings in the nursery tray'],
  ['/images/events/zoo-day.jpg', 'Zoo Day with RAC Bicholim'],
  ['/images/gallery/7.jpg', 'Service starts with a hand'],
  ['/images/events/dei-session.jpg', 'Discussion at the DEI session'],
  ['/images/gallery/4.jpg', 'Fellowship among members'],
];

/* ======================= Shared blocks ======================= */

function MemberCard({ m, i = 0 }) {
  return (
    <div className="member-card">
      <div className="member-photo"><Photo src={memberImage(m)} alt={m.name} tone={i} sizes="(max-width: 700px) 50vw, 220px" /></div>
      <h3>{m.name}</h3>
      <ul className="member-roles">{m.roles.map((r) => <li key={r}>{r}</li>)}</ul>
    </div>
  );
}

function Testimonials({ tone = 'plain' }) {
  if (!testimonials.length) return null;
  return (
    <Section tone={tone}>
      <Intro center label="In their words" title="What members and partners say" />
      <div className="quote-grid">
        {testimonials.map((r, i) => (
          <figure className="quote-card" key={r.name}>
            <Quote size={28} aria-hidden="true" />
            <blockquote>{r.quote}</blockquote>
            <figcaption><span className={`avatar tint-${TINTS[i % 3]}`}>{initials(r.name)}</span><span><strong>{r.name}</strong>{r.role}</span></figcaption>
          </figure>
        ))}
      </div>
    </Section>
  );
}

function AvenueGrid({ items, withCta = false, headingLevel = 3 }) {
  const H = `h${headingLevel}`;
  return (
    <div className="avenue-grid">
      {items.map((a, i) => {
        const Icon = ICONS[a.icon] ?? HandHeart;
        return (
          <Link href={`/avenues/${a.slug}`} key={a.slug} className={`avenue-card accent-${i % 4}`}>
            <span className="avenue-icon"><Icon size={26} aria-hidden="true" /></span>
            <small>{a.focus}</small>
            <H>{a.name}</H>
            <p>{a.description}</p>
            <span className="text-link">Explore the avenue <ArrowRight size={16} aria-hidden="true" /></span>
          </Link>
        );
      })}
      {withCta && (
        <Link href="/join" className="avenue-card avenue-card-dark">
          <span className="avenue-icon"><Users size={26} aria-hidden="true" /></span>
          <small>Pick your avenue</small>
          <H>Join a project team</H>
          <p>Every member chooses an avenue and leads or co-leads at least one project a year.</p>
          <span className="text-link">Apply now <ArrowRight size={16} aria-hidden="true" /></span>
        </Link>
      )}
    </div>
  );
}

function CommunityCTA() {
  return (
    <Section>
      <div className="cta-band">
        <div className="cta-copy">
          <Eyebrow>Membership open</Eyebrow>
          <h2>Bring one idea. We will help you finish it.</h2>
          <p>Membership is open to young adults living, studying or working in and around Khopoli. There is no campus requirement.</p>
          <div className="btn-row"><Btn href="/join">Apply for Membership</Btn><Btn href="/sponsorship" kind="outline">Partner With Us</Btn></div>
        </div>
        <div className="cta-photo"><Photo src="/images/cta.jpg" alt="Volunteers joining hands" label="Service above self" sizes="(max-width: 900px) 100vw, 45vw" /></div>
      </div>
    </Section>
  );
}

function ImpactBand() {
  return (
    <section className="impact-band" aria-label="The club in numbers">
      <div className="container">
        {[
          [events.length, 'Projects this year'],
          [avenues.length, 'Avenues of service'],
          [uniqueMemberCount, 'Office bearers & chairs'],
          [partnerCount, 'Partner organisations'],
        ].map(([n, l]) => <div key={l}><strong>{n}</strong><span>{l}</span></div>)}
      </div>
    </section>
  );
}

function GetInvolved({ tone = 'cream' }) {
  const ways = [
    { href: '/contact?about=Volunteering', img: '/images/gallery/1.jpg', tag: 'Give your time', title: 'Volunteer at a project', copy: 'Most community projects are open to volunteers. Turn up for one drive and see how it feels.', cta: 'Volunteer with us' },
    { href: '/join', img: '/images/gallery/4.jpg', tag: 'Become a Rotaractor', title: 'Join the club', copy: 'Open to anyone 18+ living, studying or working in and around Khopoli. No campus requirement.', cta: 'Apply now' },
    { href: '/sponsorship', img: '/images/support.jpg', tag: 'Fund the work', title: 'Sponsor a project', copy: 'Back a single project or a whole avenue. Every rupee is accounted for in the project report.', cta: 'Support us' },
  ];
  return (
    <Section tone={tone}>
      <Intro center label="Get involved" title="Three ways you can make a difference" description="Whether you have an evening, a skill or a budget to give, there is a place for you in the club's work." />
      <div className="involve-grid">
        {ways.map((w, i) => (
          <Link href={w.href} className="involve-card" key={w.title}>
            <div className="involve-photo"><Photo src={w.img} alt="" label={w.title} tone={i} sizes="(max-width: 700px) 100vw, 33vw" /><span className="chip chip-float">{w.tag}</span></div>
            <div className="involve-body"><h3>{w.title}</h3><p>{w.copy}</p><span className="text-link">{w.cta} <ArrowRight size={16} aria-hidden="true" /></span></div>
          </Link>
        ))}
      </div>
    </Section>
  );
}

function GalleryGrid({ photos, featured = false }) {
  return (
    <div className={`gallery-grid ${featured ? 'is-featured' : ''}`}>
      {photos.map(([src, alt], i) => (
        <figure key={src} className="gallery-item">
          <Photo src={src} alt={alt} tone={i} sizes="(max-width: 700px) 50vw, 25vw" />
          <figcaption>{alt}</figcaption>
        </figure>
      ))}
    </div>
  );
}

function ContactMethods({ showPhone = false }) {
  const president = officers[0];
  return (
    <ul className="contact-methods">
      <li><span className="contact-icon"><Mail size={22} aria-hidden="true" /></span><div><strong>Email</strong><a href={`mailto:${clubEmail}`}>{clubEmail}</a></div></li>
      {showPhone && contact.showPresidentPhone && president.phone && (
        <li><span className="contact-icon"><Phone size={22} aria-hidden="true" /></span><div><strong>{president.role}, {president.name}</strong><a href={`tel:+91${president.phone}`}>+91 {president.phone}</a></div></li>
      )}
      <li><span className="contact-icon"><MapPin size={22} aria-hidden="true" /></span><div><strong>Where we meet</strong><a href={contact.mapUrl} target="_blank" rel="noreferrer">{contact.meetingPlace} (map)</a></div></li>
    </ul>
  );
}

/* ======================= Home ======================= */

export function Home() {
  const latest = eventsNewestFirst[0];
  return (
    <>
      <section className="home-hero">
        <div className="container home-hero-grid">
          <div className="home-hero-copy">
            <div className="donorline">
              <div className="avatar-stack" aria-hidden="true">
                {coreMembers.slice(0, 3).map((m, i) => <span key={m.name} className={`avatar tint-${TINTS[i]}`}>{initials(m.name)}</span>)}
              </div>
              <span>{uniqueMemberCount}+ Rotaractors serving Khopoli</span>
            </div>
            <h1>A small town club that <span>keeps its word.</span></h1>
            <p className="lead">{club.intro}</p>
            <div className="btn-row"><Btn href="/join">Join the Club</Btn><Btn href="/about" kind="text">What We Do</Btn></div>
          </div>
          <div className="home-hero-art">
            <Photo src="/images/hero.jpg" alt="Young volunteers of Rotaract Club of Khopoli" label=" " priority sizes="(max-width: 900px) 100vw, 50vw" className="hero-photo" />
            <div className="hero-quote"><span className="hero-small-avatar" aria-hidden="true">♥</span><p>Service above self, written in the voice of a small town with big plans.</p></div>
            <Link href="/events" className="story-reel"><span><small>See what we</small><strong>did this year</strong></span><span className="play-button" aria-hidden="true"><ArrowRight size={17} /></span></Link>
            <Link href={`/events/${latest.slug}`} className="hero-info-card">
              <small>Latest project</small>
              <strong>{latest.title}</strong>
              <span>{formatDate(latest.date)}</span>
            </Link>
            <div className="hero-small-tag">Chartered<br />{club.charteredOn}</div>
          </div>
        </div>
        <div className="container"><FamilyLogos /></div>
      </section>

      <ImpactBand />

      <Section tone="cream">
        <div className="split">
          <div className="split-photo">
            <Photo src="/images/volunteer.jpg" alt="A volunteer at a community service project" label="Our mission" sizes="(max-width: 900px) 100vw, 45vw" />
            <div className="photo-badge"><span>Serving Khopoli since</span><strong>2020</strong></div>
          </div>
          <div>
            <Intro label="Our mission" title="Service above self, close to home" description="We bring young people in and around Khopoli together to serve the town they grew up in, and to grow as leaders while they do it." />
            <ul className="feature-list">
              <li><span className="feature-icon tint-rose"><HandHeart size={22} aria-hidden="true" /></span><div><h3>Serve the community</h3><p>Health, education, environment and livelihood projects planned with the people they are meant for.</p></div></li>
              <li><span className="feature-icon tint-sky"><GraduationCap size={22} aria-hidden="true" /></span><div><h3>Grow young leaders</h3><p>Every member owns a project, manages a budget and reports the outcome, building skills a classroom does not teach.</p></div></li>
              <li><span className="feature-icon tint-gold"><Globe2 size={22} aria-hidden="true" /></span><div><h3>Connect beyond Khopoli</h3><p>Joint projects with clubs across India and the worldwide Rotary family.</p></div></li>
            </ul>
            <div className="btn-row"><Btn href="/about" kind="dark">Our Story</Btn><Btn href="/events" kind="text">See Our Work</Btn></div>
          </div>
        </div>
      </Section>

      <Section>
        <Intro center label="What we do" title="Young people, local problems, real follow-through" description="Projects sized to what we can actually finish, and finish well." />
        <div className="story-block">
          <div className="story-copy">
            <span className="chip">Community Service</span>
            <h3>Khopoli first, planned with the people who live with the results</h3>
            <p>Plantation drives with watering rosters, gaushala mornings and community evenings organised with local trustees.</p>
            <div className="mini-stats"><div><strong>{events.filter((e) => e.avenue === 'Community Service').length}</strong><span>Community projects this year</span></div><div><strong>{partnerCount}</strong><span>Partner organisations</span></div></div>
          </div>
          <div className="story-photos">
            <Photo src="/images/gallery/6.jpg" alt="Seedlings prepared for a plantation drive" label="Tree Plantation" tone={3} sizes="(max-width: 900px) 55vw, 30vw" />
            <Photo src="/images/events/gau-seva.jpg" alt="Cattle at the local gaushala" label="Gau Seva" tone={2} sizes="(max-width: 900px) 45vw, 22vw" />
          </div>
        </div>
        <div className="story-block is-flipped">
          <div className="story-copy">
            <span className="chip">Professional & International</span>
            <h3>Leaving the club more employable than when you joined</h3>
            <p>Workshops, DEI sessions and joint meetings with clubs across India. Chartered in 2020, when meeting at all was hard, the club learned to plan carefully and finish what it starts.</p>
            <div className="mini-stats"><div><strong>{events.filter((e) => /Professional|Diversity/.test(e.avenue)).length}</strong><span>Skills & DEI sessions</span></div><div><strong>{events.filter((e) => e.avenue === 'International Service').length}</strong><span>Inter-club projects</span></div></div>
          </div>
          <div className="story-photos">
            <Photo src="/images/events/joint-meeting.jpg" alt="Members on an online joint meeting" label="Joint Meeting" tone={1} sizes="(max-width: 900px) 55vw, 30vw" />
            <Photo src="/images/gallery/3.jpg" alt="Members joining hands before a project" label="Fellowship" tone={0} sizes="(max-width: 900px) 45vw, 22vw" />
          </div>
        </div>
      </Section>

      <GetInvolved />

      <Section>
        <Intro center label="Avenues" title="Seven causes we work for" description="Every member picks an avenue. Every project has one owner." />
        <AvenueGrid items={avenues.slice(0, 6)} />
        <div className="center-row"><Btn href="/avenues" kind="outline">See All Avenues</Btn></div>
      </Section>

      <Section tone="cream">
        <div className="split-intro">
          <Intro label="Recent projects" title="What we have been up to" description="Every project is documented with dates, venue and partners." />
          <Btn href="/events" kind="outline">All Events</Btn>
        </div>
        <div className="card-grid">{eventsNewestFirst.slice(0, 3).map((e, i) => <EventCard e={e} i={i} key={e.slug} />)}</div>
      </Section>

      <Section>
        <div className="split-intro">
          <Intro label="Gallery" title="Moments from the field" description="Small projects, real people, and the town we grew up in." />
          <Btn href="/gallery" kind="outline">Full Gallery</Btn>
        </div>
        <GalleryGrid featured photos={[GALLERY[2], GALLERY[5], GALLERY[9], GALLERY[4], GALLERY[8], GALLERY[6]]} />
      </Section>

      <Section tone="cream">
        <Intro center label={`The board, ${rotaractYear}`} title="Meet the people who keep it moving" />
        <div className="member-grid">{coreMembers.map((m, i) => <MemberCard m={m} i={i} key={m.name} />)}</div>
        <div className="center-row"><Btn href="/members" kind="outline">Meet Every Member</Btn></div>
      </Section>

      <Testimonials />
      <CommunityCTA />
    </>
  );
}

/* ======================= About ======================= */

export function About() {
  return (
    <>
      <PageHero eyebrow="About the club" title="Chartered in 2020. Still here, still working." desc={club.intro} image="/images/gallery/3.jpg">
        <div className="btn-row"><Btn href="/join">Join the Club</Btn><Btn href="/members" kind="text">Meet the Board</Btn></div>
      </PageHero>

      <Section tone="cream">
        <div className="split">
          <div className="split-photo"><Photo src="/images/gallery/1.jpg" alt="Volunteers sorting essentials for families" label="Our story" sizes="(max-width: 900px) 100vw, 45vw" /></div>
          <div className="prose">
            <Intro label="Our story" title="A club built during a difficult year" />
            <p>Rotaract Club of Khopoli received its charter in November 2020, when public gatherings were restricted and most service work had moved to phone calls and spreadsheets. The first projects were practical: getting essentials to families and helping students who had lost access to classes.</p>
            <p>That start left a habit behind. The club plans on paper before it posts anything, gives every project a single owner, and reports what actually happened rather than what was intended.</p>
            <p>As a community based club, our members are not tied to one campus. Students, early-career professionals and local business owners sit at the same table, which is why the club can take on projects bigger than its size.</p>
          </div>
        </div>
      </Section>

      <Section>
        <Intro center label="Structure" title="How the club is organised" />
        <div className="info-grid">
          {[
            [Users, 'General body', 'Every inducted member. The general body approves the calendar, votes on inductions and carries out projects.'],
            [Award, 'Board of directors', 'President, secretary and avenue directors elected for the Rotaract year. The board owns budgets, reporting and district coordination.'],
            [Handshake, 'Project teams', 'Formed per project with one accountable lead, so nothing depends on a single office-bearer being free that week.'],
          ].map(([Icon, t, d], i) => (
            <div className={`info-card tint-${TINTS[i]}`} key={t}><span className="info-icon"><Icon size={24} aria-hidden="true" /></span><h3>{t}</h3><p>{d}</p></div>
          ))}
        </div>
      </Section>

      <Section tone="cream">
        <Intro center label="Charter facts" title="The club on paper" />
        <dl className="facts-grid">
          {clubFacts.map((f) => <div key={f.label}><dt>{f.label}</dt><dd>{f.value}</dd></div>)}
        </dl>
      </Section>

      <Section>
        <Intro center label="The Rotary family" title="Rotary, Rotaract and Interact" />
        <div className="info-grid">
          {[
            ['Rotary', 'A worldwide network of service clubs for working professionals. Rotary sponsors and mentors Rotaract clubs, including ours.', '/rotary-information', FAMILY_LOGOS[1]],
            ['Rotaract', "Rotary's programme for young adults. Clubs govern themselves, plan their own projects and report through their district: for us, District 3131.", '/district-3131', FAMILY_LOGOS[0]],
            ['Interact', 'The school-age wing of Rotary. Where we can, we support Interact clubs nearby so service starts before college.', null, FAMILY_LOGOS[2]],
          ].map(([t, d, href, logo]) => (
            <div className="info-card family-card" key={t}>
              <Image src={logo.src} alt={logo.alt} width={logo.w} height={logo.h} sizes="240px" className="family-card-logo" />
              <h3 className="sr-only">{t}</h3><p>{d}</p>
              {href && <Link href={href} className="text-link">Learn more <ArrowRight size={16} aria-hidden="true" /></Link>}
            </div>
          ))}
        </div>
      </Section>
      <GetInvolved />
      <CommunityCTA />
    </>
  );
}

/* ======================= Avenues ======================= */

export function Avenues() {
  return (
    <>
      <PageHero eyebrow="Avenues of service" title="Seven causes the club works for" desc="Rotaract's avenues of service, adapted to what a community club in Khopoli can genuinely deliver. Choose one to see its projects and the people who lead it." />
      <Section><AvenueGrid items={avenues} withCta headingLevel={2} /></Section>
      <CommunityCTA />
    </>
  );
}

export function AvenueDetail({ slug }) {
  const a = avenues.find((x) => x.slug === slug);
  const Icon = ICONS[a.icon] ?? HandHeart;
  const leads = membersWithRoles(a.leadRoles);
  const projects = eventsForAvenue(a);
  const others = avenues.filter((x) => x.slug !== slug);
  return (
    <>
      <PageHero eyebrow={a.focus} title={a.name} desc={a.description}>
        <span className="hero-icon"><Icon size={34} aria-hidden="true" /></span>
      </PageHero>
      <Section>
        <div className="split-intro">
          <Intro label="Projects" title={`${a.name} projects`} description={projects.length ? 'Recent work in this avenue.' : 'Projects for this avenue are being planned for the new Rotaract year.'} />
          <Btn href={`/contact?about=${encodeURIComponent(`${a.name} project idea`)}`} kind="outline">Suggest a Project</Btn>
        </div>
        {projects.length ? <div className="card-grid">{projects.map((e, i) => <EventCard e={e} i={i} key={e.slug} />)}</div>
          : <p className="empty-note">No projects logged yet. Have an idea? Tell us and we will help you run it.</p>}
      </Section>
      {leads.length > 0 && (
        <Section tone="cream">
          <Intro center label="Who leads it" title="Avenue leads" />
          <div className="member-grid">{leads.map((m, i) => <MemberCard m={m} i={i} key={m.name} />)}</div>
        </Section>
      )}
      <Section>
        <Intro center label="More avenues" title="Explore the other avenues" />
        <ul className="pill-links">{others.map((o) => <li key={o.slug}><Link href={`/avenues/${o.slug}`}>{o.name}</Link></li>)}</ul>
      </Section>
      <CommunityCTA />
    </>
  );
}

/* ======================= Events ======================= */

export function Events() {
  return (
    <>
      <PageHero eyebrow="Events & projects" title="What the club has done, and what is next" desc="Dates, times and venues are confirmed by the secretary. Most community projects are open to volunteers." />
      <Section><EventsExplorer events={eventsNewestFirst} /></Section>
      <CommunityCTA />
    </>
  );
}

export function EventDetail({ slug }) {
  const e = events.find((x) => x.slug === slug);
  const others = eventsNewestFirst.filter((x) => x.slug !== slug).slice(0, 3);
  const avenue = avenues.find((a) => a.eventAvenues.includes(e.avenue));
  const online = /online/i.test(e.venue);
  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'Event', name: e.title, description: e.summary,
    startDate: e.date, endDate: e.endDate ?? e.date, image: `${SITE_URL}${eventImage(e)}`,
    eventAttendanceMode: online ? 'https://schema.org/OnlineEventAttendanceMode' : 'https://schema.org/OfflineEventAttendanceMode',
    location: online ? { '@type': 'VirtualLocation', url: `${SITE_URL}/events/${e.slug}` } : { '@type': 'Place', name: e.venue, address: e.venue },
    organizer: { '@type': 'Organization', name: club.name, url: SITE_URL },
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PageHero eyebrow={e.avenue} title={e.title} desc={e.summary} />
      <Section>
        <div className="detail-grid">
          <article className="detail-article prose">
            <div className="detail-photo"><Photo src={eventImage(e)} alt={e.title} label={e.title} priority sizes="(max-width: 900px) 100vw, 60vw" /></div>
            {e.outcomes?.length > 0 && (
              <dl className="outcome-grid">{e.outcomes.map((o) => <div key={o.label}><dd>{o.value}</dd><dt>{o.label}</dt></div>)}</dl>
            )}
            <h2>About this project</h2>
            <p>{e.report ?? e.summary}</p>
            {e.partner && <p className="callout">Organised in partnership with <strong>{e.partner}</strong>.</p>}
            {e.gallery?.length > 0 && <GalleryGrid photos={e.gallery.map((src) => [src, e.title])} />}
          </article>
          <aside className="detail-sidebar">
            <div className="side-card">
              <EventStatus event={e} />
              <ul className="event-facts">
                <li><CalendarDays size={18} aria-hidden="true" /> {formatDate(e.date)}</li>
                <li><Clock size={18} aria-hidden="true" /> {e.time}</li>
                <li><MapPin size={18} aria-hidden="true" /> {e.venue}</li>
                {e.partner && <li><Handshake size={18} aria-hidden="true" /> {e.partner}</li>}
              </ul>
              <Btn href={`/contact?about=${encodeURIComponent(e.title)}`} className="btn-block">Volunteer or Enquire</Btn>
              <EventActions event={e} />
              {avenue && <Link href={`/avenues/${avenue.slug}`} className="text-link">More {avenue.name} projects <ArrowRight size={16} aria-hidden="true" /></Link>}
            </div>
            <div className="side-card side-card-dark">
              <h2>Fund a project like this</h2>
              <p>Sponsors receive the project report, photographs and a mention with the district.</p>
              <Btn href="/sponsorship" kind="light" className="btn-block">Become a Sponsor</Btn>
            </div>
            <div className="side-card">
              <h2>More events</h2>
              <ul className="mini-events">
                {others.map((o, i) => (
                  <li key={o.slug}><Link href={`/events/${o.slug}`}>
                    <Photo src={eventImage(o)} alt="" label={initials(o.title)} tone={i + 1} sizes="90px" />
                    <span>{o.title}<small>{formatDate(o.date)}</small></span>
                  </Link></li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </Section>
    </>
  );
}

/* ======================= Gallery ======================= */

export function Gallery() {
  return (
    <>
      <PageHero eyebrow="Gallery" title="Moments from the field" desc="Photographs from the club's projects, fellowships and partnerships." />
      <Section>
        <GalleryGrid photos={GALLERY} />
        <p className="small-note">Some photographs are representative images while the club&apos;s own photo archive is being added.</p>
      </Section>
      <CommunityCTA />
    </>
  );
}

/* ======================= Members ======================= */

export function Members() {
  return (
    <>
      <PageHero eyebrow={`Board ${rotaractYear}`} title="The people behind every project" desc={`${uniqueMemberCount} Rotaractors hold the club's portfolios for ${rotaractYear}. Where one person holds several, their roles are listed together.`} />
      <Section>
        <Intro center label="Core team" title="Club office bearers" />
        <div className="member-grid">{coreMembers.map((m, i) => <MemberCard m={m} i={i} key={m.name} />)}</div>
      </Section>
      <Section tone="cream">
        <Intro center label="Board of directors" title="Avenue directors and officers" />
        <div className="member-grid">{boardOfDirectors.map((m, i) => <MemberCard m={m} i={i + 1} key={m.name} />)}</div>
      </Section>
      <Section>
        <Intro center label="Chairpersons" title="Chairs and additional portfolios" />
        <div className="member-grid">{chairpersons.map((m, i) => <MemberCard m={m} i={i + 2} key={m.name + m.roles[0]} />)}</div>
      </Section>
      <Testimonials tone="cream" />
      <CommunityCTA />
    </>
  );
}

/* ======================= District & Rotary ======================= */

export function District() {
  return (
    <>
      <PageHero eyebrow="Our district" title={district.name} desc={district.intro} logo={FAMILY_LOGOS[0]}>
        <div className="btn-row"><Btn href={district.website} kind="dark">Visit the District Website</Btn></div>
      </PageHero>
      <Section>
        <dl className="stat-grid">{district.stats.map((s) => <div key={s.label}><dd>{s.value}</dd><dt>{s.label}</dt></div>)}</dl>
      </Section>
      <Section tone="cream">
        <Intro center label="About the district" title="Where Khopoli fits in" description="Our club takes part in district projects, trainings and fellowships alongside clubs across Pune and Raigad." />
        <div className="info-grid">{district.facts.map((f, i) => <div className={`info-card tint-${TINTS[i]}`} key={f.label}><h3>{f.label}</h3><p>{f.value}</p></div>)}</div>
      </Section>
      <CommunityCTA />
    </>
  );
}

export function RotaryInfo() {
  return (
    <>
      <PageHero eyebrow="Rotary International" title="People of action, since 1905" desc={rotary.intro} logo={FAMILY_LOGOS[1]}>
        <div className="btn-row"><Btn href={rotary.website} kind="dark">Visit Rotary.org</Btn></div>
      </PageHero>
      <Section>
        <dl className="stat-grid stat-grid-3">{rotary.stats.map((s) => <div key={s.label}><dd>{s.value}</dd><dt>{s.label}</dt></div>)}</dl>
      </Section>
      <Section tone="cream">
        <div className="info-grid">
          {[['Vision', rotary.vision], ['Who Rotary is', rotary.founded], ['Mission', rotary.mission]].map(([t, d], i) => (
            <div className={`info-card tint-${['sky', 'rose', 'gold'][i]}`} key={t}><h3>{t}</h3><p>{d}</p></div>
          ))}
        </div>
      </Section>
      <Section>
        <Intro center label="Areas of focus" title="Seven causes Rotary works on worldwide" />
        <ul className="pill-links is-static">{rotary.areasOfFocus.map((a) => <li key={a}><span><Check size={16} aria-hidden="true" /> {a}</span></li>)}</ul>
        <p className="small-note center">Summarised from <a href={rotary.website} target="_blank" rel="noreferrer">rotary.org</a>.</p>
      </Section>
      <CommunityCTA />
    </>
  );
}

/* ======================= FAQs ======================= */

export function Faqs() {
  return (
    <>
      <PageHero eyebrow="FAQs" title="Frequently asked questions" desc="About the club, membership, events and how Rotaract connects to Rotary." />
      <Section><div className="faq-page"><FaqSearch groups={faqGroups} /></div></Section>
      <CommunityCTA />
    </>
  );
}

/* ======================= Join ======================= */

export function Join() {
  return (
    <>
      <PageHero eyebrow="Join the club" title="Join a club that finishes what it starts" desc="Membership is open to young adults living, studying or working in and around Khopoli. There is no campus requirement." image="/images/gallery/4.jpg" />
      <Section>
        <Intro center label="What we expect" title="Three commitments, nothing hidden" />
        <ol className="info-grid numbered">
          {joinCommitments.map((c, i) => <li className={`info-card tint-${TINTS[i]}`} key={c.title}><span className="info-num" aria-hidden="true">0{i + 1}</span><h3>{c.title}</h3><p>{c.body}</p></li>)}
        </ol>
      </Section>
      <Section tone="cream">
        <div className="form-layout">
          <div className="prose">
            <Eyebrow>How it works</Eyebrow>
            <h2>Apply, meet us twice, get inducted</h2>
            <ol className="steps">
              <li><strong>Send the application.</strong> It goes straight to the club.</li>
              <li><strong>A short conversation.</strong> The secretary gets in touch to talk about what you want to work on.</li>
              <li><strong>Attend two meetings.</strong> See how the club plans and runs projects before you commit.</li>
              <li><strong>Induction.</strong> Pick your avenue and join a project team.</li>
            </ol>
            <p>Plan for four to six hours a month. A nominal annual subscription covers district and Rotary International dues; the current amount is shared during your conversation with the secretary.</p>
            <p><Link href="/faqs" className="text-link">Read the membership FAQs <ArrowRight size={16} aria-hidden="true" /></Link></p>
          </div>
          <MailForm
            title="Tell us about yourself"
            subject="Membership application"
            submitLabel="Submit Application"
            fields={[
              { name: 'name', label: 'Full name', required: true, placeholder: 'Your full name', autoComplete: 'name' },
              { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'you@example.com', autoComplete: 'email' },
              { name: 'phone', label: 'Phone', type: 'tel', required: true, placeholder: '10-digit mobile number', pattern: '[0-9]{10}', title: 'Enter a 10-digit phone number', autoComplete: 'tel-national' },
              { name: 'occupation', label: 'Occupation or college', placeholder: 'Student, engineer, business…' },
              { name: 'avenue', label: 'Preferred avenue', options: avenues.map((a) => a.name), required: true },
              { name: 'why', label: 'Why do you want to join?', rows: 5, required: true, minLength: 20, placeholder: 'What you want to work on in Khopoli, and what you can bring to it.' },
            ]}
          />
        </div>
      </Section>
    </>
  );
}

/* ======================= Board application ======================= */

export function BodApplication() {
  return (
    <>
      <PageHero eyebrow="Board application" title="Stand for the board" desc="Members who have completed one full Rotaract year with good attendance can apply for a board position ahead of the election cycle." />
      <Section tone="cream">
        <div className="form-layout">
          <div className="prose">
            <Eyebrow>Before you apply</Eyebrow>
            <h2>What the board looks for</h2>
            <ul className="check-list">
              <li><Check size={18} aria-hidden="true" /> At least one full year as an inducted member</li>
              <li><Check size={18} aria-hidden="true" /> Regular attendance at meetings and projects</li>
              <li><Check size={18} aria-hidden="true" /> A project you led or co-led</li>
              <li><Check size={18} aria-hidden="true" /> A clear plan for the portfolio you are applying for</li>
            </ul>
            <p>Applications are reviewed by the current board and the club mentor. Shortlisted members are invited to present their plan to the general body.</p>
          </div>
          <MailForm
            title="Board candidature"
            subject="Board application"
            submitLabel="Submit Candidature"
            fields={[
              { name: 'name', label: 'Full name', required: true, autoComplete: 'name' },
              { name: 'email', label: 'Email', type: 'email', required: true, autoComplete: 'email' },
              { name: 'phone', label: 'Phone', type: 'tel', required: true, pattern: '[0-9]{10}', title: 'Enter a 10-digit phone number', autoComplete: 'tel-national' },
              { name: 'position', label: 'Position applied for', required: true, options: ['President Elect', 'Secretary', 'Treasurer', ...avenues.map((a) => `${a.name} Director`), 'Open to any position'] },
              { name: 'since', label: 'Member since (year)', required: true, placeholder: 'e.g. 2024', pattern: '20[0-9]{2}', title: 'Enter a year like 2024' },
              { name: 'projects', label: 'Projects you led or co-led', rows: 3, required: true },
              { name: 'plan', label: 'Your plan for the portfolio', rows: 5, required: true, minLength: 40 },
            ]}
          />
        </div>
      </Section>
    </>
  );
}

/* ======================= Sponsorship ======================= */

export function Sponsorship() {
  return (
    <>
      <PageHero eyebrow="Sponsorship" title="Fund service you can actually audit" desc="Sponsorship pays for materials, transport and venues. Every rupee is accounted for in the project report, and we send it to you whether or not you ask." image="/images/support.jpg" />
      <Section>
        <Intro center label="Tiers" title="Three ways to partner" description="Amounts are set per project rather than fixed, because a plantation drive and a skills workshop cost very different things." />
        <div className="tier-grid">
          {sponsorTiers.map((t, i) => (
            <div className={`tier-card ${i === 1 ? 'is-featured' : ''}`} key={t.name}>
              {i === 1 && <span className="chip chip-float">Most popular</span>}
              <small>{t.scope}</small>
              <h3>{t.name}</h3>
              <ul>{t.perks.map((p) => <li key={p}><Check size={17} aria-hidden="true" /> {p}</li>)}</ul>
              <Btn href="#enquiry" kind={i === 1 ? 'primary' : 'outline'} className="btn-block">Enquire</Btn>
            </div>
          ))}
        </div>
      </Section>
      <Section tone="cream">
        <Intro center label="In kind" title="Not everything has to be money" />
        <div className="info-grid">
          <div className="info-card tint-rose"><h3>Materials & venues</h3><p>Venues, printing, transport, refreshments, saplings, stationery and equipment are all welcome, and acknowledged exactly like funding.</p></div>
          <div className="info-card tint-sky"><h3>Your expertise</h3><p>Professionals who can run a session in finance, design, trades, medicine or law are some of our most valuable partners.</p></div>
          <div className="info-card tint-gold"><h3>Start small</h3><p>Local businesses often start with one project and stay for the year. That is fine with us.</p></div>
        </div>
      </Section>
      <Section id="enquiry">
        <div className="form-layout">
          <div>
            <Intro label="Enquiry" title="Tell us how you would like to help" description="Prefer to talk first? Write to us and a board member will call you back." />
            <ContactMethods />
          </div>
          <MailForm
            title="Partnership enquiry"
            subject="Sponsorship enquiry"
            submitLabel="Send Enquiry"
            fields={[
              { name: 'name', label: 'Full name', required: true, autoComplete: 'name' },
              { name: 'organisation', label: 'Organisation', required: true, placeholder: 'Business or organisation', autoComplete: 'organization' },
              { name: 'email', label: 'Email', type: 'email', required: true, autoComplete: 'email' },
              { name: 'phone', label: 'Phone', type: 'tel', required: true, pattern: '[0-9]{10}', title: 'Enter a 10-digit phone number', autoComplete: 'tel-national' },
              { name: 'tier', label: 'Interested in', options: [...sponsorTiers.map((t) => t.name), 'In-kind support', 'Not sure yet'] },
              { name: 'budget', label: 'Indicative budget', placeholder: 'e.g. ₹10,000' },
              { name: 'message', label: 'How would you like to collaborate?', rows: 5, required: true, minLength: 15, placeholder: 'Tell us about the project, support or idea you have in mind.' },
            ]}
          />
        </div>
      </Section>
    </>
  );
}

/* ======================= Contact ======================= */

export function Contact() {
  return (
    <>
      <PageHero eyebrow="Contact" title="Talk to the club directly" desc="No ticketing system and no form queue you never hear back from. Messages go straight to the board." />
      <Section>
        <div className="form-layout">
          <div>
            <Intro label="Get in touch" title="Reach the people who run it" />
            <ContactMethods showPhone />
            <dl className="officer-list">
              {officers.map((o) => <div key={o.role}><dt>{o.role}</dt><dd>{o.name}</dd></div>)}
            </dl>
            <SocialLinks className="social-dark" />
          </div>
          <MailForm
            title="Send a message"
            subject="Website enquiry"
            prefill="message"
            fields={[
              { name: 'name', label: 'Your name', required: true, placeholder: 'Full name', autoComplete: 'name' },
              { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'you@example.com', autoComplete: 'email' },
              { name: 'message', label: 'Message', rows: 6, required: true, minLength: 10, placeholder: 'What would you like to discuss?' },
            ]}
          />
        </div>
      </Section>
    </>
  );
}

/* ======================= Privacy ======================= */

export function Privacy() {
  return (
    <>
      <PageHero eyebrow="Privacy policy" title="How we handle your details" desc="Plain-language notes on what this website collects and what the club does with it." />
      <Section>
        <div className="prose narrow">
          <h2>What we collect</h2>
          <p>We only collect what you type into a form on this site: for example your name, email, phone number and message when you apply for membership, enquire about sponsorship, apply for the board or contact us.</p>
          <h2>How we use it</h2>
          <p>Your details are used only to reply to you and to process your application or enquiry. We do not sell or share them with anyone outside the club, except where a project partner needs them to arrange something you asked for, and only with your agreement.</p>
          <h2>How it is sent and stored</h2>
          <p>Depending on how the site is set up, a form either opens your own email app with the message ready to send, or delivers it through a form service to the club inbox. Messages are kept in the club inbox for as long as they are needed, and applications are kept for the current Rotaract year.</p>
          <h2>Visitor statistics</h2>
          <p>The site may count page views with privacy-friendly analytics that do not use cookies or build personal profiles.</p>
          <h2>Your choices</h2>
          <p>You can ask us to show, correct or delete the details you sent at any time by writing to <a href={`mailto:${clubEmail}`}>{clubEmail}</a>.</p>
          <p className="small-note">Last updated November 2026.</p>
        </div>
      </Section>
    </>
  );
}

export function NotFound() {
  return (
    <section className="error-page">
      <div className="container">
        <p className="error-code" aria-hidden="true">404</p>
        <h1>This page took a different avenue</h1>
        <p>The page you are looking for does not exist or has moved.</p>
        <div className="btn-row center-row"><Btn href="/">Back to Home</Btn><Btn href="/events" kind="outline">See Events</Btn></div>
      </div>
    </section>
  );
}

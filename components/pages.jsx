import { existsSync } from 'node:fs';
import { join } from 'node:path';
import Link from 'next/link';
import Image from 'next/image';
// Icons: react-icons (Font Awesome 6), the same icon library Kindora uses.
import {
  FaArrowRight as ArrowRight, FaArrowLeft as ArrowLeft, FaRegCalendar as CalendarDays, FaRegClock as Clock, FaLocationDot as MapPin,
  FaHandshake as Handshake, FaRegEnvelope as Mail, FaPhone as Phone, FaCheck as Check, FaStar as Star,
  FaHandHoldingHeart as HandHeart, FaGraduationCap as GraduationCap, FaUsers as Users, FaEarthAsia as Globe2,
  FaBullhorn as Megaphone, FaHandshakeAngle as HeartHandshake, FaWandMagicSparkles as Sparkles,
  FaShieldHalved as ShieldCheck, FaUserPlus as UserPlus, FaRegLightbulb as Lightbulb, FaBoxOpen as Package,
  FaRegCommentDots as MessageCircle, FaPlay as Play,
} from 'react-icons/fa6';
import {
  club, clubFacts, officers, clubEmail, contact, avenues, events, eventsNewestFirst, formatDate, formatDateRange,
  coreMembers, boardOfDirectors, chairpersons, uniqueMemberCount, initials, testimonials,
  allFaqs, faqGroups, district, rotary, sponsorTiers, joinCommitments, rotaractYear,
  membersWithRoles, eventsForAvenue, FAMILY_LOGOS, values, volunteerReasons, waysToHelp,
  postsNewestFirst, PAGE_SIZE, riPresident, drr, districtGovernor,
} from '../data/club';
import {
  Btn, Eyebrow, Intro, Section, PageHero, Photo, FaqList, FaqSearch, MailForm, NoteWall, LeaderLetter, SocialLinks,
  EventCard, EventsExplorer, EventStatus, EventActions, FamilyLogos, LogoMarquee,
} from './ui';
import { Team, WorldMap } from '@/components/ui/lazy';
import ClubCalendar from '@/components/ui/club-calendar';
import { placeOnMap, MAP_SIZE } from '../lib/world-map';
import { eventPhoto } from '../lib/event-photo';
import { breadcrumbJsonLd, eventJsonLd, postJsonLd, faqJsonLd } from '../lib/seo';

const ICONS = { HandHeart, GraduationCap, Users, Globe2, Megaphone, HeartHandshake, Sparkles, ShieldCheck, UserPlus, Lightbulb, Package, Handshake };
const eventImage = eventPhoto;
const withPhoto = (e) => ({ ...e, image: eventImage(e) });
/** Only point at a member photo that actually exists in /public, so missing portraits never trigger a 404. */
const memberImage = (m) => {
  if (!m.photo) return undefined;
  for (const ext of ['webp', 'png', 'jpg']) {
    const rel = `/images/members/${m.photo}.${ext}`;
    if (existsSync(join(process.cwd(), 'public', rel))) return rel;
  }
  return undefined;
};
const partnerCount = new Set(events.map((e) => e.partner).filter(Boolean)).size;
const TINTS = ['rose', 'sky', 'gold'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const formatPostDate = (iso) => { const [y, m, d] = iso.split('-').map(Number); return `${String(d).padStart(2, '0')} ${MONTHS[m - 1]} ${y}`; };

/** Every photo on the site with a caption, used by the gallery page. Replace with the club's own photos. */
export const GALLERY = [
  ['/images/events/road-safety-drive.jpg', 'Road safety awareness drive with Interactors and the traffic police'],
  ['/images/cta-team.jpg', 'Members of Rotaract Club of Khopoli'],
  ['/images/events/cyber-crime-awareness.jpg', 'Cyber crime awareness session with Rotary Club of Khopoli'],
  ['/images/gallery/1.jpg', 'Sorting supplies for families'],
  ['/images/events/tree-plantation.jpg', 'Saplings ready for planting'],
  ['/images/gallery/2.jpg', 'Children at a school session'],
  ['/images/gallery/3.jpg', 'Hands joined before a project'],
  ['/images/hero-stage.jpg', 'Members on stage at Ramparva – Ek Diwali Sandhya'],
  ['/images/gallery/5.jpg', 'Smiles after a community visit'],
  ['/images/events/paintscape.jpg', 'Colours from Paintscape'],
  ['/images/gallery/6.jpg', 'Seedlings in the nursery tray'],
  ['/images/gallery/7.jpg', 'Service starts with a hand'],
  ['/images/events/dei-session.jpg', 'Discussion at the DEI session'],
  ['/images/gallery/4.jpg', 'Fellowship among members'],
];

/* ======================= Shared Kindora-style blocks ======================= */

function Pills({ children }) {
  return <p className="pill-text"><span>{children}</span></p>;
}

/** Every role a member holds this year, across the core team, board and chairs (for the back of their badge). */
const allRoles = (name) => [...new Set([...coreMembers, ...boardOfDirectors, ...chairpersons].filter((x) => x.name === name).flatMap((x) => x.roles))];

/** Members as the team component expects them: card roles, every role (for the badge) and the portrait. */
const toTeam = (list) => list.map((m) => ({ name: m.name, roles: m.roles, allRoles: allRoles(m.name), image: memberImage(m), socials: m.socials }));

function Testimonials({ tone = 'plain', intro = true }) {
  if (!testimonials.length) return null;
  return (
    <Section tone={tone}>
      {intro && <Intro center label="Voices of support" title="What people are saying" description="Members, partners and beneficiaries on working with the club." />}
      <div className="quote-grid">
        {testimonials.map((r, i) => (
          <figure className="quote-card" key={r.name}>
            <div className="stars" aria-label="5 out of 5">{Array.from({ length: 5 }, (_, n) => <Star key={n} size={20} aria-hidden="true" />)}</div>
            <blockquote>“{r.quote}”</blockquote>
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
      {items.map((a) => {
        const Icon = ICONS[a.icon] ?? HandHeart;
        return (
          <Link href={`/avenues/${a.slug}`} key={a.slug} className="avenue-card">
            <span className="avenue-icon"><Icon size={30} aria-hidden="true" /></span>
            <small>{a.focus}</small>
            <H>{a.name}</H>
            <p>{a.description}</p>
            <span className="text-link">Explore <ArrowRight size={16} aria-hidden="true" /></span>
          </Link>
        );
      })}
      {withCta && (
        <Link href="/join" className="avenue-card avenue-card-dark">
          <span className="avenue-icon"><Users size={30} aria-hidden="true" /></span>
          <small>Pick your avenue</small>
          <H>Join a project team</H>
          <p>Every member chooses an avenue and leads or co-leads at least one project a year.</p>
          <span className="text-link">Apply now <ArrowRight size={16} aria-hidden="true" /></span>
        </Link>
      )}
    </div>
  );
}

/** Coral "Together, we can make a difference" band (Kindora's closing CTA). */
function CommunityCTA() {
  return (
    <section className="section cta-section">
      <div className="container">
        <div className="cta-band">
          <h2>Together, we can make a difference</h2>
          <p className="cta-sub">Your time, skills and support help the club serve Khopoli.</p>
          <div className="btn-row center-row-tight"><Btn href="/join" icon={false}>Join the Club</Btn><Btn href="/contact?about=Volunteering" kind="light" icon={false}>Become a Volunteer</Btn></div>
          <div className="cta-stat">
            <strong>Total people involved</strong>
            <span>Office bearers, directors and chairs this Rotaract year</span>
            <div className="avatar-stack" aria-hidden="true">{coreMembers.slice(0, 3).map((m, i) => <span key={m.name} className={`avatar tint-${TINTS[i]}`}>{initials(m.name)}</span>)}</div>
            <b>{uniqueMemberCount}+ Rotaractors</b>
          </div>
          <div className="cta-pills"><Pills>Serving schools, the environment and local livelihoods in Khopoli.</Pills></div>
          <div className="cta-people"><Photo src="/images/cta-team.jpg" alt="Members of Rotaract Club of Khopoli sitting together outdoors" label=" " sizes="(max-width: 900px) 100vw, 60vw" /></div>
        </div>
      </div>
    </section>
  );
}

function FaqBox({ items = allFaqs.slice(0, 6) }) {
  return (
    <section className="section faq-section">
      <div className="container">
        <div className="faq-box">
          <div className="faq-head">
            <Intro label="Questions answered" title="Frequently asked questions" />
            <div><p>Answers to common questions about the club, membership, meetings and how Rotaract connects to Rotary.</p><Btn href="/contact" icon={false}>Contact Us</Btn></div>
          </div>
          <FaqList items={items} firstOpen={false} />
        </div>
      </div>
    </section>
  );
}

/** Three coloured number cards (Kindora "Programs that change lives"). */
function MetricCards() {
  return (
    <Section>
      <Intro center label="Our impact" title="Projects that change lives" description="Small teams, clear owners and documented outcomes, sized to what a young club can finish well." />
      <div className="metric-grid">
        <div className="metric-card is-coral">
          <strong>{events.length}</strong>
          <span className="metric-label">Projects this Rotaract year</span>
          <Pills>From tree plantation to Project Bachpan, each with one accountable lead.</Pills>
          <Link href="/events" className="metric-arrow" aria-label="See all projects"><ArrowRight size={22} /></Link>
          <div className="metric-photo"><Photo src="/images/gallery/5.jpg" alt="" label=" " sizes="260px" /></div>
        </div>
        <div className="metric-card is-dark">
          <strong>{uniqueMemberCount}+</strong>
          <span className="metric-label">Rotaractors leading the club</span>
          <Pills>Office bearers, directors and chairs keeping the calendar moving.</Pills>
          <div className="metric-photo is-wide"><Photo src="/images/hero-team.jpg" alt="" label=" " sizes="420px" /></div>
        </div>
        <div className="metric-card is-yellow">
          <strong>{avenues.length}</strong>
          <span className="metric-label">Avenues of service</span>
          <Pills>Community, professional, club, international, PR, DEI and public image.</Pills>
          <div className="metric-photo is-wide"><Photo src="/images/events/tree-plantation.jpg" alt="" label=" " sizes="420px" /></div>
        </div>
      </div>
    </Section>
  );
}

/** Small bar chart card overlaid on a photo, built from real club data. */
function ChartCard({ title, caption, bars }) {
  const max = Math.max(...bars.map((b) => b.value), 1);
  return (
    <div className="chart-card">
      <strong>{title}</strong>
      <small>{caption}</small>
      <div className="chart-bars" role="img" aria-label={`${title}: ${bars.map((b) => `${b.label} ${b.value}`).join(', ')}`}>
        {bars.map((b) => <div key={b.label}><span style={{ height: `${Math.max(14, (b.value / max) * 100)}%` }} /><em>{b.label}</em></div>)}
      </div>
    </div>
  );
}

function ResultsBlocks({ tone = 'plain' }) {
  const byAvenue = [['Community Service', 'Comm.'], ['International Service', 'Intl.'], ['Professional Development', 'PD'], ['Diversity, Equity & Inclusion', 'DEI'], ['Club Service', 'Club']]
    .map(([a, label]) => ({ label, value: events.filter((e) => e.avenue === a).length }));
  const byMonth = ['06', '07', '08', '09', '10'].map((m) => ({ label: MONTHS[Number(m) - 1], value: events.filter((e) => e.date.slice(5, 7) === m).length }));
  return (
    <Section tone={tone}>
      <Intro center label="Our results" title="Results that inspire change" description="Young people, local problems, real follow-through." />
      <div className="story-block">
        <div className="story-photo">
          <Photo src="/images/volunteer.jpg" alt="A volunteer at a community project" label="Community Service" sizes="(max-width: 900px) 100vw, 45vw" />
          <ChartCard title="Projects by avenue" caption="This Rotaract year" bars={byAvenue} />
        </div>
        <div className="story-copy">
          <span className="chip">Community Service</span>
          <h3>Khopoli first, planned with the people who live with the results</h3>
          <p>Plantation drives with watering rosters, gaushala mornings and community evenings organised with local trustees.</p>
          <div className="stat-boxes">
            <div><span className="stat-icon tint-sky"><HandHeart size={18} aria-hidden="true" /></span><small>Community projects</small><b>{events.filter((e) => e.avenue === 'Community Service').length}</b></div>
            <div><span className="stat-icon tint-gold"><Handshake size={18} aria-hidden="true" /></span><small>Partner organisations</small><b>{partnerCount}</b></div>
          </div>
        </div>
      </div>
      <div className="story-block is-flipped">
        <div className="story-photo">
          <Photo src="/images/events/pd-session.jpg" alt="Members at a professional development session" label="Professional Development" sizes="(max-width: 900px) 100vw, 45vw" />
          <ChartCard title="Projects per month" caption="June to October" bars={byMonth} />
        </div>
        <div className="story-copy">
          <span className="chip">Professional & International</span>
          <h3>Leaving the club more employable than when you joined</h3>
          <p>Workshops, DEI sessions and joint meetings with clubs across India. Chartered in 2020, the club learned to plan carefully and finish what it starts.</p>
          <div className="stat-boxes">
            <div><span className="stat-icon tint-rose"><GraduationCap size={18} aria-hidden="true" /></span><small>Skills & DEI sessions</small><b>{events.filter((e) => /Professional|Diversity/.test(e.avenue)).length}</b></div>
            <div><span className="stat-icon tint-sky"><Globe2 size={18} aria-hidden="true" /></span><small>Inter-club projects</small><b>{events.filter((e) => e.avenue === 'International Service').length}</b></div>
          </div>
        </div>
      </div>
    </Section>
  );
}

/** Green "Discover the impact of volunteering" block. */
function VolunteerBlock() {
  return (
    <Section>
      <div className="volunteer-band">
        <div className="volunteer-copy">
          <h2>Discover the impact of volunteering</h2>
          <ul>
            {volunteerReasons.map((r) => {
              const Icon = ICONS[r.icon] ?? HandHeart;
              return <li key={r.title}><h3><Icon size={20} aria-hidden="true" /> {r.title}</h3><p>{r.body}</p></li>;
            })}
          </ul>
        </div>
        <div className="volunteer-media">
          <p className="volunteer-lead">Most community projects are open to volunteers. Come for one drive and see how it feels.</p>
          <div className="volunteer-photo"><Photo src="/images/gallery/4.jpg" alt="Young people at a club fellowship" label=" " sizes="(max-width: 900px) 100vw, 50vw" /></div>
          <Link href="/gallery" className="story-reel"><span><small>See our</small><strong>photo gallery</strong></span><span className="play-button" aria-hidden="true"><Play size={14} /></span></Link>
          <span className="volunteer-tag">Real projects,<br />real people</span>
        </div>
      </div>
    </Section>
  );
}

function NumbersBlock({ tone = 'plain' }) {
  return (
    <Section tone={tone}>
      <Intro center label="Our network" title="See the difference we're part of, by the numbers" description="Rotaract Club of Khopoli belongs to a district and a worldwide family of clubs." />
      <div className="counters">
        <div><small>Rotaract District 3131</small><strong>2,700+</strong><p>Rotaractors across 100+ clubs in the Pune and Raigad revenue districts, and Khopoli is one of them.</p></div>
        <div><small>Rotary International</small><strong>1.2M</strong><p>Rotary and Rotaract members across 200+ countries and geographical areas, connected since 1905.</p></div>
      </div>
    </Section>
  );
}

function WaysGrid({ tone = 'plain' }) {
  return (
    <Section tone={tone}>
      <Intro center label="How you can help" title="Ways you can make a difference" description="Whether you have an evening, a skill or a budget to give, there is a place for you in the club's work." />
      <div className="ways-grid">
        {waysToHelp.map((w, i) => {
          const Icon = ICONS[w.icon] ?? HandHeart;
          return (
            <div className="way" key={w.title}>
              <span className={`way-icon c-${i % 3}`}><Icon size={20} aria-hidden="true" /></span>
              <h3>{w.title}</h3>
              <p>{w.body}</p>
              <Link href={w.href} className="card-btn">{w.cta}</Link>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

function WideBanner() {
  return (
    <Section>
      <div className="wide-banner">
        <Photo src="/images/gallery/2.jpg" alt="Children at a school session" label=" " sizes="(max-width: 1240px) 100vw, 1240px" />
        <div className="wide-banner-card">
          <h2>Empowering young people to lead in Khopoli</h2>
          <p>Every member owns a project, manages a budget and reports the outcome, building skills a classroom does not teach.</p>
          <Btn href="/join" icon={false} className="btn-block">Join the Club</Btn>
        </div>
      </div>
    </Section>
  );
}

function ProjectsSection({ tone = 'plain' }) {
  return (
    <Section tone={tone}>
      <Intro center label="Our projects" title="Projects you can be part of" description="Every project is documented with dates, venue and partners." />
      <div className="card-grid">{eventsNewestFirst.slice(0, 3).map((e, i) => <EventCard e={withPhoto(e)} i={i} key={e.slug} />)}</div>
      <div className="center-row"><Btn href="/events" kind="outline">View All Events</Btn></div>
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

/** Rough reading time for a post, at about 200 words a minute. */
const readMinutes = (p) => {
  const words = p.body.map((b) => b.p ?? b.h2 ?? b.quote ?? (b.list ?? []).join(' ')).join(' ').split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
};

/** Blog card: the whole card is one link (via the title), with a photo, tag, date, title, summary and "Read article". */
function PostCard({ p, headingLevel = 3 }) {
  const H = `h${headingLevel}`;
  return (
    <article className="post-card">
      <div className="post-card-photo"><Photo src={p.image} alt="" label={p.title} sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 400px" /></div>
      <div className="post-card-body">
        <div className="post-card-meta"><span className="chip chip-line">{p.tags[0]}</span><time dateTime={p.date}>{formatPostDate(p.date)}</time></div>
        <H><Link href={`/blog/${p.slug}`} className="post-card-link">{p.title}</Link></H>
        <p>{p.excerpt}</p>
        <span className="post-read" aria-hidden="true">Read article <ArrowRight size={13} /></span>
      </div>
    </article>
  );
}

/** The newest post, shown large at the top of the blog. */
function PostFeatured({ p }) {
  return (
    <article className="post-featured">
      <div className="post-featured-photo"><Photo src={p.image} alt="" label={p.title} priority sizes="(max-width: 900px) 100vw, 640px" /></div>
      <div className="post-featured-body">
        <div className="post-card-meta"><span className="chip chip-line">Latest</span>{p.tags.map((t) => <span className="chip chip-line" key={t}>{t}</span>)}</div>
        <h2><Link href={`/blog/${p.slug}`} className="post-card-link">{p.title}</Link></h2>
        <p>{p.excerpt}</p>
        <p className="post-featured-meta"><time dateTime={p.date}>{formatPostDate(p.date)}</time> · {readMinutes(p)} min read</p>
        <span className="btn" aria-hidden="true">Read article <span className="btn-arrow"><ArrowRight size={14} /></span></span>
      </div>
    </article>
  );
}

function PostBody({ blocks }) {
  return blocks.map((b, i) => {
    if (b.h2) return <h2 key={i}>{b.h2}</h2>;
    if (b.quote) return <blockquote key={i} className="quote-box"><span className="quote-mark" aria-hidden="true">“</span><p>{b.quote}</p></blockquote>;
    if (b.list) return <ul key={i} className="check-list">{b.list.map((li) => <li key={li}><Check size={18} aria-hidden="true" /> {li}</li>)}</ul>;
    return <p key={i}>{b.p}</p>;
  });
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
            <h1>A small town club that keeps its word</h1>
            <p className="lead">{club.intro}</p>
            <div className="btn-row"><Btn href="/join">Join the Club</Btn><Link href="/about" className="learn-more">Learn More <ArrowRight size={16} aria-hidden="true" /></Link></div>
            <FamilyLogos title="Proudly part of the Rotary family" />
          </div>
          <div className="home-hero-art">
            <Photo src="/images/hero-stage.jpg" alt="Members of Rotaract Club of Khopoli together on stage at an event organised with Rotary Club of Khopoli" label=" " priority sizes="(max-width: 900px) 100vw, 50vw" />
            <div className="hero-quote"><span className="hero-small-avatar" aria-hidden="true">♥</span><p>“Service above self, written in the voice of a small town with big plans.”</p></div>
            <Link href="/gallery" className="story-reel"><span><small>See our</small><strong>photo gallery</strong></span><span className="play-button" aria-hidden="true"><Play size={14} /></span></Link>
            <Link href={`/events/${latest.slug}`} className="hero-info-card">
              <small>Latest project</small>
              <strong>{latest.title}</strong>
              <span>{formatDateRange(latest)}</span>
            </Link>
            <div className="hero-small-tag">Chartered<br />{club.charteredOn}</div>
          </div>
        </div>
      </section>

      <MetricCards />
      <ResultsBlocks />
      <VolunteerBlock />
      <ProjectsSection />
      <NumbersBlock />
      <WaysGrid />
      <WideBanner />
      <Testimonials />
      <CommunityCTA />
      <FaqBox />
    </>
  );
}

/* ======================= About ======================= */

export function About() {
  return (
    <>
      <PageHero layout="split" eyebrow="About Us" title="Know about our mission, vision and journey" desc={club.intro} wideImage="/images/gallery/1.jpg">
        <Btn href="/events" icon={false}>See Our Work</Btn>
      </PageHero>

      <Section>
        <h2 className="center strip-title">Rotary family and the values we work by</h2>
        <div className="logo-strip"><LogoMarquee grey={false} copies={5} /></div>
        <div className="value-grid">
          {values.map((v, i) => {
            const Icon = ICONS[v.icon] ?? HeartHandshake;
            return <div className="value" key={v.title}><span className={`way-icon c-${i % 3}`}><Icon size={20} aria-hidden="true" /></span><h3>{v.title}</h3><p>{v.body}</p></div>;
          })}
        </div>
      </Section>

      <Section>
        <Intro center label="Our impact" title="Since our charter, the club has kept showing up" />
        <StatCards stats={[
          { value: '2020', label: 'Year the club was chartered' },
          { value: String(events.length), label: 'Projects this Rotaract year' },
          { value: String(avenues.length), label: 'Avenues of service' },
          { value: `${uniqueMemberCount}+`, label: 'Office bearers and chairs' },
        ]} />
      </Section>

      <Section>
        <div className="story-block">
          <div className="story-photo">
            <Photo src="/images/volunteer.jpg" alt="A volunteer at a community project" label="Our story" sizes="(max-width: 900px) 100vw, 45vw" />
            <ChartCard title="Projects per month" caption="This Rotaract year" bars={['06', '07', '08', '09', '10'].map((m) => ({ label: MONTHS[Number(m) - 1], value: events.filter((e) => e.date.slice(5, 7) === m).length }))} />
          </div>
          <div className="story-copy prose">
            <Eyebrow>Our story</Eyebrow>
            <h2>A club built during a difficult year</h2>
            <p>Rotaract Club of Khopoli received its charter in November 2020, when public gatherings were restricted and most service work had moved to phone calls and spreadsheets. The first projects were practical: getting essentials to families and helping students who had lost access to classes.</p>
            <p>That start left a habit behind. The club plans on paper before it posts anything, gives every project a single owner, and reports what actually happened rather than what was intended.</p>
            <Btn href="/join" icon={false}>Join the Club</Btn>
          </div>
        </div>
      </Section>

      <Section>
        <Intro center label="Charter facts" title="The club on paper" />
        <dl className="facts-grid">{clubFacts.map((f) => <div key={f.label}><dt>{f.label}</dt><dd>{f.value}</dd></div>)}</dl>
      </Section>

      <Section>
        <Team label="Our team" title="Meet our incredible team" description={`The core team for the ${rotaractYear} Rotaract year.`} members={toTeam(coreMembers.slice(0, 4))} />
        <div className="center-row"><Btn href="/teams" kind="outline">Meet Everyone</Btn></div>
      </Section>

      <Section>
        <Intro center label="The Rotary family" title="Rotary, Rotaract and Interact" />
        <div className="value-grid">
          {[
            ['Rotary', 'A worldwide network of service clubs for working professionals. Rotary sponsors and mentors Rotaract clubs, including ours.', '/rotary-information', FAMILY_LOGOS[1]],
            ['Rotaract', "Rotary's programme for young adults. Clubs govern themselves, plan their own projects and report through their district: for us, District 3131.", '/district-3131', FAMILY_LOGOS[0]],
            ['Interact', 'The school-age wing of Rotary. Where we can, we support Interact clubs nearby so service starts before college.', null, FAMILY_LOGOS[2]],
          ].map(([t, d, href, logo]) => (
            <div className="value family-card" key={t}>
              <Image src={logo.src} alt={logo.alt} width={logo.w} height={logo.h} sizes="240px" className="family-card-logo" />
              <h3 className="sr-only">{t}</h3><p>{d}</p>
              {href && <Link href={href} className="text-link">Learn more <ArrowRight size={16} aria-hidden="true" /></Link>}
            </div>
          ))}
        </div>
      </Section>
      <Testimonials />
      <CommunityCTA />
    </>
  );
}

/* ======================= Teams ======================= */

export function Teams() {
  return (
    <>
      <PageHero eyebrow={`Board ${rotaractYear}`} title="Meet our incredible team" desc={`${uniqueMemberCount} Rotaractors hold the club's portfolios for ${rotaractYear}. Where one person holds several, their roles are listed together.`} />
      <Section className="team-section">
        <Team label="Office bearers" title="Our leadership team" description="The office bearers who lead the club's service year." members={toTeam(coreMembers)} columns={5} />
      </Section>
      <Section className="team-section">
        <Team label="Board" title="Board of directors" description="Avenue directors and officers who own budgets, reporting and district coordination." members={toTeam(boardOfDirectors)} />
      </Section>
      <Section className="team-section">
        <Team label="Chairs" title="Chairpersons" description="Chairs and additional portfolios." members={toTeam(chairpersons)} />
      </Section>
      <WaysGrid />
      <VolunteerBlock />
      <FaqBox />
    </>
  );
}

/* ======================= Avenues ======================= */

export function Avenues() {
  return (
    <>
      <PageHero layout="split" eyebrow="Avenues of service" title="Seven causes the club works for" desc="Rotaract's avenues of service, adapted to what a community club in Khopoli can genuinely deliver. Choose one to see its projects and the people who lead it.">
        <Btn href="/join" icon={false}>Pick Your Avenue</Btn>
      </PageHero>
      <Section><AvenueGrid items={avenues} withCta headingLevel={2} /></Section>
      <CommunityCTA />
    </>
  );
}

/** Arcs on the International Service map: Khopoli to the clubs and places this avenue connects with. */
const KHOPOLI = { lat: 18.7876, lng: 73.3442, label: 'Khopoli', side: 'left' };
const INTERNATIONAL_ARCS = [
  { lat: 28.6139, lng: 77.209, label: 'RAC Saanjh, Delhi', side: 'top' },
  { lat: 15.5833, lng: 73.95, label: 'RAC Bicholim, Goa', side: 'bottom' },
  { lat: 42.0451, lng: -87.6877, label: 'Rotary International, Evanston', side: 'top' },
].map((end) => ({ start: placeOnMap(KHOPOLI), end: placeOnMap(end) }));

export function AvenueDetail({ slug }) {
  const a = avenues.find((x) => x.slug === slug);
  const leads = membersWithRoles(a.leadRoles);
  const projects = eventsForAvenue(a);
  const others = avenues.filter((x) => x.slug !== slug);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd([['Avenues of Service', '/avenues'], [a.name, `/avenues/${a.slug}`]])) }} />
      <PageHero layout="split" eyebrow={a.focus} title={a.name} desc={a.description}>
        <Btn href={`/contact?about=${encodeURIComponent(`${a.name} project idea`)}`} icon={false}>Suggest a Project</Btn>
      </PageHero>
      <Section>
        <Intro center label="Projects" title={`${a.name} projects`} description={projects.length ? 'Recent work in this avenue.' : 'Projects for this avenue are being planned for the new Rotaract year.'} />
        {projects.length ? <div className="card-grid">{projects.map((e, i) => <EventCard e={withPhoto(e)} i={i} key={e.slug} />)}</div>
          : <p className="empty-note">No projects logged yet. Have an idea? <Link href="/contact">Tell us</Link> and we will help you run it.</p>}
      </Section>
      {slug === 'international-service' && (
        <Section className="world-section">
          <Intro center label="Beyond Khopoli" title="Our connections across the map" description="International service links us with clubs beyond our district and with the wider Rotary world: joint meetings with RAC Saanjh in Delhi and RAC Bicholim in Goa, and Rotary International, headquartered in Evanston, USA." />
          <WorldMap dots={INTERNATIONAL_ARCS} width={MAP_SIZE.width} height={MAP_SIZE.height} />
        </Section>
      )}
      {leads.length > 0 && (
        <Section>
          <Team label="Who leads it" title="Avenue leads" members={toTeam(leads)} />
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

/* ======================= Events (Kindora "Programs") ======================= */

export function Events() {
  // The newest project that has a photo leads the page.
  const featured = eventsNewestFirst.find((e) => eventImage(e)) ?? eventsNewestFirst[0];
  return (
    <>
      <PageHero layout="split" eyebrow="Our projects" title="Explore our life changing projects" desc="Dates, times and venues are confirmed by the secretary. Most community projects are open to volunteers.">
        <Btn href="/contact?about=Upcoming%20events" icon={false}>Get Notified</Btn>
      </PageHero>
      <Section>
        <div className="featured-card">
          <div className="featured-photo"><Photo src={eventImage(featured)} alt={featured.title} label={featured.title} priority sizes="(max-width: 900px) 100vw, 40vw" /></div>
          <div className="featured-copy">
            <EventStatus event={featured} />
            <h2>{featured.title}</h2>
            <p>{featured.summary}</p>
            <Btn href={`/events/${featured.slug}`} icon={false}>View Event</Btn>
            <dl className="event-card-facts"><div><dt>Date</dt><dd>{formatDateRange(featured)}</dd></div><div><dt>Venue</dt><dd>{featured.venue}</dd></div></dl>
          </div>
        </div>
      </Section>
      <Section id="calendar">
        <Intro center label="Club calendar" title="What&apos;s on, day by day" description="Pick a day to see what is planned. Upcoming projects can go straight into your own calendar." />
        <ClubCalendar events={events.map(({ slug, date, endDate, time, title, venue, avenue, summary }) => ({ slug, date, endDate, time, title, venue, avenue, summary }))} />
      </Section>
      <Section>
        <Intro center label="All projects" title="Each project is a chance to serve" description="Filter by status or avenue." />
        <EventsExplorer events={eventsNewestFirst.map(withPhoto)} />
      </Section>
      <Section>
        <Intro center label="Our network" title="Part of something bigger" />
        <div className="green-counter"><strong>2,700+</strong><p>Rotaractors in District 3131 work on projects like these across Pune and Raigad.</p></div>
      </Section>
      <FaqBox items={faqGroups[2].items} />
      <CommunityCTA />
    </>
  );
}

export function EventDetail({ slug }) {
  const e = events.find((x) => x.slug === slug);
  const others = eventsNewestFirst.filter((x) => x.slug !== slug).slice(0, 3);
  const avenue = avenues.find((a) => a.eventAvenues.includes(e.avenue));
  const jsonLd = [eventJsonLd(e, eventImage(e)), breadcrumbJsonLd([['Events', '/events'], [e.title, `/events/${e.slug}`]])];
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="detail-hero">
        <div className="container">
          <Eyebrow>{e.avenue}</Eyebrow>
          <h1>{e.title}</h1>
          <ul className="fact-chips">
            <li><EventStatus event={e} /></li>
            <li><CalendarDays size={16} aria-hidden="true" /> {formatDateRange(e)}</li>
            {e.time && <li><Clock size={16} aria-hidden="true" /> {e.time}</li>}
            <li><MapPin size={16} aria-hidden="true" /> {e.venue}</li>
            {e.partner && <li><Handshake size={16} aria-hidden="true" /> {e.partner}</li>}
          </ul>
          <div className="detail-photo"><Photo src={eventImage(e)} alt={e.title} label={e.title} priority sizes="(max-width: 1240px) 100vw, 1240px" /></div>
        </div>
      </section>
      <section className="section detail-body">
        <div className="container">
          <article className="prose narrow">
            {e.outcomes?.length > 0 && <dl className="outcome-grid">{e.outcomes.map((o) => <div key={o.label}><dd>{o.value}</dd><dt>{o.label}</dt></div>)}</dl>}
            {[].concat(e.report ?? e.summary).map((para) => <p key={para.slice(0, 40)}>{para}</p>)}
            <h2>Project details</h2>
            <p>This {avenue ? avenue.name.toLowerCase() : 'club'} project took place at {e.venue} on {formatDateRange(e)}{e.time ? `, ${e.time}` : ''}.</p>
            {e.partner && <p className="partner-note"><span className="partner-icon" aria-hidden="true"><Handshake size={18} /></span><span>Organised in partnership with <strong>{e.partner}</strong></span></p>}
            {e.gallery?.length > 0 && <GalleryGrid photos={e.gallery.map((src) => [src, e.title])} />}
            <div className="detail-actions">
              <Btn href={`/contact?about=${encodeURIComponent(e.title)}`} icon={false}>Volunteer or Enquire</Btn>
              <EventActions event={e} />
              {avenue && <Link href={`/avenues/${avenue.slug}`} className="text-link">More {avenue.name} projects <ArrowRight size={16} aria-hidden="true" /></Link>}
            </div>
          </article>
        </div>
      </section>
      <Section>
        <div className="yellow-band">
          <h2>Support projects like this</h2>
          <p>Sponsors receive the project report, photographs and a mention with the district.</p>
          <Btn href="/sponsorship" icon={false}>Become a Sponsor</Btn>
        </div>
      </Section>
      <Section>
        <Intro center title="More events" />
        <div className="card-grid">{others.map((o, i) => <EventCard e={withPhoto(o)} i={i} key={o.slug} />)}</div>
      </Section>
      <FaqBox items={faqGroups[2].items} />
      <CommunityCTA />
    </>
  );
}

/* ======================= Blog ======================= */

export function Blog({ page = 1 }) {
  const pages = Math.ceil(postsNewestFirst.length / PAGE_SIZE);
  const list = postsNewestFirst.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  return (
    <>
      <PageHero eyebrow="Blog & Updates" title="Blog & updates" desc="Stories from the club: our projects, our avenues and how to get involved." />
      <Section>
        {page === 1 && list.length > 0 && <PostFeatured p={list[0]} />}
        <div className="post-grid is-three">{(page === 1 ? list.slice(1) : list).map((p) => <PostCard p={p} key={p.slug} headingLevel={2} />)}</div>
        {pages > 1 && (
          <nav className="pagination" aria-label="Blog pages">
            {Array.from({ length: pages }, (_, n) => (
              <Link key={n} href={n === 0 ? '/blog' : `/blog/page/${n + 1}`} className={page === n + 1 ? 'is-active' : ''} aria-current={page === n + 1 ? 'page' : undefined}>{n + 1}</Link>
            ))}
          </nav>
        )}
      </Section>
      <CommunityCTA />
    </>
  );
}

export function BlogPost({ slug }) {
  const p = postsNewestFirst.find((x) => x.slug === slug);
  const others = postsNewestFirst.filter((x) => x.slug !== slug).slice(0, 3);
  const jsonLd = [postJsonLd(p), breadcrumbJsonLd([['Blog', '/blog'], [p.title, `/blog/${p.slug}`]])];
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="post-hero">
        <div className="container">
          <Link href="/blog" className="back-link"><ArrowLeft size={13} aria-hidden="true" /> All articles</Link>
          <header className="post-hero-head">
            <div className="post-tags">{p.tags.map((t) => <span className="chip chip-line" key={t}>{t}</span>)}</div>
            <h1>{p.title}</h1>
            <p className="post-lede">{p.excerpt}</p>
            <div className="post-byline">
              <span className="post-avatar" aria-hidden="true">RK</span>
              <span><strong>{club.name}</strong><span><time dateTime={p.date}>{formatPostDate(p.date)}</time> · {readMinutes(p)} min read</span></span>
            </div>
          </header>
          <div className="post-cover"><Photo src={p.image} alt="" label={p.title} priority sizes="(max-width: 1240px) 100vw, 1240px" /></div>
        </div>
      </section>
      <section className="section post-body">
        <div className="container">
          <article className="prose post-prose"><PostBody blocks={p.body} /></article>
          <div className="post-end">
            <Link href="/blog" className="back-link"><ArrowLeft size={13} aria-hidden="true" /> Back to all articles</Link>
            <Link href="/join" className="text-link">Join the club <ArrowRight size={13} aria-hidden="true" /></Link>
          </div>
        </div>
      </section>
      <Section>
        <Intro center title="Read other articles" />
        <div className="post-grid is-three">{others.map((o) => <PostCard p={o} key={o.slug} />)}</div>
      </Section>
      <CommunityCTA />
    </>
  );
}

/* ======================= Reviews ======================= */

export function Reviews() {
  return (
    <>
      <PageHero eyebrow="Voices of support" title="Hear from those who believe in our mission" desc="Members, partners and beneficiaries on working with Rotaract Club of Khopoli." />
      {testimonials.length > 0 && <Testimonials intro={false} />}
      <CommunityCTA />
      <Section id="share" className="note-section">
        <div className="note-head">
          <Eyebrow>Share your experience</Eyebrow>
          <h2>Leave a note</h2>
          <p>Been to one of our events, volunteered with us or partnered on a project? Pin a short note to the wall and send it to the club. We only ever publish a story with your permission.</p>
        </div>
        <NoteWall />
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
        <GalleryGrid photos={GALLERY} featured />
        <p className="small-note center">Some photographs are representative images while the club&apos;s own photo archive is being added.</p>
      </Section>
      <CommunityCTA />
    </>
  );
}

/* ======================= District & Rotary ======================= */

/** Yellow statistic cards: each figure in its own card, in the same yellow design. */
/** Big-number cards. tone: 'kindora' (yellow), 'rotary' (Rotary blue and gold) or 'rotaract' (cranberry). */
function StatCards({ stats, tone = 'kindora' }) {
  return (
    <dl className={`stat-cards is-${stats.length} tone-${tone}`}>
      {stats.map((st) => <div key={st.label}><dd>{st.value}</dd><dt>{st.label}</dt></div>)}
    </dl>
  );
}

/** A leader's photo, role, theme (with its logo) and message. Long messages fold behind "Read the full message". */
/**
 * A leader's address, laid out like an official message: a band naming the office, a portrait column
 * (photo, name, title, theme) that stays in view, and the message with a pull quote and a signature.
 * Long messages fold behind "Read the full message".
 */
function LeaderCard({ leader, office, org, tone = 'rotary', preview = 3 }) {
  const shown = leader.message.slice(0, preview);
  const rest = leader.message.slice(preview);
  const logo = leader.themeLogo;
  return (
    <article className={`leader is-${tone}`}>
      <header className="leader-band">
        <span className="leader-band-office">{office}</span>
        <span className="leader-band-meta">{org}<span aria-hidden="true"> · </span>{leader.year}</span>
      </header>
      <div className="leader-grid">
        <aside className="leader-aside">
          <div className="leader-portrait"><Photo src={leader.photo || undefined} alt={leader.name} label={initials(leader.name)} sizes="(max-width: 700px) 40vw, 360px" /></div>
          <div className="leader-ident">
            <h2>{leader.name}</h2>
            <p>{leader.role}</p>
          </div>
          <div className="leader-theme">
            {logo && <Image src={logo.src} alt={logo.alt} width={logo.w} height={logo.h} sizes="200px" className={logo.w > logo.h ? 'is-wide' : ''} />}
            <div>
              <small>{leader.themeLabel}</small>
              {!leader.themeInLogo && <strong>{leader.theme}</strong>}
            </div>
          </div>
        </aside>
        <div className="leader-main">
          <p className="leader-kicker">Message from the {leader.short}</p>
          {leader.highlight && (
            <blockquote className="leader-pull"><span aria-hidden="true" className="leader-pull-mark">“</span><p>{leader.highlight}</p></blockquote>
          )}
          {leader.message?.length > 0 && (
            <LeaderLetter greeting={leader.greeting} preview={shown} rest={rest} signoff={<Signoff lines={leader.signoff} />} />
          )}
        </div>
      </div>
    </article>
  );
}

/** Sign-off as a signature block: the closing line(s), then the name, then the title lines. */
function Signoff({ lines = [] }) {
  if (!lines.length) return null;
  const nameAt = lines.findIndex((l) => !/yours|regards/i.test(l));
  const closing = lines.slice(0, Math.max(0, nameAt));
  const name = lines[nameAt];
  const titles = lines.slice(nameAt + 1);
  return (
    <div className="leader-signoff">
      {closing.length > 0 && <p className="leader-closing">{closing.join(' ')}</p>}
      {name && <p className="leader-signature">{name}</p>}
      {titles.length > 0 && <p className="leader-signoff-title">{titles.join(' · ')}</p>}
    </div>
  );
}

export function District() {
  return (
    <>
      <PageHero eyebrow="Our district" title={district.name} desc={district.intro} logo={FAMILY_LOGOS[0]}>
        <Btn href={district.website} icon={false}>Visit the District Website</Btn>
      </PageHero>
      <Section><StatCards stats={district.stats} tone="rotaract" /></Section>
      <Section>
        <div className="about-text">
          <div><Eyebrow>About the district</Eyebrow><h2>What a Rotaract district does</h2></div>
          <div className="prose">{district.about.map((para) => <p key={para.slice(0, 30)}>{para}</p>)}</div>
        </div>
      </Section>
      <Section>
        <Intro center label="At a glance" title="Where Khopoli fits in" description="Our club takes part in district projects, trainings and fellowships alongside clubs across Pune and Raigad." />
        <div className="value-grid">{district.facts.map((f, i) => <div className="value" key={f.label}><span className={`way-icon c-${i % 3}`}><Globe2 size={20} aria-hidden="true" /></span><h3>{f.label}</h3><p>{f.value}</p></div>)}</div>
      </Section>
      <Section>
        <Intro center label="How the district helps" title="Four ways the district supports its clubs" />
        <div className="ways-grid is-four">
          {district.roles.map((r, i) => <div className="way" key={r.title}><span className={`way-icon c-${i % 3}`} aria-hidden="true">{i + 1}</span><h3>{r.title}</h3><p>{r.body}</p></div>)}
        </div>
      </Section>
      <Section>
        <Intro center label="District leadership" title={`Leading Rotaract District 3131 in ${drr.year}`} description="The District Rotaract Representative leads the district's Rotaract clubs through the Rotary year." />
        <LeaderCard leader={drr} office="District Rotaract Representative" org="Rotaract District 3131" tone="rotaract" />
      </Section>
      <CommunityCTA />
    </>
  );
}

export function RotaryInfo() {
  return (
    <>
      <PageHero eyebrow="Rotary International" title="People of action, since 1905" desc={rotary.intro} logo={FAMILY_LOGOS[1]}>
        <Btn href={rotary.website} icon={false}>Visit Rotary.org</Btn>
      </PageHero>
      <Section><StatCards stats={rotary.stats} tone="rotary" /></Section>
      <Section>
        <div className="about-text">
          <div><Eyebrow>Our history</Eyebrow><h2>Founded on {rotary.founded} in Chicago</h2></div>
          <div className="prose">{rotary.history.map((para) => <p key={para.slice(0, 30)}>{para}</p>)}</div>
        </div>
      </Section>
      <Section>
        <Intro center label="Milestones" title="From one meeting to a worldwide network" />
        <ol className="timeline">{rotary.timeline.map((t) => <li key={t.year}><strong>{t.year}</strong><p>{t.text}</p></li>)}</ol>
      </Section>
      <Section>
        <div className="value-grid is-two">
          {[['Our vision', rotary.vision], ['Our mission', rotary.mission]].map(([t, d], i) => (
            <div className="value" key={t}><span className={`way-icon c-${i % 3}`}><Sparkles size={20} aria-hidden="true" /></span><h3>{t}</h3><p>{d}</p></div>
          ))}
        </div>
      </Section>
      <Section>
        <div className="four-way">
          <div><Eyebrow>Rotary&apos;s code of ethics</Eyebrow><h2>The Four-Way Test</h2><p>Of the things we think, say or do:</p></div>
          <ol>{rotary.fourWayTest.map((q) => <li key={q}>{q}</li>)}</ol>
        </div>
      </Section>
      <Section>
        <Intro center label="Areas of focus" title="Seven causes Rotary works on worldwide" description="Rotary members and clubs focus their service on seven areas where they can make the biggest difference." />
        <div className="focus-grid">
          {rotary.areasOfFocus.map((a, i) => <div key={a.name}><span className={`way-icon c-${i % 3}`} aria-hidden="true"><Check size={18} /></span><h3>{a.name}</h3><p>{a.body}</p></div>)}
        </div>
        <p className="small-note center">Summarised from <a href={rotary.website} target="_blank" rel="noreferrer">rotary.org</a>.</p>
      </Section>
      <Section>
        <Intro center label="Rotary leadership" title={`Leading Rotary in ${riPresident.year}`} description="The President of Rotary International and the Governor of Rotary District 3131, our sponsoring Rotary district." />
        <div className="leader-stack">
          <LeaderCard leader={riPresident} office="President" org="Rotary International" tone="rotary" preview={4} />
          <LeaderCard leader={districtGovernor} office="District Governor" org="Rotary District 3131" tone="gold" />
        </div>
      </Section>
      <CommunityCTA />
    </>
  );
}

/* ======================= FAQs ======================= */

export function Faqs() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(allFaqs)) }} />
      <PageHero eyebrow="Questions answered" title="Frequently asked questions" desc="About the club, membership, events and how Rotaract connects to Rotary." />
      <Section><div className="faq-page"><FaqSearch groups={faqGroups} /></div></Section>
      <CommunityCTA />
    </>
  );
}

/* ======================= Join ======================= */

export function Join() {
  return (
    <>
      <PageHero layout="split" eyebrow="Join the club" title="Join a club that finishes what it starts" desc="Membership is open to young adults living, studying or working in and around Khopoli. There is no campus requirement." wideImage="/images/gallery/4.jpg" />
      <Section>
        <Intro center label="What we expect" title="Three commitments, nothing hidden" />
        <ol className="value-grid numbered">
          {joinCommitments.map((c, i) => <li className="value" key={c.title}><span className={`way-icon c-${i % 3}`} aria-hidden="true">{i + 1}</span><h3>{c.title}</h3><p>{c.body}</p></li>)}
        </ol>
      </Section>
      <FaqBox items={faqGroups[1].items} />
      <Section>
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
          </div>
          <MailForm
            title="Membership application"
            intro="Tell us a little about yourself."
            subject="Membership application"
            submitLabel="Submit Application"
            fields={[
              { name: 'name', label: 'Your full name', required: true, placeholder: 'Full name', autoComplete: 'name' },
              { name: 'email', label: 'Your email', type: 'email', required: true, placeholder: 'you@example.com', autoComplete: 'email' },
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
      <Section>
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

/* ======================= Sponsorship (Kindora "Donation") ======================= */

export function Sponsorship() {
  return (
    <>
      <PageHero layout="split" eyebrow="Sponsorship" title="Support us and make a difference in Khopoli" desc="Sponsorship pays for materials, transport and venues. Every rupee is accounted for in the project report, and we send it to you whether or not you ask.">
        <Btn href="#enquiry" icon={false}>Become a Sponsor</Btn>
      </PageHero>
      <Section>
        <Intro center label="Partnership packages" title="You can contribute through our partnership packages" description="Amounts are set per project rather than fixed, because a plantation drive and a skills workshop cost very different things." />
        <div className="package-grid">
          {sponsorTiers.map((t, i) => (
            <div className={`package c-${i}`} key={t.name}>
              <h3>{t.name}</h3>
              <p>{t.scope}</p>
              <strong>Per project</strong>
              <ul>{t.perks.map((pk) => <li key={pk}><Check size={16} aria-hidden="true" /> {pk}</li>)}</ul>
              <a href="#enquiry" className="card-btn is-solid">Enquire Now</a>
            </div>
          ))}
        </div>
      </Section>
      <WaysGrid />
      <ResultsBlocks />
      <VolunteerBlock />
      <NumbersBlock />
      <Section id="enquiry">
        <div className="form-layout">
          <div className="prose">
            <Eyebrow>Sponsorship enquiry</Eyebrow>
            <h2>Tell us how you would like to help</h2>
            <ul className="check-list">
              <li><Check size={18} aria-hidden="true" /> A written report for every project you fund</li>
              <li><Check size={18} aria-hidden="true" /> Your logo on project creatives and banners</li>
              <li><Check size={18} aria-hidden="true" /> In-kind support acknowledged exactly like funding</li>
            </ul>
            <ContactMethods />
          </div>
          <MailForm
            title="Sponsorship form"
            intro="Fill in the form and a board member will get back to you. Contributions big or small help the club serve Khopoli."
            subject="Sponsorship enquiry"
            submitLabel="Send Enquiry"
            fields={[
              { name: 'name', label: 'Your full name', required: true, placeholder: 'Full name', autoComplete: 'name' },
              { name: 'organisation', label: 'Organisation', required: true, placeholder: 'Business or organisation', autoComplete: 'organization' },
              { name: 'email', label: 'Your email', type: 'email', required: true, placeholder: 'you@company.com', autoComplete: 'email' },
              { name: 'phone', label: 'Phone', type: 'tel', required: true, pattern: '[0-9]{10}', title: 'Enter a 10-digit phone number', autoComplete: 'tel-national' },
              { name: 'tier', label: 'Choose how you would like to help', options: [...sponsorTiers.map((t) => t.name), 'In-kind support', 'Not sure yet'] },
              { name: 'message', label: 'Anything we should know?', rows: 4, placeholder: 'A project, budget or idea you have in mind.' },
            ]}
          />
        </div>
      </Section>
    </>
  );
}

export function Contact() {
  return (
    <>
      <PageHero eyebrow="Contact us" title="Get in touch with Rotaract Khopoli" desc="No ticketing system and no form queue you never hear back from. Messages go straight to the board." />
      <Section className="contact-cards-section">
        <div className="contact-cards">
          <div className="contact-card c-0">
            <h2>General inquiries</h2>
            <p>Questions about the club, membership, meetings or upcoming projects.</p>
            <a href={`mailto:${clubEmail}`} className="card-btn is-solid">Contact Us</a>
          </div>
          <div className="contact-card c-2">
            <h2>Partnership opportunities</h2>
            <p>If you represent a school, business or organisation interested in partnering with the club.</p>
            <Link href="/sponsorship" className="card-btn is-solid">Contact Us</Link>
          </div>
        </div>
      </Section>
      <FaqBox />
      <Section id="message">
        <div className="form-layout">
          <div>
            <Intro label="Get in touch" title="Why reach out to Rotaract Khopoli?" description="Whether you want to volunteer, join, partner or simply ask a question, a board member will reply personally." />
            <div className="why-grid">
              <div><span className="way-icon c-1"><MessageCircle size={20} aria-hidden="true" /></span><h3>Personal replies</h3><p>Messages go to the board, not a queue.</p></div>
              <div><span className="way-icon c-2"><MapPin size={20} aria-hidden="true" /></span><h3>Meet us in person</h3><p>We meet at {contact.meetingPlace.split(',')[0]}.</p></div>
            </div>
            <ContactMethods showPhone />
            <SocialLinks className="social-dark" />
          </div>
          <MailForm
            title="Let's chat"
            intro="Want to learn more about the club? We are ready to help."
            subject="Website enquiry"
            prefill="message"
            fields={[
              { name: 'name', label: 'Your full name', required: true, placeholder: 'Full name', autoComplete: 'name' },
              { name: 'email', label: 'Your email', type: 'email', required: true, placeholder: 'you@example.com', autoComplete: 'email' },
              { name: 'message', label: 'Your message', rows: 6, required: true, minLength: 10, placeholder: 'Write your message' },
            ]}
          />
        </div>
      </Section>
    </>
  );
}

/* ======================= Legal ======================= */

function LegalPage({ eyebrow, title, desc, sections }) {
  return (
    <>
      <PageHero eyebrow={eyebrow} title={title} desc={desc} />
      <Section>
        <div className="prose narrow">
          {sections.map(([h, body]) => <div key={h}><h2>{h}</h2>{body}</div>)}
          <p className="small-note">Last updated November 2026.</p>
        </div>
      </Section>
    </>
  );
}

export function Privacy() {
  return (
    <LegalPage
      eyebrow="Privacy policy" title="How we handle your details" desc="Plain-language notes on what this website collects and what the club does with it."
      sections={[
        ['What we collect', <p key="a">We only collect what you type into a form on this site: for example your name, email, phone number and message when you apply for membership, enquire about sponsorship, apply for the board, share a testimonial or contact us.</p>],
        ['How we use it', <p key="b">Your details are used only to reply to you and to process your application or enquiry. We do not sell or share them with anyone outside the club, except where a project partner needs them to arrange something you asked for, and only with your agreement.</p>],
        ['How it is sent and stored', <p key="c">Depending on how the site is set up, a form either opens your own email app with the message ready to send, or delivers it through a form service to the club inbox. Messages are kept for as long as they are needed, and applications for the current Rotaract year.</p>],
        ['Visitor statistics', <p key="d">The site may count page views with privacy-friendly analytics that do not use cookies or build personal profiles.</p>],
        ['Your choices', <p key="e">You can ask us to show, correct or delete the details you sent at any time by writing to <a href={`mailto:${clubEmail}`}>{clubEmail}</a>.</p>],
      ]}
    />
  );
}

export function Terms() {
  return (
    <LegalPage
      eyebrow="Terms & conditions" title="Using this website" desc="The simple terms for using the Rotaract Club of Khopoli website."
      sections={[
        ['About this site', <p key="a">This website is run by {club.name} (Club ID {club.clubId}), a Rotaract club under Rotary International in {club.district}. Views expressed here are the club&apos;s own.</p>],
        ['Information on the site', <p key="b">We keep event dates, venues and member details as accurate as we can, but they may change. The secretary confirms final details for every project.</p>],
        ['Logos and photos', <p key="c">The Rotaract, Rotary and Interact logos are trademarks of Rotary International and are used under its brand guidelines. Some photographs are representative stock images; please do not reuse photos from this site without asking.</p>],
        ['Forms and sponsorship', <p key="d">Sending a form does not create a contract. Sponsorship and partnership terms are agreed in writing with the board for each project.</p>],
        ['Contact', <p key="e">Questions about these terms? Write to <a href={`mailto:${clubEmail}`}>{clubEmail}</a>.</p>],
      ]}
    />
  );
}

export function NotFound() {
  return (
    <section className="error-page">
      <div className="container">
        <svg className="error-icon" viewBox="0 0 96 88" aria-hidden="true"><path d="M41.1 5.5a8 8 0 0 1 13.8 0l38 66A8 8 0 0 1 86 83.5H10a8 8 0 0 1-6.9-12z" fill="currentColor" /><rect x="44" y="28" width="8" height="30" rx="4" fill="#fff" /><circle cx="48" cy="68" r="5" fill="#fff" /></svg>
        <h1>Sorry! Page not found</h1>
        <p>It looks like the page you are looking for does not exist or has moved. Let&apos;s get you back on track.</p>
        <div className="btn-row center-row"><Btn href="/" icon={false}>Back To Home</Btn></div>
      </div>
    </section>
  );
}


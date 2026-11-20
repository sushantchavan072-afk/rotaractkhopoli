import Link from 'next/link';
import {
  ArrowUpRight, CalendarDays, Clock, MapPin, Handshake, Mail, Phone, Quote, Check,
  HandHeart, GraduationCap, Users, Globe2, Megaphone, HeartHandshake, Sparkles, Sprout, Award,
} from 'lucide-react';
import {
  club, clubFacts, officers, clubEmail, avenues, events, eventsNewestFirst, formatDate, isPast,
  coreMembers, boardOfDirectors, chairpersons, uniqueMemberCount, initials, testimonials,
  faqGroups, allFaqs, district, rotary, sponsorTiers, joinCommitments,
} from '../data/club';
import { Btn, Eyebrow, Intro, Section, PageHero, Photo, FaqList, MailForm } from './ui';

const ICONS = { HandHeart, GraduationCap, Users, Globe2, Megaphone, HeartHandshake, Sparkles };
const eventImage = (e) => `/images/events/${e.slug}.jpg`;
const memberImage = (m) => (m.photo ? `/images/members/${m.photo}.png` : undefined);
const PARTNERS = ['Rotary International', 'Rotaract District 3131', 'Rotary Club of Khopoli', 'RAC Saanjh, Delhi', 'RAC Bicholim', 'Khopoli Municipal Council'];

/* ======================= Shared blocks ======================= */

function EventCard({ e, i = 0 }) {
  const past = isPast(e);
  return (
    <article className="program-card">
      <Link href={`/events/${e.slug}`} className="program-image">
        <Photo src={eventImage(e)} alt={e.title} label={e.title} tone={i} />
      </Link>
      <div className="program-content">
        <div className="program-meta">
          <span>{e.avenue}</span>
          <span className={past ? 'tag-past' : 'tag-upcoming'}>{past ? 'Completed' : 'Upcoming'}</span>
        </div>
        <h3><Link href={`/events/${e.slug}`}>{e.title}</Link></h3>
        <p>{e.summary}</p>
        <div className="funds">
          <div><small>Date</small><b>{formatDate(e.date)}</b></div>
          <div><small>Time</small><b className="small-b">{e.time}</b></div>
        </div>
        <Link href={`/events/${e.slug}`} className="inline-arrow">View Event <ArrowUpRight size={19} /></Link>
      </div>
    </article>
  );
}

function MemberCard({ m, i = 0 }) {
  return (
    <div className="team-card">
      <div className="team-photo"><Photo src={memberImage(m)} alt={m.name} tone={i} /></div>
      <h3>{m.name}</h3>
      {m.roles.map((r) => <p key={r}>{r}</p>)}
    </div>
  );
}

function ReviewCard({ r, i }) {
  return (
    <div className="review-card">
      <div className="stars">★★★★★</div>
      <Quote className="review-quote" size={30} />
      <p>“{r.quote}”</p>
      <div className="review-person">
        <span className={`initial-avatar tone-${i % 3}`}>{initials(r.name)}</span>
        <div><h4>{r.name}</h4><small>{r.role}</small></div>
      </div>
    </div>
  );
}

function AvenueGrid({ items, withCta = false }) {
  return (
    <div className="ways-grid">
      {items.map((a, i) => {
        const Icon = ICONS[a.icon] ?? HandHeart;
        return (
          <Link href={`/avenues#${a.slug}`} id={withCta ? a.slug : undefined} key={a.slug} className={`way-card way-${i % 6}`}>
            <Icon size={32} />
            <small className="way-focus">{a.focus}</small>
            <h3>{a.name}</h3>
            <p>{a.description}</p>
            <span>Explore <ArrowUpRight size={16} /></span>
          </Link>
        );
      })}
      {withCta && (
        <>
          <Link href="/join" className="way-card way-cta-a"><Users size={32} /><small className="way-focus">Pick your avenue</small><h3>Join a project team</h3><p>Every member chooses an avenue and leads or co-leads at least one project a year.</p><span>Apply now <ArrowUpRight size={16} /></span></Link>
          <Link href="/sponsorship" className="way-card way-cta-b"><Handshake size={32} /><small className="way-focus">Partner with us</small><h3>Sponsor an avenue</h3><p>Back a single project or a whole avenue for the year, with a report on every rupee.</p><span>See tiers <ArrowUpRight size={16} /></span></Link>
        </>
      )}
    </div>
  );
}

function CommunityCTA() {
  return (
    <Section>
      <div className="community-cta">
        <div className="community-copy">
          <Eyebrow>Membership open</Eyebrow>
          <h2>Bring one idea. We will help you finish it.</h2>
          <p>Membership is open to young adults living, studying or working in and around Khopoli. There is no campus requirement.</p>
          <div className="btn-row"><Btn href="/join">Apply for Membership</Btn><Btn href="/sponsorship" kind="outline">Partner With Us</Btn></div>
        </div>
        <Photo src="/images/cta.jpg" alt="Volunteers joining hands" label="Service above self" tone={1} className="cta-photo" />
      </div>
    </Section>
  );
}

function MissionBlock({ gray = false }) {
  return (
    <Section gray={gray}>
      <div className="volunteer-grid">
        <div className="mission-photo">
          <Photo src="/images/volunteer.jpg" alt="A volunteer at a community service project" label="Our mission" tone={0} className="volunteer-photo-img" />
          <div className="mission-badge"><strong>{club.charteredOn.split(' ')[1]}</strong><span>Serving Khopoli since</span></div>
        </div>
        <div>
          <Intro label="Our mission" title="Service above self, close to home" description="We bring young people in and around Khopoli together to serve the town they grew up in, and to grow as leaders while they do it." />
          <div className="feature-list">
            <div className="feature-row"><span className="feature-icon"><HandHeart /></span><div><h3>Serve the community</h3><p>Health, education, environment and livelihood projects planned with the people they are meant for.</p></div></div>
            <div className="feature-row"><span className="feature-icon"><GraduationCap /></span><div><h3>Grow young leaders</h3><p>Every member owns a project, manages a budget and reports the outcome, building skills a classroom does not teach.</p></div></div>
            <div className="feature-row"><span className="feature-icon"><Globe2 /></span><div><h3>Connect beyond Khopoli</h3><p>Joint projects with clubs across India and the global Rotary network of 1.2 million members.</p></div></div>
          </div>
          <div className="btn-row"><Btn href="/about">Our Story</Btn><Btn href="/events" kind="ghost">See Our Work</Btn></div>
        </div>
      </div>
    </Section>
  );
}

function GetInvolved({ gray = true }) {
  const ways = [
    { href: '/contact', img: '/images/volunteer.jpg', tag: 'Give your time', title: 'Volunteer at a project', copy: 'Most community projects are open to volunteers. Turn up for one drive and see how it feels.', cta: 'Volunteer' },
    { href: '/join', img: '/images/gallery/4.jpg', tag: 'Become a Rotaractor', title: 'Join the club', copy: 'Open to anyone 18+ living, studying or working in and around Khopoli. No campus requirement.', cta: 'Apply now' },
    { href: '/sponsorship', img: '/images/support.jpg', tag: 'Fund the work', title: 'Sponsor a project', copy: 'Back a single project or a whole avenue. Every rupee is accounted for in the project report.', cta: 'Support us' },
  ];
  return (
    <Section gray={gray}>
      <Intro center label="Get involved" title="Three ways you can make a difference" description="Whether you have an evening, a skill or a budget to give, there is a place for you in the club's work." />
      <div className="involve-grid">
        {ways.map((w, i) => (
          <Link href={w.href} className="involve-card" key={w.title}>
            <div className="involve-photo"><Photo src={w.img} alt={w.title} label={w.title} tone={i} /><span className="involve-tag">{w.tag}</span></div>
            <div className="involve-body"><h3>{w.title}</h3><p>{w.copy}</p><span className="inline-arrow">{w.cta} <ArrowUpRight size={18} /></span></div>
          </Link>
        ))}
      </div>
    </Section>
  );
}

function Gallery({ gray = false }) {
  const photos = [
    ['/images/gallery/1.jpg', 'Volunteers sorting donated supplies'],
    ['/images/events/tree-plantation.jpg', 'Saplings ready for planting'],
    ['/images/gallery/2.jpg', 'Children at a school session'],
    ['/images/gallery/3.jpg', 'Hands joined in a team huddle'],
    ['/images/events/maha-aarti.jpg', 'Diya at the Maha Aarti evening'],
    ['/images/gallery/5.jpg', 'Smiling children'],
    ['/images/gallery/6.jpg', 'Seedlings in a nursery tray'],
  ];
  return (
    <Section gray={gray}>
      <div className="split-intro">
        <Intro label="Gallery" title="Moments from the field" description="Small projects, real people, and the town we grew up in." />
        <Btn href="/events" kind="outline">View Projects</Btn>
      </div>
      <div className="gallery-grid">
        {photos.map(([src, alt], i) => <figure key={src} className={`gallery-item g-${i}`}><Photo src={src} alt={alt} tone={i} /><figcaption>{alt}</figcaption></figure>)}
      </div>
    </Section>
  );
}

function ImpactBand() {
  return (
    <section className="impact-band">
      <div className="container">
        {[
          [events.length, 'Projects this year'],
          [avenues.length, 'Avenues of service'],
          [`${uniqueMemberCount}+`, 'Active Rotaractors'],
          ['2020', 'Year chartered'],
        ].map(([n, l]) => <div key={l}><strong>{n}</strong><span>{l}</span></div>)}
      </div>
    </section>
  );
}

function FaqBlock({ items = allFaqs.slice(0, 5) }) {
  return (
    <Section extra="faq-section">
      <div className="faq-layout">
        <div className="faq-title">
          <Intro label="Questions answered" title="Most people ask us these first" description="Membership, meetings, fees and how the club fits into Rotary." />
          <Btn href="/faqs" kind="outline">Read All FAQs</Btn>
        </div>
        <FaqList items={items} />
      </div>
    </Section>
  );
}

/* ======================= Home ======================= */

export function Home() {
  const featured = eventsNewestFirst.slice(0, 3);
  const community = events.filter((e) => e.avenue === 'Community Service').length;
  const partners = new Set(events.map((e) => e.partner).filter(Boolean)).size;
  return (
    <>
      <section className="home-hero">
        <div className="container home-hero-grid">
          <div className="home-hero-copy">
            <div className="donorline">
              <div className="avatar-stack">
                {coreMembers.slice(0, 3).map((m, i) => <span key={m.name} className={`initial-avatar tone-${i}`}>{initials(m.name)}</span>)}
              </div>
              <span>{uniqueMemberCount}+ Rotaractors serving Khopoli</span>
            </div>
            <h1>A small town club that <span>keeps its word.</span></h1>
            <p>{club.intro}</p>
            <div className="btn-row"><Btn href="/join">Join the Club</Btn><Btn href="/about" kind="ghost">What We Do</Btn></div>
            <div className="brand-zone">
              <h4>Working alongside</h4>
              <div className="brand-track">
                {[...PARTNERS, ...PARTNERS].map((p, i) => <span className="brand-chip" key={i} aria-hidden={i >= PARTNERS.length}>{p}</span>)}
              </div>
            </div>
          </div>
          <div className="hero-art">
            <Photo src="/images/hero.jpg" alt="Rotaract Club of Khopoli members at a community project" label=" " className="hero-photo" priority />
            <div className="hero-quote"><div className="hero-small-avatar">♥</div><p>“They asked what our school actually needed instead of arriving with a photo op.”</p></div>
            <Link href="/events" className="story-reel"><div><span>See what we</span><strong>did this year</strong></div><span className="play-button"><ArrowUpRight size={17} /></span></Link>
            <div className="hero-info-card"><strong>Chartered {club.charteredOn}</strong><p>Community based club · ID {club.clubId} · {club.district}</p><div className="mini-avatar-row">🌱 🤝 🎨</div></div>
            <div className="hero-small-tag">Service above self,<br />since 2020</div>
          </div>
        </div>
      </section>

      <ImpactBand />

      <MissionBlock gray />

      <Section>
        <Intro center label="Who we are" title="Young people, local problems, real follow-through" description="Rotaract is Rotary's movement for people who want to serve while they are still building their own careers." />
        <div className="results-block">
          <div className="results-copy">
            <span className="pill-label">Community Service</span>
            <h3>Khopoli first, planned with the people who live with the results</h3>
            <p>In Khopoli that means projects sized to what we can actually finish, and finish well: plantation drives with watering rosters, gaushala mornings and community evenings with local trustees.</p>
            <div className="results-stat"><div><b>{community}</b><span>Community projects</span></div><div><b>{partners}</b><span>Partner organisations</span></div></div>
          </div>
          <div className="results-images">
            <Photo src="/images/events/tree-plantation.jpg" alt="Tree plantation drive" label="Tree Plantation" tone={1} />
            <Photo src="/images/events/gau-seva.jpg" alt="Gau Seva" label="Gau Seva" tone={2} />
          </div>
        </div>
        <div className="results-block flipped">
          <div className="results-copy">
            <span className="pill-label">Professional Development</span>
            <h3>Leaving the club more employable than when you joined</h3>
            <p>Workshops, DEI sessions and joint meetings with clubs across India. The club was chartered in November 2020, a year when meeting at all was hard, and that shaped how we work.</p>
            <div className="results-stat"><div><b>2020</b><span>Chartered</span></div><div><b>2</b><span>Inter-club partnerships</span></div></div>
          </div>
          <div className="results-images">
            <Photo src="/images/events/pd-session.jpg" alt="Professional development session" label="PD Session" tone={3} />
            <Photo src="/images/events/joint-meeting.jpg" alt="Joint meeting" label="Joint Meeting" tone={4} />
          </div>
        </div>
      </Section>

      <GetInvolved />

      <Section>
        <Intro center label="Avenues" title="Seven causes we work for" description="Every member picks an avenue. Every project has one owner." />
        <AvenueGrid items={avenues.slice(0, 6)} />
        <div className="center btn-row button-margin"><Btn href="/avenues" kind="outline">Read All Avenues</Btn></div>
      </Section>

      <Section gray>
        <div className="split-intro">
          <Intro label="Events" title="What we have been up to" description="Every completed project is documented with dates, venue and partners." />
          <Btn href="/events" kind="outline">All Events</Btn>
        </div>
        <div className="card-grid">{featured.map((e, i) => <EventCard e={e} i={i} key={e.slug} />)}</div>
      </Section>

      <Gallery />

      <Section gray>
        <Intro center label="The board" title="Meet the people who keep it moving" description="The core team for the current Rotaract year." />
        <div className="team-grid">{coreMembers.slice(0, 4).map((m, i) => <MemberCard m={m} i={i} key={m.name} />)}</div>
        <div className="center btn-row button-margin"><Btn href="/members" kind="outline">Meet Every Member</Btn></div>
      </Section>

      <Section>
        <Intro center label="In their words" title="What members and partners say" />
        <div className="reviews-grid">{testimonials.slice(0, 3).map((r, i) => <ReviewCard r={r} i={i} key={r.name} />)}</div>
      </Section>

      <FaqBlock />
      <CommunityCTA />
    </>
  );
}

/* ======================= About ======================= */

export function About() {
  return (
    <>
      <section className="about-hero">
        <div className="container about-grid">
          <div>
            <Eyebrow>About the club</Eyebrow>
            <h1>Chartered in 2020. Still here, still working.</h1>
            <p>{club.intro}</p>
            <div className="btn-row"><Btn href="/join">Join the Club</Btn><Btn href="/members" kind="ghost">Meet the Board</Btn></div>
          </div>
          <Photo src="/images/about.jpg" alt="Rotaract Club of Khopoli members" label="Est. 2020" tone={0} className="about-photo" />
        </div>
      </section>

      <Section gray>
        <div className="volunteer-grid">
          <Photo src="/images/gallery/1.jpg" alt="Volunteers sorting essentials for families" label="Our story" tone={2} className="volunteer-photo-img" />
          <div>
            <Intro label="Our story" title="A club built during a difficult year" />
            <p>Rotaract Club of Khopoli received its charter in November 2020, when public gatherings were restricted and most service work had moved to phone calls and spreadsheets. The first projects were logistical: getting essentials to families, helping students who had lost access to classes.</p>
            <p>That start left a habit behind. The club plans on paper before it posts anything, assigns a single owner to every project, and reports what actually happened rather than what was intended.</p>
            <p>As a community based club, our members are not tied to one campus. Students, early-career professionals and local business owners sit at the same table, which is exactly why the club can pull off projects bigger than its size.</p>
          </div>
        </div>
      </Section>

      <Section>
        <Intro center label="Structure" title="How the club is organised" />
        <div className="values-grid">
          {[
            [Users, 'General body', 'Every inducted member. The general body approves the calendar, votes on inductions and carries out projects.'],
            [Award, 'Board of directors', 'President, secretary and avenue directors elected for the Rotaract year. The board owns budgets, reporting and district coordination.'],
            [Handshake, 'Project teams', 'Formed per project with one accountable lead, so nothing depends on a single office-bearer being free that week.'],
          ].map(([Icon, t, d], i) => (
            <div className={`value-card value-${i}`} key={t}><span className="value-icon"><Icon size={26} /></span><h3>{t}</h3><p>{d}</p></div>
          ))}
        </div>
      </Section>

      <Section gray>
        <Intro center label="Charter facts" title="The club on paper" />
        <div className="facts-grid">
          {clubFacts.map((f) => <div key={f.label}><span>{f.label}</span><strong>{f.value}</strong></div>)}
        </div>
      </Section>

      <Section>
        <Intro center label="Context" title="Rotary, Rotaract and Interact" />
        <div className="values-grid">
          {[
            ['Rotary', 'A global network of service clubs of working professionals. Rotary sponsors and mentors Rotaract clubs, including ours.', '/rotary-information'],
            ['Rotaract', "Rotary's programme for young adults. Clubs are self-governing, plan their own projects, and report through their district, for us, District 3131.", '/district-3131'],
            ['Interact', 'The school-age wing. Where we can, we support Interact clubs nearby so service starts earlier than college.', null],
          ].map(([t, d, href], i) => (
            <div className={`value-card value-${i}`} key={t}>
              <h3>{t}</h3><p>{d}</p>
              {href && <Link href={href} className="inline-arrow card-link">Learn more <ArrowUpRight size={16} /></Link>}
            </div>
          ))}
        </div>
      </Section>
      <GetInvolved />
      <Gallery />
      <CommunityCTA />
    </>
  );
}

/* ======================= Avenues ======================= */

export function Avenues() {
  return (
    <>
      <PageHero eyebrow="Avenues of service" title="Seven directions the club works in" desc="Rotaract's avenues of service, adapted to what a community club in Khopoli can genuinely deliver." />
      <Section><AvenueGrid items={avenues} withCta /></Section>
      <CommunityCTA />
    </>
  );
}

/* ======================= Events ======================= */

export function Events() {
  const upcoming = events.filter((e) => !isPast(e));
  return (
    <>
      <PageHero eyebrow="Events & projects" title="What the club has done, and what is next" desc="Dates, times and venues are indicative and confirmed by the secretary. Most community projects are open to volunteers." />
      {upcoming.length === 0 && (
        <Section>
          <div className="notice-banner">
            <CalendarDays size={26} />
            <div><b>The next calendar is being finalised.</b><p>Project dates for the current Rotaract year are being confirmed with the board. Write to the club to be told first.</p></div>
            <Btn href="/contact" kind="dark">Get Notified</Btn>
          </div>
        </Section>
      )}
      <Section gray={upcoming.length === 0}>
        <div className="card-grid">{eventsNewestFirst.map((e, i) => <EventCard e={e} i={i} key={e.slug} />)}</div>
      </Section>
      <CommunityCTA />
    </>
  );
}

export function EventDetail({ slug }) {
  const e = events.find((x) => x.slug === slug);
  const others = eventsNewestFirst.filter((x) => x.slug !== slug).slice(0, 3);
  return (
    <>
      <PageHero eyebrow={e.avenue} title={e.title} desc={e.summary} />
      <Section>
        <div className="detail-grid">
          <article className="detail-article">
            <Photo src={eventImage(e)} alt={e.title} label={e.title} className="detail-main-photo" tone={1} />
            <h2>About this {isPast(e) ? 'project' : 'event'}</h2>
            <p>{e.summary}</p>
            {e.partner && <blockquote>Organised in partnership with {e.partner}.</blockquote>}
            <h3>Details</h3>
            <ul className="detail-list">
              <li><b>Date:</b> {formatDate(e.date)}</li>
              <li><b>Time:</b> {e.time}</li>
              <li><b>Venue:</b> {e.venue}</li>
              <li><b>Avenue:</b> {e.avenue}</li>
            </ul>
          </article>
          <aside className="detail-sidebar">
            <div className="sidebar-card">
              <Eyebrow>{isPast(e) ? 'Completed' : 'Upcoming'}</Eyebrow>
              <ul className="event-facts">
                <li><CalendarDays size={18} /> {formatDate(e.date)}</li>
                <li><Clock size={18} /> {e.time}</li>
                <li><MapPin size={18} /> {e.venue}</li>
                {e.partner && <li><Handshake size={18} /> {e.partner}</li>}
              </ul>
              <Btn href="/contact">Volunteer / Enquire</Btn>
            </div>
            <div className="sidebar-card sidebar-dark">
              <h3>Fund a project like this</h3>
              <p>Sponsors receive the project report, photographs and a mention with the district.</p>
              <Btn href="/sponsorship" kind="light">Become a Sponsor</Btn>
            </div>
            <div className="sidebar-card">
              <h3>More events</h3>
              {others.map((o, i) => (
                <Link href={`/events/${o.slug}`} className="sidebar-blog" key={o.slug}>
                  <Photo src={eventImage(o)} alt={o.title} label={initials(o.title)} tone={i + 2} />
                  <span>{o.title}<small>{formatDate(o.date)}</small></span>
                </Link>
              ))}
            </div>
          </aside>
        </div>
      </Section>
    </>
  );
}

/* ======================= Members ======================= */

export function Members() {
  return (
    <>
      <PageHero eyebrow="Members" title="The people behind every project" desc={`${uniqueMemberCount} Rotaractors hold the club's portfolios this year. Where one person holds several, their roles are listed together.`} />
      <Section>
        <Intro center label="Core team" title="Club office bearers" />
        <div className="team-grid team-grid-5">{coreMembers.map((m, i) => <MemberCard m={m} i={i} key={m.name} />)}</div>
      </Section>
      <Section gray>
        <Intro center label="Board of directors" title="Avenue directors and officers" />
        <div className="team-grid">{boardOfDirectors.map((m, i) => <MemberCard m={m} i={i + 1} key={m.name} />)}</div>
      </Section>
      <Section>
        <Intro center label="Chairpersons" title="Chairs and additional portfolios" />
        <div className="team-grid">{chairpersons.map((m, i) => <MemberCard m={m} i={i + 2} key={m.name + m.roles[0]} />)}</div>
      </Section>
      <Section gray>
        <Intro center label="In their words" title="What members and partners say" />
        <div className="reviews-grid reviews-grid-2">{testimonials.map((r, i) => <ReviewCard r={r} i={i} key={r.name} />)}</div>
      </Section>
      <CommunityCTA />
    </>
  );
}

/* ======================= District & Rotary ======================= */

export function District() {
  return (
    <>
      <PageHero eyebrow="Our district" title={district.name} desc={district.intro}>
        <div className="btn-row center hero-btns"><Btn href={district.website} kind="dark">Visit District Website</Btn></div>
      </PageHero>
      <Section>
        <div className="impact-four">{district.stats.map((s) => <div key={s.label}><strong>{s.value}</strong><span>{s.label}</span></div>)}</div>
      </Section>
      <Section gray>
        <Intro center label="About the district" title="Where Khopoli fits in" />
        <div className="values-grid">{district.facts.map((f, i) => <div className={`value-card value-${i}`} key={f.label}><h3>{f.label}</h3><p>{f.value}</p></div>)}</div>
      </Section>
      <CommunityCTA />
    </>
  );
}

export function RotaryInfo() {
  return (
    <>
      <PageHero eyebrow="Rotary International" title="People of action, since 1905" desc={rotary.intro}>
        <div className="btn-row center hero-btns"><Btn href={rotary.website} kind="dark">Visit Rotary.org</Btn></div>
      </PageHero>
      <Section>
        <div className="impact-four impact-three">{rotary.stats.map((s) => <div key={s.label}><strong>{s.value}</strong><span>{s.label}</span></div>)}</div>
      </Section>
      <Section gray>
        <div className="values-grid">
          {[['Vision', rotary.vision], ['Who we are', rotary.founded], ['Mission', rotary.mission]].map(([t, d], i) => (
            <div className={`value-card value-${i}`} key={t}><h3>{t}</h3><p>{d}</p></div>
          ))}
        </div>
      </Section>
      <Section>
        <Intro center label="Areas of focus" title="Seven causes Rotary works on worldwide" />
        <div className="focus-list">{rotary.areasOfFocus.map((a, i) => <span key={a} className={`focus-chip tone-${i % 3}`}><Check size={16} /> {a}</span>)}</div>
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
      {faqGroups.map((g, i) => (
        <Section key={g.title} gray={i % 2 === 1}>
          <div className="faq-layout">
            <div className="faq-title"><Intro label={`Part ${i + 1}`} title={g.title} /></div>
            <FaqList items={g.items} />
          </div>
        </Section>
      ))}
      <CommunityCTA />
    </>
  );
}

/* ======================= Join ======================= */

export function Join() {
  return (
    <>
      <PageHero eyebrow="Join the club" title="Join a club that finishes what it starts" desc="Membership is open to young adults living, studying or working in and around Khopoli. There is no campus requirement." />
      <Section>
        <Intro center label="What we expect" title="Three commitments, nothing hidden" />
        <div className="values-grid">
          {joinCommitments.map((c, i) => <div className={`value-card value-${i}`} key={c.title}><span className="value-num">0{i + 1}</span><h3>{c.title}</h3><p>{c.body}</p></div>)}
        </div>
      </Section>
      <Section gray>
        <div className="donation-layout">
          <div className="donation-lead">
            <Eyebrow>How it works</Eyebrow>
            <h2>Apply, meet us twice, get inducted</h2>
            <ol className="steps">
              <li><b>Send the application.</b> It goes straight to the club&apos;s inbox.</li>
              <li><b>A short conversation.</b> The secretary gets in touch to talk about what you want to work on.</li>
              <li><b>Attend two meetings.</b> See how the club plans and runs projects before you commit.</li>
              <li><b>Induction.</b> Pick your avenue and join a project team.</li>
            </ol>
            <p>Plan for four to six hours a month. A nominal annual subscription covers district and Rotary International dues.</p>
          </div>
          <MailForm
            title="Tell us about yourself"
            intro="Submitting opens your email app with your application addressed to the club."
            subject="Membership application"
            submitLabel="Submit Application"
            fields={[
              { name: 'name', label: 'Full name', required: true, placeholder: 'Your full name' },
              { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'you@example.com' },
              { name: 'phone', label: 'Phone', type: 'tel', required: true, placeholder: '10-digit mobile number', pattern: '[0-9]{10}', title: 'Enter a 10-digit phone number' },
              { name: 'occupation', label: 'Occupation or college', placeholder: 'Student, engineer, business…' },
              { name: 'avenue', label: 'Preferred avenue', options: avenues.map((a) => a.name), required: true },
              { name: 'why', label: 'Why do you want to join?', rows: 5, required: true, minLength: 20, placeholder: 'What you want to work on in Khopoli, and what you can bring to it.' },
            ]}
          />
        </div>
      </Section>
      <FaqBlock items={faqGroups[1].items} />
    </>
  );
}

/* ======================= Sponsorship ======================= */

export function Sponsorship() {
  return (
    <>
      <PageHero eyebrow="Sponsorship" title="Fund service you can actually audit" desc="Sponsorship pays for materials, transport and venues. Every rupee is accounted for in the project report, and we will send it to you whether or not you ask." />
      <Section>
        <Intro center label="Tiers" title="Three ways to partner" description="Amounts are set per project rather than fixed, because a plantation drive and a skills workshop cost very different things." />
        <div className="tier-grid">
          {sponsorTiers.map((t, i) => (
            <div className={`tier-card ${i === 1 ? 'tier-featured' : ''}`} key={t.name}>
              <small>{t.scope}</small>
              <h3>{t.name}</h3>
              <ul>{t.perks.map((p) => <li key={p}><Check size={17} /> {p}</li>)}</ul>
              <Btn href="#enquiry" kind={i === 1 ? 'coral' : 'outline'}>Enquire</Btn>
            </div>
          ))}
        </div>
      </Section>
      <Section gray>
        <Intro center label="In kind" title="Not everything has to be money" />
        <div className="values-grid">
          <div className="value-card value-0"><h3>Materials & venues</h3><p>Venues, printing, transport, refreshments, saplings, stationery and equipment are all welcome, and acknowledged exactly like funding.</p></div>
          <div className="value-card value-1"><h3>Your expertise</h3><p>Professionals who can run a session in finance, design, trades, medicine or law are some of our most valuable partners.</p></div>
          <div className="value-card value-2"><h3>Start small</h3><p>Local businesses often start with one project and stay for the year. That is fine with us.</p></div>
        </div>
      </Section>
      <Section id="enquiry">
        <div className="contact-grid">
          <div className="contact-details">
            <Intro label="Enquiry" title="Tell us how you would like to help" description="Prefer to speak first? Call or write to the president directly." />
            <ContactMethods />
          </div>
          <MailForm
            title="Partnership enquiry"
            subject="Sponsorship enquiry"
            submitLabel="Send Enquiry"
            fields={[
              { name: 'name', label: 'Full name', required: true, placeholder: 'Your full name' },
              { name: 'organisation', label: 'Organisation', required: true, placeholder: 'Business or organisation' },
              { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'you@company.com' },
              { name: 'phone', label: 'Phone', type: 'tel', required: true, placeholder: '10-digit mobile number', pattern: '[0-9]{10}', title: 'Enter a 10-digit phone number' },
              { name: 'tier', label: 'Interested in', options: [...sponsorTiers.map((t) => t.name), 'In-kind support', 'Not sure yet'] },
              { name: 'budget', label: 'Indicative budget', placeholder: 'e.g. ₹10,000' },
              { name: 'message', label: 'How would you like to collaborate?', rows: 5, required: true, minLength: 15, placeholder: 'Tell us about your preferred project, support, or idea.' },
            ]}
          />
        </div>
      </Section>
    </>
  );
}

/* ======================= Contact ======================= */

function ContactMethods() {
  const president = officers[0];
  return (
    <>
      <div className="contact-method"><span><Mail /></span><div><b>Email</b><p><a href={`mailto:${clubEmail}`}>{clubEmail}</a></p></div></div>
      <div className="contact-method"><span><Phone /></span><div><b>{president.role} · {president.name}</b><p><a href={`tel:+91${president.phone}`}>+91 {president.phone}</a></p></div></div>
      <div className="contact-method"><span><MapPin /></span><div><b>Based in</b><p>{club.town}</p></div></div>
    </>
  );
}

export function Contact() {
  return (
    <>
      <PageHero eyebrow="Contact" title="Talk to the club directly" desc="No ticketing system, no form queue you never hear back from. These are the board's own contacts." />
      <Section>
        <div className="contact-grid">
          <div className="contact-details">
            <Intro label="Board contacts" title="Reach the people who run it" />
            <ContactMethods />
            <div className="officer-list">
              {officers.map((o) => <div key={o.role}><small>{o.role}</small><b>{o.name}</b></div>)}
            </div>
          </div>
          <MailForm
            title="Send a message"
            intro="This opens your email app with the message addressed to the club."
            subject="Website enquiry"
            fields={[
              { name: 'name', label: 'Your name', required: true, placeholder: 'Full name' },
              { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'you@example.com' },
              { name: 'message', label: 'Message', rows: 5, required: true, minLength: 10, placeholder: 'What would you like to discuss?' },
            ]}
          />
        </div>
      </Section>
      <FaqBlock />
    </>
  );
}

export function NotFound() {
  return (
    <section className="error-page">
      <div className="container">
        <div className="error-code">404</div>
        <h1>This page took a different avenue</h1>
        <p>The page you are looking for does not exist or has moved.</p>
        <div className="btn-row center"><Btn href="/">Back to Home</Btn><Btn href="/events" kind="outline">See Events</Btn></div>
      </div>
    </section>
  );
}


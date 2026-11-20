/**
 * Single source of truth for the Rotaract Club of Khopoli website.
 * Content carried over from the club's original site (rotaractkhopoli repo, src/data/*).
 */

export const club = {
  name: 'Rotaract Club of Khopoli',
  shortName: 'Rotaract Khopoli',
  type: 'Community Based Club',
  clubId: '21869318',
  charteredOn: 'November 2020',
  district: 'Rotaract District 3131',
  sponsor: 'Rotary International',
  town: 'Khopoli, Maharashtra, India',
  tagline: 'Service above self, written in the voice of a small town with big plans.',
  intro:
    'Rotaract Club of Khopoli is a community based club chartered in November 2020. We are young professionals and students from Khopoli and around who meet, plan and then actually show up, for schools, for the environment, for local livelihoods and for each other.',
};

export const officers = [
  { role: 'President', name: 'Rtr. Vageesh Baheti', email: 'rtrvageeshb@gmail.com', phone: '9075518009' },
  { role: 'Secretary', name: 'Rtr. Srushti Sathe', email: '', phone: '' },
];

/**
 * Public contact settings. TODO(club): create a shared club inbox (e.g. a club Gmail) and put it in `email`
 * so forms stop going to a personal address.
 */
export const contact = {
  email: '', // club inbox, e.g. 'rotaractkhopoli@gmail.com'
  showPresidentPhone: true, // only shown on the Contact page, never in the header/footer
  meetingPlace: 'Rotary Bhavan, Khopoli, Maharashtra',
  mapUrl: 'https://www.google.com/maps/search/?api=1&query=Rotary+Bhavan+Khopoli',
  /** Fill these in to show social icons in the footer and contact page. */
  social: { instagram: '', facebook: '', linkedin: '', youtube: '' },
};

/** Where website forms are sent: the club inbox, else the secretary, else the president. */
export const clubEmail = contact.email || officers[1].email || officers[0].email;

/** Optional form backend (Formspree, Getform, etc.). When set, forms POST here instead of opening the email app. */
export const FORM_ENDPOINT = process.env.NEXT_PUBLIC_FORM_ENDPOINT || '';

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://rotaractkhopoli.org').replace(/\/$/, '');

/** The Rotaract year shown on the Members page. */
export const rotaractYear = '2026–27';

export const clubFacts = [
  { label: 'Club name', value: club.name },
  { label: 'Club type', value: club.type },
  { label: 'Club ID', value: club.clubId },
  { label: 'Chartered', value: club.charteredOn },
  { label: 'Based in', value: club.town },
  { label: 'District', value: club.district },
  { label: 'Parent organisation', value: club.sponsor },
];

export const NAV = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/events', label: 'Events' },
  { href: '/members', label: 'Members' },
  { href: '/contact', label: 'Contact' },
];

export const ALL_PAGES = [
  ['Home', '/'],
  ['About the club', '/about'],
  ['Avenues', '/avenues'],
  ['Events', '/events'],
  ['Gallery', '/gallery'],
  ['Members', '/members'],
  ['District 3131', '/district-3131'],
  ['Rotary information', '/rotary-information'],
  ['FAQs', '/faqs'],
  ['Join the club', '/join'],
  ['Sponsorship', '/sponsorship'],
  ['Board application', '/bod-application'],
  ['Contact', '/contact'],
  ['Privacy policy', '/privacy-policy'],
];

export const avenues = [
  { slug: 'community-service', eventAvenues: ['Community Service'], leadRoles: ['Community Service Director'], name: 'Community Service', focus: 'Khopoli first', icon: 'HandHeart',
    description: 'Local drives, school support, health camps and clean-ups planned with the people who live with the results.' },
  { slug: 'professional-development', eventAvenues: ['Professional Development'], leadRoles: ['Professional Development Director'], name: 'Professional Development', focus: 'Skills that pay', icon: 'GraduationCap',
    description: 'Workshops, mock interviews and sessions with working professionals so members leave the club more employable than they joined.' },
  { slug: 'club-service', eventAvenues: ['Club Service'], leadRoles: ['Club Service Director'], name: 'Club Service', focus: 'The club itself', icon: 'Users',
    description: 'Fellowships, inductions, member retention and the unglamorous administration that keeps a young club standing.' },
  { slug: 'international-service', eventAvenues: ['International Service'], leadRoles: ['International Service Director'], name: 'International Service', focus: 'Beyond the district', icon: 'Globe2',
    description: 'Joint projects, twin-club exchanges and global Rotaract campaigns adapted to what Khopoli can genuinely deliver.' },
  { slug: 'public-relations', eventAvenues: ['Public Relations'], leadRoles: ['Club Public Relations Officer', 'Club Editor'], name: 'Public Relations', focus: 'Telling it straight', icon: 'Megaphone',
    description: 'Documenting every project honestly so partners, sponsors and future members know exactly what the club does.' },
  { slug: 'dei', eventAvenues: ['Diversity, Equity & Inclusion'], leadRoles: ['Diversity, Equity & Inclusion Director'], name: 'Diversity, Equity & Inclusion', focus: 'Everyone at the table', icon: 'HeartHandshake',
    description: 'Sessions, audits and project teams that make sure the club is open to every background in and around Khopoli, not just the usual circle.' },
  { slug: 'public-image', eventAvenues: ['Public Image'], leadRoles: ['Public Image Director'], name: 'Public Image', focus: 'How the club is seen', icon: 'Sparkles',
    description: "Consistent branding, project storytelling and press outreach so the club's work is recognised across the district and the town." },
];

/**
 * Club project and event log.
 * Optional per-event fields (shown on the event page when present):
 *   outcomes: [{ value: '120', label: 'Saplings planted' }, ...]
 *   report:   'A paragraph on what happened, what went well and what did not.'
 *   gallery:  ['/images/events/tree-plantation-2.jpg', ...]
 * TODO(club): add outcomes for completed projects (the FAQ promises beneficiary numbers and spend). Dates, times and venues are indicative and confirmed by the secretary.
 * Photos live in public/images/events/<slug>.jpg — a coloured placeholder shows until the file is added.
 */
export const events = [
  { slug: 'maha-aarti', date: '2026-06-14', time: '6:30 PM - 9:00 PM', title: 'Maha Aarti',
    venue: 'Shree Ram Mandir, Khopoli', avenue: 'Community Service', partner: 'Rotary Club of Khopoli',
    summary: 'A community evening of aarti and prasad distribution, organised with local volunteers and temple trustees.' },
  { slug: 'paintscape', date: '2026-07-01', time: '11:00 AM onwards', title: 'Paintscape',
    venue: 'Shaniwarwada Premises, Khopoli', avenue: 'Club Service',
    summary: 'A creative painting experience designed to bring members together through colour, imagination and shared expression.' },
  { slug: 'joint-meeting', date: '2026-07-26', time: '7:00 PM - 8:30 PM', title: 'Joint Meeting with RAC Saanjh Delhi',
    venue: 'Online · Zoom', avenue: 'International Service', partner: 'Rotaract Club Saanjh, Delhi',
    summary: 'An inter-club joint meeting with Rotaract Club Saanjh Delhi to exchange project ideas and plan a collaborative initiative.' },
  { slug: 'gau-seva', date: '2026-08-09', time: '8:00 AM - 12:00 PM', title: 'Gau Seva',
    venue: 'Gaushala, Vavoshi Road, Khopoli', avenue: 'Community Service',
    summary: 'Members spend a morning at the local gaushala with feed contribution, shed cleaning and a small fodder fund handover.' },
  { slug: 'zoo-day', date: '2026-08-23', time: '9:30 AM - 3:00 PM', title: 'Zoo Day with RAC Bicholim',
    venue: 'Bondla Wildlife Sanctuary, Goa', avenue: 'International Service', partner: 'Rotaract Club of Bicholim',
    summary: 'A fellowship and conservation-awareness day out hosted jointly with Rotaract Club of Bicholim.' },
  { slug: 'dei-session', date: '2026-09-06', time: '5:00 PM - 7:00 PM', title: 'DEI Session',
    venue: 'Rotary Bhavan, Khopoli', avenue: 'Diversity, Equity & Inclusion',
    summary: 'An interactive session on diversity, equity and inclusion in clubs and workplaces, with a facilitated discussion round.' },
  { slug: 'tree-plantation', date: '2026-09-20', time: '7:30 AM - 11:00 AM', title: 'Tree Plantation',
    venue: 'Khopoli Municipal Ground & Hill Slope', avenue: 'Community Service', partner: 'Khopoli Municipal Council',
    summary: 'Plantation of native saplings with a six-month watering roster assigned to member pairs for survival tracking.' },
  { slug: 'pd-session', date: '2026-10-11', time: '6:00 PM - 8:00 PM', title: 'PD Session: Creative PPT Making & Canva Hacks',
    venue: 'Online · Google Meet', avenue: 'Professional Development',
    summary: 'A hands-on workshop on presentation design, storytelling slides and practical Canva shortcuts for club reporting.' },
];

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
export function formatDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}
export function isPast(event, now = Date.now()) {
  return new Date(`${event.endDate ?? event.date}T23:59:59+05:30`).getTime() < now;
}
export const eventsNewestFirst = [...events].sort((a, b) => b.date.localeCompare(a.date));

/* ---------------- Members ---------------- */

export const coreMembers = [
  { name: 'Rtr. Vageesh Baheti', roles: ['President'], bio: "Leads the club's service year, chairs board meetings and owns every commitment the club makes publicly." },
  { name: 'Rtr. Srushti Sathe', roles: ['Secretary'], bio: 'Keeps minutes, correspondence, membership records and the club calendar in order.' },
  { name: 'Rtr. Mihir Butala', roles: ['President Elect'], bio: "Prepares to lead the club's next service year, deputises at meetings and shepherds cross-avenue projects." },
  { name: 'Rtr. Anvay Narwekar', roles: ['Treasurer'], bio: 'Maintains club accounts, dues, project budgets and the annual statement placed before the general body.' },
  { name: 'Rtr. Rohan Puri', roles: ['Club Mentor'], photo: 'rohan', bio: 'Guides the board through planning, protocol and district expectations.' },
];

export const boardOfDirectors = [
  { name: 'Rtr. Vageesh Baheti', roles: ['Club Service Director (CSD)', 'International Service Director (ISD)'] },
  { name: 'Rtr. Piyush Phatak', roles: ['Club Service Director (CSD)'] },
  { name: 'Rtr. Shreya Salunkhe', roles: ['Community Service Director (CMD)', 'Sergeant-at-Arms (SAA)'] },
  { name: 'Rtr. Khadija Bearingwala', photo: 'khadija-bearingwala', roles: ['Professional Development Director (PDD)', 'Diversity, Equity & Inclusion Director (DEID)'] },
  { name: 'Rtr. Gargi Gaikwad', photo: 'gargi-gaikwad', roles: ['International Service Director (ISD)'] },
  { name: 'Rtr. Mihir Butala', roles: ['Public Image Director (PID)', 'World Rotaract Week Chair (WRWC)'] },
  { name: 'Rtr. Aniket Sardar', roles: ['Immediate Past President (IPP)', 'Rotaract-Rotary Relations Officer (RRRO)'] },
  { name: 'Rtr. Harsh', roles: ['Club Editor'] },
  { name: 'Rtr. Sarvesh', photo: 'sarvesh', roles: ['Club Public Relations Officer (PRO)'] },
  { name: 'Rtr. Jayesh Dalvi', photo: 'jayesh-dalvi', roles: ['Club Advisor'] },
];

export const chairpersons = [
  { name: 'Rtr. Gaurav', photo: 'gaurav', roles: ['Membership Development Director'] },
  { name: 'Rtr. Harsh', roles: ['Sports Chair'] },
  { name: 'Rtr. Rutika Zavar', roles: ['Financial Chair'] },
  { name: 'Rtr. Gargi Gaikwad', photo: 'gargi-gaikwad', roles: ['Creative Head'] },
  { name: 'Rtr. Khadija Bearingwala', photo: 'khadija-bearingwala', roles: ['Creative Head'] },
  { name: 'Rtr. Vageesh Baheti', roles: ['Social Media Chair'] },
  { name: 'Rtr. Rohan Puri', photo: 'rohan', roles: ['Professional Assistance Officer (PAO)'] },
];

export const uniqueMemberCount = new Set(
  [...coreMembers, ...boardOfDirectors, ...chairpersons].map((m) => m.name),
).size;

export function initials(name) {
  return name.replace(/^Rtr\.?\s*/i, '').split(' ').filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');
}

/* ---------------- Testimonials ---------------- */
/**
 * Only real, consented quotes belong here. The testimonials section is hidden while this list is empty.
 * The quotes on the old site were marked illustrative, so they are kept below for reference only.
 * Format: { quote: '...', name: 'Full name', role: 'Role / organisation' }
 */
export const testimonials = [];

export const illustrativeTestimonialsDoNotPublish = [
  { quote: 'I joined for the certificate and stayed for the work. Within a year I had run a plantation drive, handled a budget and spoken in front of 200 people.',
    name: 'Rtr. Mihir Butala', role: 'President Elect' },
  { quote: 'They asked what our school actually needed instead of arriving with a photo op. The library kits are still in daily use two terms later.',
    name: 'Mrs. S. Kadam', role: 'Headmistress, ZP School, Vavoshi' },
  { quote: 'A young club that documents its projects properly is rare. Khopoli reports every activity on time and the numbers hold up.',
    name: 'Rtn. P. Deshpande', role: 'Sponsor Rotarian, District 3131' },
  { quote: 'The career workshop was the first time anyone sat with me on a resume. I got my first interview call three weeks later.',
    name: 'Omkar B.', role: 'Beneficiary, Career Compass workshop' },
];

/* ---------------- FAQs ---------------- */
export const faqGroups = [
  { title: 'About the club', items: [
    { q: 'What is Rotaract Club of Khopoli?', a: 'We are a community based Rotaract club chartered in November 2020, club ID 21869318, operating in Khopoli, Raigad district, under Rotaract District 3131 and the guidance of Rotary International.' },
    { q: "What does 'community based' mean?", a: 'Unlike institute based clubs that draw members from a single college, a community based club is open to any eligible young person in the town: students, working professionals, entrepreneurs and family business members alike.' },
    { q: 'Where and how often does the club meet?', a: 'The club meets twice a month in Khopoli, usually on a weekend evening, with additional project meetings called by the concerned avenue director. Meeting notices are circulated by the secretary.' },
    { q: 'Who leads the club?', a: 'A core team of President, President Elect, Secretary and Treasurer, guided by a Club Mentor and the Immediate Past President, and supported by a Board of Directors who each hold an avenue portfolio. The general body votes on major decisions.' },
  ] },
  { title: 'Membership', items: [
    { q: 'Who can join?', a: 'Anyone 18 and above living, studying or working in or around Khopoli who is willing to commit time to service. Rotaract has no upper age limit.' },
    { q: 'How do I apply?', a: 'Fill in the membership form on the Join page. The secretary will get in touch for a short conversation, after which you are invited to attend two meetings before induction.' },
    { q: 'Are there membership fees?', a: 'Yes. A nominal annual subscription covers district and Rotary International dues plus club administration. Project costs are raised separately through sponsorship and fundraising. Current rates are shared during the application conversation.' },
    { q: 'How much time does membership take?', a: 'Plan for roughly four to six hours a month: two meetings plus one project. Board members and avenue directors take on more during their project cycle.' },
    { q: 'Can I apply for a board position?', a: 'Members who have completed one full year and maintained attendance can apply through the Board Application page ahead of the election cycle.' },
  ] },
  { title: 'Events and projects', items: [
    { q: 'Can non-members attend club events?', a: 'Most community projects, health camps, clean-ups and workshops are open to volunteers and beneficiaries. Business meetings and inductions are for members and invited guests.' },
    { q: 'How can my organisation partner with the club?', a: 'Write to the secretary or use the Sponsorship page. We work with schools, hospitals, municipal bodies, NGOs and local businesses on both funded and in-kind partnerships.' },
    { q: 'Do you publish project reports?', a: 'Yes. Every completed project is documented with dates, venue, beneficiary numbers and expenditure, and the archive is published on the Events page.' },
  ] },
  { title: 'Rotaract and Rotary', items: [
    { q: 'What is Rotaract?', a: "Rotaract is Rotary International's movement of young leaders who take action in their communities through service, professional development and fellowship, organised into clubs, districts and a global network." },
    { q: 'What is Rotaract District 3131?', a: 'District 3131 covers the Pune and Raigad revenue districts of Maharashtra, with over 100 clubs and 2,700+ Rotaractors. It was formed at the start of Rotary year 2008-09 following the bifurcation of RID 3130.' },
    { q: 'How is Rotaract connected to Rotary?', a: 'Every Rotaract club is sponsored by a Rotary club and works under Rotary International, which was founded in 1905 and today connects over 1.2 million members across 200+ countries and geographical areas.' },
  ] },
];
export const allFaqs = faqGroups.flatMap((g) => g.items);

/* ---------------- District & Rotary ---------------- */
export const district = {
  name: 'Rotaract District 3131',
  website: 'https://www.rotaractdistrict3131.org/',
  intro: 'Our district brings together the Rotaract clubs of the Pune and Raigad regions. It works hand in hand with Rotary International District 3131 to help young leaders take on bigger projects than any one club could manage alone.',
  facts: [
    { label: 'Formation and scope', value: 'Formed in 2008-09 when the old District 3130 was split in two. It covers the Pune and Raigad revenue districts of Maharashtra.' },
    { label: 'Membership and reach', value: 'More than 100 clubs and over 2,700 Rotaractors, from college students to young professionals.' },
    { label: 'Leadership, fellowship and service', value: 'Clubs organise their work into avenues such as community, professional, club and international service. Rotaract is open from 18 upwards, with no upper age limit.' },
  ],
  stats: [
    { value: '100+', label: 'Rotaract clubs' },
    { value: '2,700+', label: 'Rotaractors' },
    { value: '2008-09', label: 'District formed' },
    { value: '2', label: 'Revenue districts covered' },
  ],
};

export const rotary = {
  name: 'Rotary International',
  website: 'https://www.rotary.org/who-we-are',
  intro: 'Rotary is a worldwide network of people who volunteer their time and skills to improve their communities. Every Rotaract club, including ours, is part of it.',
  vision: 'People uniting worldwide to create lasting change in their communities and in themselves.',
  founded: 'Rotary started in Chicago in 1905. More than a century later it connects professionals of every background who meet, plan and act on local and global problems.',
  mission: 'Serve others, promote integrity, and build understanding, goodwill and peace through a fellowship of business, professional and community leaders.',
  stats: [
    { value: '1.2M', label: 'Rotary and Rotaract members' },
    { value: '200+', label: 'Countries and geographical areas' },
    { value: '1905', label: 'Year Rotary was founded' },
  ],
  areasOfFocus: [
    'Peacebuilding and conflict prevention',
    'Disease prevention and treatment',
    'Water, sanitation and hygiene',
    'Maternal and child health',
    'Basic education and literacy',
    'Community economic development',
    'Environment',
  ],
};

/* ---------------- Sponsorship ---------------- */
export const sponsorTiers = [
  { name: 'Project partner', scope: 'One project', perks: ['Logo on project creatives and banners', 'Mention in the project report shared with the district', 'Photographs from the project for your own use'] },
  { name: 'Avenue partner', scope: 'One avenue for the year', perks: ['Everything in project partner, across every project in that avenue', 'Named association with the avenue in club communication', "Invitation to the club's annual report meeting"] },
  { name: 'Annual partner', scope: 'Full Rotaract year', perks: ["Presence across the club's full calendar", 'Logo placement on this website and club stationery', 'A written year-end impact summary for your records'] },
];

export const joinCommitments = [
  { title: 'Show up', body: "Attend the club's twice-monthly meetings and at least one project per quarter. Attendance is the only membership test that matters." },
  { title: 'Own something', body: 'Every member picks an avenue and leads or co-leads at least one project during the year.' },
  { title: 'Report honestly', body: 'Projects are documented with real numbers: beneficiaries, spend, what went wrong. No inflated posts.' },
];

/** People holding a role on the board or as chair whose role mentions one of the given keywords. */
export function membersWithRoles(keywords) {
  const seen = new Map();
  for (const m of [...coreMembers, ...boardOfDirectors, ...chairpersons]) {
    const roles = m.roles.filter((r) => keywords.some((k) => r.startsWith(k)));
    if (roles.length) seen.set(m.name, { ...m, roles: [...(seen.get(m.name)?.roles ?? []), ...roles] });
  }
  return [...seen.values()];
}

export function eventsForAvenue(avenue) {
  return eventsNewestFirst.filter((e) => avenue.eventAvenues.includes(e.avenue));
}

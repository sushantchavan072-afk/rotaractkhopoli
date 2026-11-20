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

/** District 3131 family logos (Rotaract, Rotary, Interact) in public/images/logos. */
export const FAMILY_LOGOS = [
  { src: '/images/logos/rotaract-district-3131.png', alt: 'Rotaract District 3131', w: 790, h: 277, href: '/district-3131' },
  { src: '/images/logos/rotary-district-3131.png', alt: 'Rotary District 3131', w: 741, h: 286, href: '/rotary-information' },
  { src: '/images/logos/interact-district-3131.png', alt: 'Interact District 3131', w: 753, h: 277, href: null },
];

export const NAV = [
  { href: '/events', label: 'Events' },
  { href: '/blog', label: 'Blog' },
];

export const ALL_PAGES = [
  ['Home', '/'],
  ['About Us', '/about'],
  ['Our Team', '/teams'],
  ['Avenues', '/avenues'],
  ['Events', '/events'],
  ['Event Details', '/events/tree-plantation'],
  ['Blog', '/blog'],
  ['Blog Details', '/blog/our-story-since-2020'],
  ['Gallery', '/gallery'],
  ['Reviews', '/reviews'],
  ['Sponsorship', '/sponsorship'],
  ['Join the Club', '/join'],
  ['Board Application', '/bod-application'],
  ['District 3131', '/district-3131'],
  ['Rotary Information', '/rotary-information'],
  ['FAQs', '/faqs'],
  ['Contact Us', '/contact'],
  ['Privacy Policy', '/privacy-policy'],
  ['Terms & Conditions', '/terms-and-conditions'],
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
/**
 * Leaders for the current Rotary year (RIY 2026-27). Messages are reproduced as provided by the club.
 * photo: file in public/images/leaders/ · themeLogo: file in public/images/themes/
 */
export const riPresident = {
  name: 'Olayinka Hakeem Babalola',
  role: 'President, Rotary International',
  short: 'RI President',
  year: 'RIY 2026-27',
  theme: 'Create Lasting Impact',
  themeLabel: 'Presidential theme',
  themeLogo: { src: '/images/themes/create-lasting-impact.png', w: 409, h: 409, alt: 'Create Lasting Impact, Rotary theme 2026-27' },
  photo: '/images/leaders/ri-president.webp',
  highlight: 'When we work alongside communities, invest in people\u2019s skills and leadership abilities, and measure our progress, we ensure that positive changes can continue in our communities and in ourselves long after a single project ends.',
  greeting: 'My dear friends,',
  message: [
    'As members of Rotary, we are all united across cultures, languages, and communities. Together, we share a responsibility not only to bring about change but also to ensure that the effects endure.',
    'When we focus our efforts and work together, we can maximize our impact in the year ahead.',
    'That is why this year, we are called to Create Lasting Impact.',
    'Our ability to Create Lasting Impact depends on the strength and diversity of our members. The goal in front of us is clear: Reach 1.25 million Rotarians and retain at least 125,000 Rotaractors by 2030.',
    'But this is not only about numbers. It is about people.',
    'Every new member brings new ideas, energy, and opportunities. When we truly welcome others and share our stories, we expand Rotary\u2019s reach and deepen valuable connections.',
    'Don\u2019t be afraid to share how Rotary has changed your life when you connect with prospective members. Everyone loves a good story.',
    'I also encourage you to consider how your club invites, includes, and engages with others.',
    'Examine your last seven years of membership and retention data, find your best year, and aim to do better than your best. Explore the membership resources linked below and think about how you can use them to attract more people to Rotary.',
    'Our promise to the world remains unchanged: We will eradicate polio.',
    'Through your dedication and advocacy, Rotary continues to support one of the most ambitious public health efforts in history. Since 2021, we\u2019ve had a 17% increase in individual contributions to PolioPlus, a clear sign that our members and friends of Rotary remain deeply invested in the fight against polio.',
    'Now is the time to remain focused and committed to this endeavor.',
    'Lasting peace is not created in a single moment. It comes over time, through understanding, collaboration, and trust. Each act of service has the potential to contribute to a more peaceful world, but we need to be deliberate and strategic to achieve it. I encourage you to seek opportunities to collaborate, listen, and lead with empathy. When we work together with purpose and direction, we create stronger communities and enduring peace.',
    'My friends, Rotary has the power to transform lives, including our own. As you plan your projects, welcome new members, and serve your community, I ask you to thoughtfully consider the impact you are making and how it will last.',
    'Together, we can Create Lasting Impact that endures across the globe, in our communities, and in ourselves.',
    'Thank you for all that you do, and for all that we will accomplish together.',
  ],
  signoff: ['Yours in Rotary,', 'Yinka H. Babalola', '2026-27 President', 'Rotary International'],
};

export const districtGovernor = {
  name: 'Rtn. Nitin Dhamale',
  role: 'District Governor, Rotary International District 3131',
  short: 'District Governor',
  year: 'RIY 2026-27',
  theme: 'Maximum Projects, Maximum Beneficiaries, Maximum Impact',
  themeLabel: 'District Governor\u2019s vision',
  themeLogo: { src: '/images/themes/create-lasting-impact.png', w: 409, h: 409, alt: 'Create Lasting Impact, Rotary theme 2026-27' },
  photo: '/images/leaders/district-governor.webp',
  greeting: 'Dear Rotaractors, Greetings!',
  message: [
    'It is a privilege to address the energetic and inspiring members of Rotaract District 3131. You are the young leaders, innovators, and changemakers who are shaping a better future through selfless service.',
    'As we begin Rotary Year 2026\u201327 under the Rotary International theme \u201cCreate Lasting Impact,\u201d I encourage each one of you to serve with passion, lead with integrity, and inspire others through your actions.',
    'This year, let us focus on growing our Rotaract family by adding new members while retaining our existing members, because a strong organization is built on both growth and continuity. I also urge every Rotaract Club to work closely with its sponsoring Rotary Club and actively participate in Global Grant projects. Together, we can implement larger, sustainable service initiatives that create a lasting difference in our communities.',
    'Let us strengthen Rotary\u2013Rotaract collaboration, undertake meaningful service projects, and remember that true success is measured not by the number of activities we conduct, but by the lives we touch and the impact we create. My vision for District 3131 is \u201cMaximum Projects, Maximum Beneficiaries, Maximum Impact,\u201d and I am confident that our Rotaractors will play a vital role in achieving this vision.',
    'Together, let us lead with purpose, serve with compassion, and continue to Create Lasting Impact.',
    'I wish every Rotaractor and every Rotaract Club a successful, rewarding, and impactful Rotary Year 2026\u201327.',
  ],
  signoff: ['With warm regards,', 'Yours in Rotary,', 'Rtn. Nitin Dhamale', 'District Governor 2026-27', 'Rotary International District 3131'],
};

export const drr = {
  name: 'Dr. Karishma Awari',
  role: 'District Rotaract Representative (DRR), Rotaract District 3131',
  short: 'DRR',
  year: 'RIY 2026-27',
  theme: 'REIGN',
  themeSub: 'Rotaract Empowering Individuals for Growth and Networking',
  themeLabel: 'District theme',
  themeLogo: { src: '/images/themes/reign.png', w: 651, h: 267, alt: 'REIGN, Rotaract Empowering Individuals for Growth and Networking, DRR Dr. Karishma Awari, RIY 2026-27, RID 3131' },
  photo: '/images/leaders/drr.webp',
  greeting: 'Dear Rotaractors of District 3131,',
  message: [
    'It gives me immense pleasure to welcome you to Rotary International Year 2026\u201327 under our district theme REIGN.',
    'This year is about unlocking the potential within every Rotaractor: nurturing leadership, strengthening professional skills, deepening our commitment to community service, and building networks that endure beyond the Rotary year.',
    'REIGN calls us to empower one another in our clubs, across our zones, and throughout Pune and Raigad. When individuals grow, clubs grow. When clubs grow, our district creates impact that is measurable, inclusive, and lasting.',
    'I invite every club president, secretary, and member to carry REIGN into your meetings, projects, fellowships, and reporting. Let us lead with purpose, serve with compassion, and network with integrity.',
    'Together, let us make RIY 2026\u201327 a year of empowered leaders, stronger communities, and proud Rotaract across RID 3131.',
  ],
  signoff: ['Dr. Karishma Awari', 'DRR, RID 3131 \u00b7 RIY 2026\u201327'],
};

export const district = {
  name: 'Rotaract District 3131',
  website: 'https://www.rotaractdistrict3131.org/',
  intro: 'Rotaract District 3131 brings together the Rotaract clubs of the Pune and Raigad regions of Maharashtra. Working hand in hand with Rotary International District 3131, it helps young leaders take on bigger projects than any one club could manage alone.',
  about: [
    'Rotary groups its clubs into districts so that clubs in the same region can learn from each other, run joint projects and share resources. District 3131 was formed in the Rotary year 2008-09, when the old District 3130 was divided in two, and today it covers the Pune and Raigad revenue districts of Maharashtra.',
    'The district is home to more than 100 Rotaract clubs and over 2,700 Rotaractors. Some clubs are based in colleges and universities, while others, like Rotaract Club of Khopoli, are community based and open to young people from every background in their town.',
    'Each year the district is led by a District Rotaract Representative (DRR), supported by a district council of Rotaractors who look after training, projects, public image and club support. The DRR works closely with the Rotary District Governor and the district Rotaract committee.',
  ],
  facts: [
    { label: 'Formation and scope', value: 'Formed in 2008-09 when the old District 3130 was split in two. It covers the Pune and Raigad revenue districts of Maharashtra.' },
    { label: 'Membership and reach', value: 'More than 100 clubs and over 2,700 Rotaractors, from college students to young professionals.' },
    { label: 'Leadership, fellowship and service', value: 'Clubs organise their work into avenues such as community, professional, club and international service. Rotaract is open from 18 upwards, with no upper age limit.' },
  ],
  roles: [
    { title: 'Training new leaders', body: 'District trainings and assemblies prepare each incoming club president, secretary and board before their Rotaract year begins.' },
    { title: 'District-wide projects', body: 'Clubs join forces on service projects and campaigns that reach far more people than a single club could.' },
    { title: 'Fellowship and events', body: 'Conferences, sports meets and inter-club meetings help Rotaractors across Pune and Raigad meet and work together.' },
    { title: 'Support and reporting', body: 'The district council supports clubs through the year and gathers their project reports for Rotary International.' },
  ],
  stats: [
    { value: '100+', label: 'Rotaract clubs in the district' },
    { value: '2,700+', label: 'Rotaractors across Pune and Raigad' },
    { value: '2008-09', label: 'Rotary year the district was formed' },
    { value: '2', label: 'Revenue districts covered' },
  ],
};

export const rotary = {
  name: 'Rotary International',
  website: 'https://www.rotary.org/who-we-are',
  founded: '23 February 1905',
  intro: 'Rotary is a worldwide network of neighbours, friends and professionals who volunteer their time and skills to improve their communities. Every Rotaract club, including ours, is part of the Rotary family.',
  history: [
    'Rotary began on 23 February 1905 in Chicago, USA, when attorney Paul Harris met three friends, Gustavus Loehr, Silvester Schiele and Hiram Shorey, to form a club where professionals from different fields could exchange ideas and build lasting friendships. The name "Rotary" came from their early habit of rotating meetings between members\' offices.',
    'The idea spread quickly. Clubs opened across the United States and then around the world, and the organisation became Rotary International. Today Rotary members work together on local projects in their own towns and on global causes such as the long fight to end polio.',
    'Rotary also runs programmes for young people. Interact, for students aged 12 to 18, started in 1962, and Rotaract, for young adults, started in 1968. In 2019 Rotary International made Rotaract a type of membership in its own right and removed the upper age limit.',
  ],
  vision: 'Together, we see a world where people unite and take action to create lasting change across the globe, in our communities, and in ourselves.',
  mission: 'We provide service to others, promote integrity, and advance world understanding, goodwill and peace through our fellowship of business, professional and community leaders.',
  stats: [
    { value: '1905', label: 'Year Rotary was founded, in Chicago' },
    { value: '1.2M+', label: 'Rotary members worldwide' },
    { value: '46,000+', label: 'Rotary clubs' },
    { value: '200+', label: 'Countries and geographical areas' },
  ],
  timeline: [
    { year: '1905', text: 'Paul Harris and three friends hold the first Rotary meeting in Chicago on 23 February.' },
    { year: '1917', text: 'An endowment is created that grows into The Rotary Foundation, which funds Rotary projects worldwide.' },
    { year: '1932', text: 'Rotarian Herbert J. Taylor writes The Four-Way Test, Rotary\'s simple code of ethics.' },
    { year: '1962', text: 'The first Interact club is formed, giving school students a way to serve.' },
    { year: '1968', text: 'The first Rotaract club is chartered, opening Rotary to young adults.' },
    { year: '1985', text: 'Rotary launches PolioPlus, its commitment to immunise every child against polio.' },
    { year: '2019', text: 'Rotaract becomes a type of Rotary International membership, with no upper age limit.' },
  ],
  fourWayTest: ['Is it the TRUTH?', 'Is it FAIR to all concerned?', 'Will it build GOODWILL and BETTER FRIENDSHIPS?', 'Will it be BENEFICIAL to all concerned?'],
  areasOfFocus: [
    { name: 'Peacebuilding and conflict prevention', body: 'Training leaders and communities to prevent conflict and build peace.' },
    { name: 'Disease prevention and treatment', body: 'Improving access to healthcare and fighting diseases such as polio.' },
    { name: 'Water, sanitation and hygiene', body: 'Bringing clean water, toilets and hygiene education to communities.' },
    { name: 'Maternal and child health', body: 'Helping mothers and young children get the care they need.' },
    { name: 'Basic education and literacy', body: 'Supporting schools, teachers and adult learning so everyone can read and write.' },
    { name: 'Community economic development', body: 'Creating opportunities for people to earn a living and grow local economies.' },
    { name: 'Environment', body: 'Protecting and restoring the natural world that communities depend on.' },
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


/* ---------------- Kindora-style section content (club facts only) ---------------- */

export const values = [
  { icon: 'HeartHandshake', title: 'Service above self', body: 'Projects are planned with the people they are meant for, not around a photo opportunity.' },
  { icon: 'ShieldCheck', title: 'Accountability', body: 'Every project has one owner and a report on what actually happened, including what went wrong.' },
  { icon: 'Users', title: 'Fellowship', body: 'Students, young professionals and business owners from Khopoli working at the same table.' },
];

export const volunteerReasons = [
  { icon: 'HandHeart', title: 'Make a tangible impact', body: 'Turn up for a plantation drive, a gaushala morning or a school visit and see the result the same day.' },
  { icon: 'GraduationCap', title: 'Gain new skills', body: 'Plan budgets, lead teams and speak in public through real projects and PD sessions.' },
  { icon: 'Users', title: 'Find your people', body: 'Fellowship with young people across Khopoli, District 3131 and partner clubs in India.' },
];

export const waysToHelp = [
  { icon: 'UserPlus', title: 'Join the club', body: 'Become a Rotaractor. Open to anyone 18+ in and around Khopoli.', cta: 'Apply Now', href: '/join' },
  { icon: 'HandHeart', title: 'Volunteer at a project', body: 'Most community projects are open to volunteers. Come for one drive.', cta: 'Volunteer', href: '/contact?about=Volunteering' },
  { icon: 'Handshake', title: 'Sponsor a project', body: 'Fund a project or a whole avenue, with a report on every rupee.', cta: 'Sponsor', href: '/sponsorship' },
  { icon: 'Lightbulb', title: 'Share your expertise', body: 'Professionals can run a skills session for members and beneficiaries.', cta: 'Offer a Session', href: '/contact?about=Running%20a%20session' },
  { icon: 'Package', title: 'Give in kind', body: 'Venues, printing, transport, saplings or stationery help as much as funds.', cta: 'Support', href: '/sponsorship#enquiry' },
  { icon: 'Megaphone', title: 'Spread the word', body: 'Share our projects and help more young people in Khopoli find the club.', cta: 'See Events', href: '/events' },
];

/**
 * Club blog. Posts are written only from the club's own facts on this site.
 * Body blocks: { p }, { h2 }, { quote }, { list: [...] }.
 */
export const posts = [
  {
    slug: 'our-story-since-2020', title: 'Our story: a Rotaract club built during a difficult year', date: '2026-11-18',
    tags: ['Club', 'History'], image: '/images/gallery/1.jpg',
    excerpt: 'How Rotaract Club of Khopoli started in November 2020, and the habits that start left behind.',
    body: [
      { p: 'Rotaract Club of Khopoli received its charter in November 2020, when public gatherings were restricted and most service work had moved to phone calls and spreadsheets. The first projects were practical: getting essentials to families and helping students who had lost access to classes.' },
      { h2: 'Habits that stayed' },
      { p: 'That start left a habit behind. The club plans on paper before it posts anything, gives every project a single owner, and reports what actually happened rather than what was intended.' },
      { quote: 'Service above self, written in the voice of a small town with big plans.' },
      { p: 'As a community based club, our members are not tied to one campus. Students, early-career professionals and local business owners sit at the same table, which is why the club can take on projects bigger than its size.' },
    ],
  },
  {
    slug: 'seven-avenues-of-service', title: 'The seven avenues of service, explained', date: '2026-11-12',
    tags: ['Avenues'], image: '/images/gallery/3.jpg',
    excerpt: 'Community, professional, club and international service, plus PR, DEI and public image: what each avenue means for Khopoli.',
    body: [
      { p: 'Every Rotaractor in Khopoli picks an avenue, and every project belongs to one. Here is what the seven avenues cover in our club.' },
      { list: ['Community Service: local drives, school support, health camps and clean-ups.', 'Professional Development: workshops, mock interviews and sessions with working professionals.', 'Club Service: fellowships, inductions and the administration that keeps the club running.', 'International Service: joint projects and exchanges with clubs beyond the district.', 'Public Relations: documenting every project honestly.', 'Diversity, Equity & Inclusion: making sure the club is open to every background.', 'Public Image: consistent branding and storytelling about the club\'s work.'] },
      { h2: 'Pick one, own one' },
      { p: 'Members lead or co-lead at least one project in their avenue each year. That is how the club grows leaders, not just volunteers.' },
    ],
  },
  {
    slug: 'a-year-of-projects', title: 'A year of projects: from Maha Aarti to Canva hacks', date: '2026-10-20',
    tags: ['Projects'], image: '/images/events/tree-plantation.jpg',
    excerpt: 'Eight projects across community service, international service, DEI and professional development.',
    body: [
      { p: 'This Rotaract year the club ran eight projects. Each one had an owner, a venue and, where relevant, a partner organisation.' },
      { list: ['Maha Aarti at Shree Ram Mandir with the Rotary Club of Khopoli.', 'Paintscape, a creative evening for members.', 'A joint meeting with Rotaract Club Saanjh, Delhi.', 'Gau Seva at the gaushala on Vavoshi Road.', 'Zoo Day with Rotaract Club of Bicholim.', 'A DEI session at Rotary Bhavan.', 'Tree Plantation with Khopoli Municipal Council.', 'A PD session on presentation design and Canva.'] },
      { h2: 'What comes next' },
      { p: 'The calendar for the new Rotaract year is being finalised with the board. Every completed project will be documented on the Events page.' },
    ],
  },
  {
    slug: 'how-to-join-rotaract-khopoli', title: 'How to join Rotaract Club of Khopoli', date: '2026-10-05',
    tags: ['Membership'], image: '/images/gallery/4.jpg',
    excerpt: 'Who can join, what membership involves, and the four steps from application to induction.',
    body: [
      { p: 'Membership is open to anyone 18 and above living, studying or working in and around Khopoli. There is no campus requirement and no upper age limit.' },
      { h2: 'Four steps' },
      { list: ['Send the application from the Join page.', 'Have a short conversation with the secretary.', 'Attend two meetings to see how the club works.', 'Get inducted, pick your avenue and join a project team.'] },
      { p: 'Plan for four to six hours a month: two meetings and one project. A nominal annual subscription covers district and Rotary International dues.' },
    ],
  },
  {
    slug: 'what-is-district-3131', title: 'What is Rotaract District 3131?', date: '2026-09-22',
    tags: ['District'], image: '/images/events/dei-session.jpg',
    excerpt: 'The district our club belongs to: 100+ clubs and 2,700+ Rotaractors across Pune and Raigad.',
    body: [
      { p: 'Rotaract District 3131 brings together the Rotaract clubs of the Pune and Raigad revenue districts of Maharashtra. It was formed in 2008-09 when the old District 3130 was split in two.' },
      { p: 'Today it has more than 100 clubs and over 2,700 Rotaractors, from college students to young professionals. Our club takes part in district projects, trainings and fellowships alongside them.' },
      { quote: 'Bigger projects than any one club could manage alone.' },
    ],
  },
  {
    slug: 'rotary-rotaract-interact', title: 'Rotary, Rotaract and Interact: one family', date: '2026-09-08',
    tags: ['Rotary'], image: '/images/events/joint-meeting.jpg',
    excerpt: 'How the three programmes fit together, and where Rotaract Club of Khopoli sits.',
    body: [
      { p: 'Rotary is a worldwide network of service clubs for working professionals, founded in 1905. Rotaract is its programme for young adults, and Interact is its school-age wing.' },
      { p: 'Every Rotaract club is sponsored by a Rotary club. Clubs govern themselves, plan their own projects and report through their district: for us, District 3131.' },
      { h2: 'Why it matters' },
      { p: 'Being part of the Rotary family connects a small club in Khopoli to more than 1.2 million members across 200+ countries and geographical areas.' },
    ],
  },
];
export const postsNewestFirst = [...posts].sort((a, b) => b.date.localeCompare(a.date));
export const PAGE_SIZE = 6;

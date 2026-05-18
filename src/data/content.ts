/**
 * TY.STELLAR — single source of truth for all portfolio content.
 * Sourced from Ty_CV (2).pdf. Fiction-flavored copy stays fact-complete:
 * every joke sits next to real, complete CV content (PRODUCT.md principle 3).
 */

export interface ProjectContent {
  id: string
  name: string
  tagline: string
  tech: string[]
  bullets: string[]
  award?: string
}

export interface SectionContent {
  id: string
  /** Nav + HUD label */
  label: string
  /** Panel window title */
  title: string
  accentVar: string
  heading: string
  intro: string
}

export const profile = {
  name: 'James Gabriel Elijah Ty',
  handle: 'JTY',
  heroLine: 'CS undergrad rendering worlds — in XR, on the cloud, across maps.',
  bootByline: 'BS Computer Science · University of the Philippines Cebu · Class of 2027',
  location: 'Cebu City, Philippines',
  email: 'jamesty016@gmail.com',
  phone: '(+63) 934 996 3293',
  github: 'https://github.com/JP-TY',
  linkedin: 'https://www.linkedin.com/in/james-gabriel-elijah-ty-6a7b0a334/',
  about: [
    'I build things that render: XR training worlds on the web, credit-scoring systems on the cloud, and geospatial engines that help city planners see their streets differently.',
    'Currently a BS Computer Science student at UP Cebu (class of 2027), research/developer intern at ISCOLab, and a GitHub Campus Expert — one of the 1%. I like my software like I like my starships: fast, resilient, and a little bit fun.',
    'This site is a solar system because a résumé is flat, and I refuse. Fly around. Land somewhere. Every planet is real work — the ASCII is just the gravity.',
  ],
  education: {
    school: 'University of the Philippines Cebu',
    degree: 'BS Computer Science',
    expected: 'Expected July 2027',
    extra:
      'UTokyo Virtual Exchange Program — CALL (Apr–Jul 2026): evaluated the VR language-learning app NounTown through SLA theories and proposed a custom CALL framework integrating Generative AI, VR, and second-language acquisition.',
  },
}

export const sections: SectionContent[] = [
  {
    id: 'about',
    label: 'ABOUT',
    title: 'STELLAR-CARTOGRAPHY.LOG',
    accentVar: '--green',
    heading: 'The Pilot',
    intro: 'Sun of this system. Everything else orbits from here.',
  },
  {
    id: 'projects',
    label: 'PROJECTS',
    title: 'PROJECTS.LOG',
    accentVar: '--cyan',
    heading: 'Planetary Works',
    intro: 'Five moons in orbit. Each one shipped, each one judged. Open a moon for its dossier.',
  },
  {
    id: 'experience',
    label: 'EXPERIENCE',
    title: 'MISSION-LOGS.LOG',
    accentVar: '--violet',
    heading: 'Mission Logs',
    intro: 'Internships and command postings. Log entries, most recent first.',
  },
  {
    id: 'achievements',
    label: 'ACHIEVEMENTS',
    title: 'HIGH-SCORES.DAT',
    accentVar: '--amber',
    heading: 'High Scores',
    intro: 'Insert coin to admire. All runs verified on real hardware.',
  },
  {
    id: 'skills',
    label: 'SKILLS',
    title: 'CARGO-MANIFEST.LOG',
    accentVar: '--magenta',
    heading: 'Cargo Manifest',
    intro: 'What this ship is stocked with. All systems operational.',
  },
  {
    id: 'contact',
    label: 'CONTACT',
    title: 'TRANSMISSION.LOG',
    accentVar: '--orange',
    heading: 'Open a Channel',
    intro: 'This relay is always listening. Response time: one Earth rotation or less.',
  },
]

export const projects: ProjectContent[] = [
  {
    id: 'creditpass',
    name: 'CreditPass',
    tagline: 'AI-driven capacity profiling & containerized credit scoring system',
    tech: ['FastAPI', 'Next.js', 'TensorFlow', 'Docker', 'Huawei Cloud', 'Redis'],
    bullets: [
      'Engineered an end-to-end, privacy-preserving credit capacity profiling engine using alternative data structures like telco and e-wallet telemetry.',
      'Architected resilient cloud infrastructure on Huawei Cloud — ELB and Cloud CDN routing to containerized microservices on Cloud Container Engine (CCE).',
      'Designed an automated MLOps retraining pipeline monitoring model drift via Cloud Eye, orchestrating continuous retraining through ModelArts.',
    ],
    award: 'Huawei Developer Competition 2025 — 2nd Runner Up · APRU Tech Policy Hackathon 2025 — Honorable Mention',
  },
  {
    id: 'sabot',
    name: 'Sabot',
    tagline: 'Blockchain escrow & decentralized transaction verification platform',
    tech: ['Next.js', 'TypeScript', 'Solidity', 'Hardhat', 'Lisk Sepolia', 'Supabase', 'OpenZeppelin'],
    bullets: [
      'Built a composable peer-to-peer transaction safety layer with immutable agreement lifecycles and automated multi-deliverable escrow.',
      'Co-authored and deployed Solidity smart contracts managing token economics (SBT), automated fee splits, and decentralized dispute resolution.',
      'Implemented an oracle-based cryptographic verification system validating file-based and service-oriented deliverables on-chain.',
    ],
    award: 'Lisk Builders Challenge Round 3 — Honorable Mention',
  },
  {
    id: 'lakbai',
    name: 'LakbAI',
    tagline: 'Dynamic pedestrian accessibility & geospatial decision-support platform',
    tech: ['Next.js', 'TypeScript', 'Django', 'Zustand', 'Leaflet', 'AWS', 'Turf.js', 'PyTorch'],
    bullets: [
      'Developed a geospatial dashboard assessing urban pedestrian accessibility across Philippine pilot areas using a dynamic fuzzy-logic inference system.',
      'Integrated real-time weather APIs, flood hazard models, OpenStreetMap data, and manual street audits into a continuous [0, 1] scoring model.',
      'Built an interactive GeoJSON mapping interface with 13-band color interpolation for at-a-glance insights for city planners and policymakers.',
    ],
    award: 'Philippines Junior Data Science Challenge 2024 — Champion',
  },
  {
    id: 'greenpoint',
    name: 'GreenPoint',
    tagline: 'GIS-based urban greening framework',
    tech: ['Next.js', 'Supabase', 'Prisma', 'Mapbox', 'Leaflet', 'Google Earth Engine', 'LangGraph', 'AWS'],
    bullets: [
      'Engineered a GIS and urban-planning platform that identifies, evaluates, and recommends site-specific greening interventions in Mandaue City.',
      'Integrated high-resolution satellite imagery (NDVI, LST) and air-quality data to compute a multi-dimensional Greenery Index spanning quantity, equity, and connectivity.',
      'Built an AI recommendation engine using LangGraph agentic workflows and an urban-forestry RAG system generating strategies like pocket parks and blue-green corridors.',
    ],
    award: 'UP Cebu EXPOdition 30 — Project of the Year',
  },
  {
    id: 'wafers',
    name: 'Wafers, Please!',
    tagline: 'WebVR semiconductor inspection prototype',
    tech: ['Next.js', 'TypeScript', 'A-Frame', 'WebXR'],
    bullets: [
      'Developed an XR-style educational training prototype simulating a beginner semiconductor inspection shift loop.',
      'Implemented deterministic defect generation alongside dual progression gates evaluating operational performance and decision quality.',
    ],
    award: 'Chosen for development as a microcredential for a Taiwanese semiconductor company',
  },
]

export interface MissionLog {
  org: string
  role: string
  period: string
  bullets: string[]
  tags: string[]
}

export const missions: MissionLog[] = [
  {
    org: 'ISCOLab (UP Open University)',
    role: 'Research / Developer Intern',
    period: 'Jan 2026 – Jul 2026',
    bullets: [
      'Implemented Level-of-Detail optimizations for the UPOU metaverse, improving performance by 63%.',
      'Created a WebXR semiconductor inspection training prototype — selected for development as a microcredential for a Taiwanese semiconductor company.',
      'Presented XR demonstrations for Japanese-language learning and instructor training to the Japan Foundation. Well received.',
    ],
    tags: ['C#', 'Unity', 'Blender', 'OpenXR', 'WebXR', 'A-Frame'],
  },
  {
    org: 'GitHub Campus Experts',
    role: 'Campus Expert',
    period: 'Oct 2025 – Present',
    bullets: [
      'Selected through GitHub’s rigorous selection process — 1% acceptance rate.',
      'Formulated a Community Assessment and Inclusion Framework for the UP Cebu tech ecosystem, lowering technical barriers and mitigating the regional digital divide.',
      'Championed inclusive community spaces: structured Code of Conduct, asynchronous learning pathways, accessibility guidelines for regional developer events.',
    ],
    tags: ['Community', 'Advocacy', 'Inclusion Strategy'],
  },
  {
    org: 'AWS Student Builder Group UP Cebu',
    role: 'Lead',
    period: 'Nov 2025 – Present',
    bullets: [
      'Pioneered the campus cloud community launch; established AWS Skill Builder learning pathways guiding peers through Lambda, API Gateway, S3, and RDS projects.',
      'Spearheaded AWS Community Day Cebu 2025 — coordinated 8 regional universities, delivered a conference for 200+ cloud enthusiasts.',
    ],
    tags: ['Cloud', 'Leadership', 'Events'],
  },
  {
    org: 'UP Computer Science Group (UPCSG)',
    role: 'Executive Director',
    period: 'Jun 2025 – Jun 2026',
    bullets: [
      'Elected to govern UP Cebu’s premier computer science organization — end-to-end execution of hackathons, workshops, and flagship academic programming.',
      'Directed UPCSG Hackathon 2025 & 2026: 50 team applications, 15 finalists, 10 schools.',
      'Managed and mentored a cross-functional workforce of 75+ student volunteers.',
    ],
    tags: ['Strategy', 'PM', 'Mentorship'],
  },
  {
    org: 'UP Computer Science Group (UPCSG)',
    role: 'Education & Development Director',
    period: 'Jun 2024 – Jun 2025',
    bullets: [
      'Designed and executed upskilling workshops equipping 50+ students with industry-relevant software engineering concepts.',
      'Restructured a Peer Tutoring Program serving ~50 students — custom lesson plans, mock evaluations, personal tutoring.',
      'Co-Head of “Scratch That!” outreach: accessible CS curricula introducing 60 local high-school students to programming.',
    ],
    tags: ['Curriculum', 'Training', 'Outreach'],
  },
]

export interface Achievement {
  name: string
  result: string
  project?: string
}

export const achievements: Achievement[] = [
  { name: 'Philippines Junior Data Science Challenge 2024', result: 'CHAMPION', project: 'LakbAI' },
  { name: 'Huawei Developer Competition 2025', result: '2ND RUNNER UP', project: 'CreditPass' },
  { name: 'UP Cebu EXPOdition 30', result: 'PROJECT OF THE YEAR', project: 'GreenPoint' },
  { name: 'APRU Tech Policy Hackathon 2025', result: 'HONORABLE MENTION', project: 'CreditPass' },
  { name: 'Lisk Builders Challenge Round 3', result: 'HONORABLE MENTION', project: 'Sabot' },
  { name: '27th Philippine Statistics Quiz 2023', result: 'REGIONAL CHAMPION' },
  { name: 'CESAFI Computer Quiz Bowl', result: 'CHAMPION (HS 2023) · 2ND RU (COLLEGE 2026)' },
  { name: 'UPCSG Inter-High Programming Competition', result: '1ST RUNNER UP' },
]

export const certifications: string[] = [
  'AWS Certified Solutions Architect – Associate',
  'AWS Certified Cloud Practitioner',
  'AWS Certified AI Practitioner',
  'AWS Cloud Support Associate Professional Certificate (Coursera)',
  'AWS Cloud Technology Consultant Professional Certificate (Coursera)',
  'AWS AI Practitioner Challenge',
  'Huawei Cloud Developer Certification – HCCDA AI',
  'Huawei Cloud Developer Certification – HCCDA Tech Essentials',
]

export interface SkillGroup {
  label: string
  items: string[]
}

export const skills: SkillGroup[] = [
  { label: 'LANGUAGES', items: ['C#', 'TypeScript', 'Go', 'Python'] },
  { label: 'FRONTEND / BACKEND', items: ['Next.js', 'Express.js', 'FastAPI', 'Django', 'Fiber', 'React Native', 'A-Frame'] },
  { label: 'DATABASES / ETL', items: ['PostgreSQL', 'MySQL', 'Supabase', 'MongoDB', 'Redis'] },
  { label: 'CLOUD / CI-CD', items: ['AWS', 'GCP', 'Huawei Cloud', 'Jenkins', 'GitHub Actions', 'Terraform', 'Docker'] },
  { label: 'ML / AI', items: ['TensorFlow', 'AWS SageMaker', 'n8n', 'Computer Vision', 'RAG'] },
]

export const bootLines: string[] = [
  'TY-OS v2.6.1 — stellar terminal',
  'BIOS check................. OK',
  'phosphor array............. OK',
  'gravity................. 9.807',
  'ASCII renderer.......... armed',
  'loading cartography......... OK',
  'pilot: JAMES GABRIEL ELIJAH TY',
  '',
  'welcome aboard. click a planet to dock.',
  '',
]



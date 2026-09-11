/**
 * Portfolio content — single source of truth, sourced from Ty_CV (2).pdf.
 * Serious copy only. Game feel lives in layout and motion, never in words.
 */

import badgeSAA from '../assets/badge-saa.webp'
import badgePractitioner from '../assets/badge-practitioner.webp'
import badgeAI from '../assets/badge-ai.webp'
import badgeHCCDA from '../assets/HCCDA.webp'
import badgeCoursera from '../assets/Coursera.webp'
import awardPJDSC from '../assets/award-pjdsc.webp'
import awardHDC from '../assets/award-hdc.webp'
import awardEXPOdition30 from '../assets/award-expodition30.webp'
import awardLisk from '../assets/award-lisk.webp'
import awardPSQ from '../assets/award-psq.webp'
import awardPSQ2 from '../assets/award-psq2.webp'
import awardPSQ3 from '../assets/award-psq3.webp'
import awardCesafi from '../assets/award-cesafi.webp'
import awardInterHigh from '../assets/award-interhigh.webp'
import awardAPRU from '../assets/award-apru.webp'

export interface ProjectEntry {
  id: string
  name: string
  tagline: string
  tech: string[]
  bullets: string[]
  award: string
}

export interface SkillBranch {
  id: string
  label: string
  items: string[]
}

export interface TimelineStop {
  period: string
  org: string
  role: string
  bullets: string[]
  stat: string
}

export const profile = {
  name: 'James Gabriel Elijah Ty',
  role: '3× AWS Certified · GitHub Campus Expert · BS Computer Science, UP Cebu',
  school: 'University of the Philippines Cebu',
  degree: 'BS Computer Science',
  expected: 'July 2027',
  location: 'Cebu City, Philippines',
  email: 'jamesty016@gmail.com',
  github: 'https://github.com/JP-TY',
  linkedin: 'https://www.linkedin.com/in/james-gabriel-elijah-ty-89a157302/',
  about: [
    'James Gabriel Elijah Ty is a Computer Science student at UP Cebu, a 3× AWS Certified developer, Lead of the AWS Student Builder Group – UP Cebu, and the very first GitHub Campus Expert in the Visayas. A former Executive Director of the UP Computer Science Guild, he is an international hackathon winner who placed 2nd Runner-Up at the Huawei Developer Competition 2025 APAC and emerged as Champion at the Philippine Junior Data Science Challenge 2024. As a systems and data science enthusiast, James actively leads technical mentorship initiatives and practical software workshops to bridge the gap between academic theory and industry practice.',
    'Completed a research and developer internship at ISCOLab. Now a GitHub Campus Expert and lead of the AWS Student Builder Group at UP Cebu. I also governed UPCSG, the university premier CS organization, directing hackathons across 10 schools and mentoring 75 volunteers.',
  ],
}

export const projects: ProjectEntry[] = [
  {
    id: 'creditpass',
    name: 'CreditPass',
    tagline: 'AI-driven capacity profiling and containerized credit scoring',
    tech: ['FastAPI', 'Next.js', 'TensorFlow', 'Docker', 'Huawei Cloud', 'Redis'],
    bullets: [
      'Engineered an end-to-end, privacy-preserving credit capacity engine using telco and e-wallet telemetry.',
      'Architected resilient infrastructure on Huawei Cloud: ELB and CDN routing to containerized microservices on CCE.',
      'Designed an MLOps retraining pipeline monitoring drift via Cloud Eye and orchestrating retraining through ModelArts.',
    ],
    award: 'Huawei Developer Competition 2025, 2nd Runner Up · APRU Tech Policy Hackathon 2025, Honorable Mention',
  },
  {
    id: 'sabot',
    name: 'Sabot',
    tagline: 'Transaction safety layer with escrow lifecycles and verification',
    tech: ['Next.js', 'TypeScript', 'Solidity', 'Hardhat', 'Lisk Sepolia', 'Supabase'],
    bullets: [
      'Designed a peer-to-peer transaction safety layer with immutable agreement lifecycles and multi-deliverable escrow state machines.',
      'Architected automated fee splits, dispute resolution workflows, and token-gated access as composable service boundaries.',
      'Implemented oracle-based verification pipelines validating file and service deliverables before fund release.',
    ],
    award: 'Lisk Builders Challenge Round 3, Honorable Mention',
  },
  {
    id: 'lakbai',
    name: 'LakbAI',
    tagline: 'Pedestrian accessibility and geospatial decision support',
    tech: ['Next.js', 'TypeScript', 'Django', 'Leaflet', 'AWS', 'PyTorch'],
    bullets: [
      'Built a geospatial dashboard assessing pedestrian accessibility across Philippine pilot areas with a dynamic fuzzy-logic inference system.',
      'Fused real-time weather, flood hazard models, OpenStreetMap infrastructure data, and manual street audits into a continuous scoring model.',
      'Delivered an interactive GeoJSON mapping interface with 13-band color interpolation for planners and policymakers.',
    ],
    award: 'Philippines Junior Data Science Challenge 2024, Champion',
  },
  {
    id: 'greenpoint',
    name: 'GreenPoint',
    tagline: 'GIS-based urban greening framework',
    tech: ['Next.js', 'Supabase', 'Prisma', 'Mapbox', 'Leaflet', 'LangGraph', 'AWS'],
    bullets: [
      'Engineered a GIS and urban-planning platform identifying and evaluating site-specific greening interventions in Mandaue City.',
      'Integrated satellite imagery (NDVI, LST) and air-quality data into a multi-dimensional Greenery Index spanning quantity, equity, and connectivity.',
      'Built an AI recommendation engine with agentic workflows and an urban-forestry RAG system proposing pocket parks and blue-green corridors.',
    ],
    award: 'UP Cebu EXPOdition 30, Project of the Year',
  },
  {
    id: 'wafers',
    name: 'Wafers, Please!',
    tagline: 'Semiconductor inspection training prototype',
    tech: ['Next.js', 'TypeScript', 'A-Frame', 'WebXR'],
    bullets: [
      'Developed an educational training prototype simulating a beginner semiconductor inspection shift loop.',
      'Implemented deterministic defect generation with dual progression gates evaluating operational performance and decision quality.',
    ],
    award: 'Selected for development as a microcredential for a Taiwanese semiconductor company',
  },
]

export const branches: SkillBranch[] = [
  {
    id: 'cloud',
    label: 'Cloud Infrastructure',
    items: ['AWS', 'Huawei Cloud', 'Docker', 'Terraform', 'GitHub Actions', 'Redis', 'PostgreSQL'],
  },
  {
    id: 'ai',
    label: 'AI and Data',
    items: ['TensorFlow', 'PyTorch', 'SageMaker', 'RAG', 'Computer Vision', 'Supabase'],
  },
  {
    id: 'systems',
    label: 'System Design',
    items: ['Microservices', 'REST APIs', 'Escrow Lifecycles', 'Event-Driven Flows', 'Caching', 'Container Orchestration'],
  },
  {
    id: 'languages',
    label: 'Languages',
    items: ['TypeScript', 'Python', 'Go', 'C#'],
  },
]

export const timeline: TimelineStop[] = [
  {
    period: 'JAN 2026 – JUL 2026',
    org: 'ISCOLab, UP Open University',
    role: 'Research and Developer Intern',
    bullets: [
      'Shipped LOD optimizations improving metaverse performance by 63%.',
      'Built a semiconductor inspection prototype selected for microcredential development.',
    ],
    stat: '+63% PERF',
  },
  {
    period: 'NOV 2025 – PRESENT',
    org: 'AWS Student Builder Group UP Cebu',
    role: 'Lead',
    bullets: [
      'Launched the campus cloud community with Skill Builder pathways across Lambda, API Gateway, S3, and RDS.',
      'Coordinated 8 universities to deliver Community Day Cebu 2025 for 200 cloud enthusiasts.',
    ],
    stat: '200+ ATTENDEES',
  },
  {
    period: 'OCT 2025 – PRESENT',
    org: 'GitHub Campus Experts',
    role: 'Campus Expert',
    bullets: [
      'Selected through a 1% acceptance process.',
      'Authored a community assessment and inclusion framework; set conduct, async pathways, and event accessibility guides.',
    ],
    stat: '1% ACCEPTANCE RATE',
  },
  {
    period: 'JUN 2025 – JUN 2026',
    org: 'UP Computer Science Guild',
    role: 'Executive Director',
    bullets: [
      'Governed flagship programming, hackathons, and workshops end to end.',
      'Directed 2025 and 2026 hackathons: 50 team applications, 15 finalists, 10 schools. Mentored 75 volunteers.',
    ],
    stat: '75 VOLUNTEERS',
  },
  {
    period: 'JUN 2024 – JUN 2025',
    org: 'UP Computer Science Guild',
    role: 'Education and Development Director',
    bullets: [
      'Ran upskilling workshops for 50 students and restructured peer tutoring serving 50 students.',
      'Co-headed Scratch That outreach introducing 60 high-school students to programming.',
    ],
    stat: '50+ TRAINED',
  },
]

export const awards: { name: string; result: string; project?: string }[] = [
  { name: 'Philippines Junior Data Science Challenge 2024', result: 'CHAMPION', project: 'LakbAI' },
  { name: 'Huawei Developer Competition 2025', result: '2ND RUNNER UP', project: 'CreditPass' },
  { name: 'UP Cebu EXPOdition 30', result: 'PROJECT OF THE YEAR', project: 'GreenPoint' },
  { name: 'APRU Tech Policy Hackathon 2025', result: 'HONORABLE MENTION', project: 'CreditPass' },
  { name: 'Lisk Builders Challenge Round 3', result: 'HONORABLE MENTION', project: 'Sabot' },
  { name: '27th Philippine Statistics Quiz 2023', result: 'REGIONAL CHAMPION' },
  { name: 'CESAFI Computer Quiz Bowl', result: 'CHAMPION HS 2023 · 2ND RU COLLEGE 2026' },
  { name: 'UPCSG Inter-High Programming Competition', result: '1ST RUNNER UP' },
]

export const certifications: string[] = [
  'AWS Solutions Architect Associate',
  'AWS Cloud Practitioner',
  'AWS AI Practitioner',
  'AWS Cloud Support Associate, Coursera',
  'AWS Cloud Technology Consultant, Coursera',
  'Huawei Cloud HCCDA AI',
  'Huawei Cloud HCCDA Tech Essentials',
]

/** Trophy photography per award, bundled locally. The PSQ award carries
 *  three photos displayed as a fanned bundle. Awards without a photo
 *  keep the diamond icon tile. */
export const awardPhotos: Record<string, string[]> = {
  'Philippines Junior Data Science Challenge 2024': [awardPJDSC],
  'Huawei Developer Competition 2025': [awardHDC],
  'UP Cebu EXPOdition 30': [awardEXPOdition30],
  'Lisk Builders Challenge Round 3': [awardLisk],
  '27th Philippine Statistics Quiz 2023': [awardPSQ, awardPSQ2, awardPSQ3],
  'CESAFI Computer Quiz Bowl': [awardCesafi],
  'UPCSG Inter-High Programming Competition': [awardInterHigh],
  'APRU Tech Policy Hackathon 2025': [awardAPRU],
}

/** Official badge art, bundled locally. Certifications without
 *  a stable public image keep the numbered-disc socket. */
export const certBadges: Record<string, string> = {
  'AWS Solutions Architect Associate': badgeSAA,
  'AWS Cloud Practitioner': badgePractitioner,
  'AWS AI Practitioner': badgeAI,
  'Huawei Cloud HCCDA AI': badgeHCCDA,
  'Huawei Cloud HCCDA Tech Essentials': badgeHCCDA,
  'AWS Cloud Support Associate, Coursera': badgeCoursera,
  'AWS Cloud Technology Consultant, Coursera': badgeCoursera,
}

export const sections = [
  { id: 'profile', label: 'PROFILE', kicker: '01 / 06', heading: 'Profile', intro: 'Background, education, and focus.' },
  { id: 'projects', label: 'PROJECTS', kicker: '02 / 06', heading: 'Projects', intro: 'Selected work, each with stack, evidence, and recognition.' },
  { id: 'skills', label: 'SKILLS', kicker: '03 / 06', heading: 'Skill grid', intro: 'Select a node to inspect its branch.' },
  { id: 'experience', label: 'EXPERIENCE', kicker: '04 / 06', heading: 'Experience', intro: 'Roles and impact.' },
  { id: 'recognition', label: 'RECOGNITION', kicker: '05 / 06', heading: 'Recognition', intro: 'The trophy room: wins on the shelf, credentials in the case.' },
  { id: 'contact', label: 'CONTACT', kicker: '06 / 06', heading: 'Contact', intro: 'Open to internships and collaboration.' },
]

export const counts = { projects: 5, roles: 4, certs: 7, awards: 8 }

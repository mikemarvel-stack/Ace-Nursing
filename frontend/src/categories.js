// ─── Shared category taxonomy ─────────────────────────────────────────────────
// Replaces old format-based categories (Study Guides, Flashcards, etc.)
// with nursing-curriculum-aligned categories matching Chamberlain University
// and standard nursing program structures.

export const CATEGORIES = [
  // ── Nursing Program Levels ──────────────────────────────────────────────────
  'RN Prep (NCLEX-RN)',
  'LPN/LVN Prep (NCLEX-PN)',
  'BSN Courses',
  'MSN Courses',
  'DNP / Advanced Practice',
  'Continuing Education (CEU)',

  // ── Core Nursing Courses ────────────────────────────────────────────────────
  'Fundamentals of Nursing',
  'Pharmacology',
  'Med-Surg & Pathophysiology',
  'Maternal-Newborn & Pediatrics',
  'Mental Health Nursing',
  'Community & Public Health',
  'Critical Care & ICU',
  'Leadership & Management',

  // ── Specialty / Cross-cutting ───────────────────────────────────────────────
  'Anatomy & Physiology',
  'Nutrition & Diet Therapy',
  'Health Assessment',
  'Nursing Research & EBP',
  'NCLEX Strategy & Test Prep',
];

// URL slug ↔ display name mapping (auto-generated)
export const CATEGORY_SLUGS = Object.fromEntries(
  CATEGORIES.map(c => [c.toLowerCase().replace(/[\s/()&]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''), c])
);

export const slugifyCategory = (cat) =>
  cat.toLowerCase().replace(/[\s/()&]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

export const categoryFromSlug = (slug) => CATEGORY_SLUGS[slug] || null;

// Emoji per category for UI display
export const CATEGORY_EMOJI = {
  'RN Prep (NCLEX-RN)':          '🩺',
  'LPN/LVN Prep (NCLEX-PN)':     '💉',
  'BSN Courses':                  '🎓',
  'MSN Courses':                  '📚',
  'DNP / Advanced Practice':      '🏅',
  'Continuing Education (CEU)':   '🔄',
  'Fundamentals of Nursing':      '📋',
  'Pharmacology':                 '💊',
  'Med-Surg & Pathophysiology':   '🏥',
  'Maternal-Newborn & Pediatrics':'👶',
  'Mental Health Nursing':        '🧠',
  'Community & Public Health':    '🌍',
  'Critical Care & ICU':          '❤️‍🔥',
  'Leadership & Management':      '📊',
  'Anatomy & Physiology':         '🫀',
  'Nutrition & Diet Therapy':     '🥗',
  'Health Assessment':            '🔬',
  'Nursing Research & EBP':       '📖',
  'NCLEX Strategy & Test Prep':   '⚡',
};

// Grouped for nav/footer display
export const CATEGORY_GROUPS = [
  {
    label: 'By Program Level',
    items: [
      'RN Prep (NCLEX-RN)',
      'LPN/LVN Prep (NCLEX-PN)',
      'BSN Courses',
      'MSN Courses',
      'DNP / Advanced Practice',
      'Continuing Education (CEU)',
    ],
  },
  {
    label: 'By Course',
    items: [
      'Fundamentals of Nursing',
      'Pharmacology',
      'Med-Surg & Pathophysiology',
      'Maternal-Newborn & Pediatrics',
      'Mental Health Nursing',
      'Community & Public Health',
      'Critical Care & ICU',
      'Leadership & Management',
    ],
  },
  {
    label: 'Specialty Topics',
    items: [
      'Anatomy & Physiology',
      'Nutrition & Diet Therapy',
      'Health Assessment',
      'Nursing Research & EBP',
      'NCLEX Strategy & Test Prep',
    ],
  },
];

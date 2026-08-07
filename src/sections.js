// Frontend-owned section metadata (icon + accent color).
// Keys must match the backend's CONFIG.SECTIONS keys exactly.
export const SECTIONS = {
  latestjob:   { label: 'Latest Jobs',  icon: '💼', accent: 'maroon' },
  admitcard:   { label: 'Admit Cards',  icon: '🎫', accent: 'navy' },
  result:      { label: 'Results',      icon: '📊', accent: 'gold' },
  online:      { label: 'Online Forms', icon: '📝', accent: 'green' },
  answerkey:   { label: 'Answer Keys',  icon: '🔑', accent: 'saffron' },
  syllabus:    { label: 'Syllabus',     icon: '📚', accent: 'purple' },
  admission:   { label: 'Admissions',   icon: '🎓', accent: 'teal' },
  certificate: { label: 'Certificate',  icon: '📜', accent: 'brown' },
  outsourcing: { label: 'Outsourcing',  icon: '🏢', accent: 'ink' },
  important:   { label: 'Important',    icon: '⚡', accent: 'maroon' },
};

// Homepage shows a preview strip from these sections (in this order).
// Kept small on purpose — each entry is one extra network call.
export const HOMEPAGE_PREVIEW_SECTIONS = ['admitcard', 'result', 'online', 'answerkey'];

export function sectionMeta(key) {
  return SECTIONS[key] || { label: key || 'Update', icon: '📄', accent: 'ink' };
}

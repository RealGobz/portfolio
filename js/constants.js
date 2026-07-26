// Single source of truth for cert section order, ids, and labels.
// Both the public certs page and the admin panel import this so the two
// never drift apart. To reorder or rename a section, edit it here only.

export const CERT_SECTIONS = [
  {
    id: 'agentic',
    label: 'Agentic AI',
    note: 'Certifications specific to building agentic systems and AI agents.'
  },
  {
    id: 'professional',
    label: 'Professional Certifications',
    note: 'CCNA, PCEP, PCAP and similar industry-recognized credentials.'
  },
  {
    id: 'hackathons',
    label: 'Hackathon Certifications',
    note: 'Recognition from hackathons and competitive build events.'
  },
  {
    id: 'ai_ml_dl',
    label: 'AI / ML / DL Certifications',
    note: 'Coursera and other AI, machine learning, and deep learning coursework.'
  },
  {
    id: 'coding',
    label: 'Coding Programs & Languages',
    note: 'سطر (Satr.Code) and other programming language / bootcamp certifications.'
  },
  {
    id: 'other',
    label: 'Other Expertise',
    note: 'Cybersecurity and other general certifications.'
  }
];

export function sectionLabel(id) {
  const found = CERT_SECTIONS.find((s) => s.id === id);
  return found ? found.label : id;
}

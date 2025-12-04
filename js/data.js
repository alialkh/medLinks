// Data management + persistence
import { getDomain } from './utils.js';

const STORAGE_KEY = 'medlinks_sections_v1';

export const defaultSections = [
  {
    title: 'University of Calgary',
    items: [
      { name: 'Fresh Sheet', url: 'https://freshsheet.ucalgary.ca/', color: '#2b6cb0' },
      { name: 'Cards', url: 'https://cards.ucalgary.ca/', color: '#dd6b20' },
      { name: 'Osler', url: 'https://osler.ucalgary.ca/', color: '#2c5282' },
      { name: 'One45', url: 'https://calgary.one45.com/index.php?login_message=107', color: '#805ad5' },
      { name: 'Blackbook', url: 'https://blackbook.ucalgary.ca/', color: '#1a202c' },
      { name: 'Calgary Guide', url: 'https://calgaryguide.ucalgary.ca/', color: '#e53e3e' }
    ]
  },
  {
    title: 'Resources',
    items: [
      { name: 'UpToDate', url: 'https://www.uptodate.com/contents/search', color: '#2f855a' },
      { name: 'OpenEvidence', url: 'https://www.openevidence.com/', color: '#3182ce' },
      { name: 'PubMed', url: 'https://pubmed.ncbi.nlm.nih.gov/', color: '#2b6cb0' },
      { name: 'StatPearls', url: 'https://www.statpearls.com/', color: '#38a169' }
    ]
  },
  {
    title: 'Alis Linkssss',
    items: [
      { name: 'Cardiovasc Society', url: 'https://ccs.ca/awards', color: '#2f855a' },
    ]
  }
];

export function loadSections() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(defaultSections);
    const parsed = JSON.parse(raw);
    // basic validation
    if (!Array.isArray(parsed)) return structuredClone(defaultSections);

    // Merge any new default sections that are missing from storage
    let modified = false;
    defaultSections.forEach(defSec => {
      if (!parsed.find(p => p.title === defSec.title)) {
        parsed.push(structuredClone(defSec));
        modified = true;
      }
    });

    if (modified) {
      saveSections(parsed);
    }

    return parsed;
  } catch (e) {
    return structuredClone(defaultSections);
  }
}

export function saveSections(sections) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sections));
}

export function addSection(sections, title) {
  const s = { title, items: [] };
  sections.push(s);
  saveSections(sections);
  return s;
}

export function removeSection(sections, title) {
  const idx = sections.findIndex(s => s.title === title);
  if (idx >= 0) {
    sections.splice(idx, 1);
    saveSections(sections);
    return true;
  }
  return false;
}

export function addItemToSection(sections, sectionTitle, item) {
  const sec = sections.find(s => s.title === sectionTitle);
  if (sec) {
    sec.items.push(item);
    saveSections(sections);
  }
}

export function removeItemFromSection(sections, sectionTitle, itemName) {
  const sec = sections.find(s => s.title === sectionTitle);
  if (sec) {
    const idx = sec.items.findIndex(i => i.name === itemName);
    if (idx >= 0) {
      sec.items.splice(idx, 1);
      saveSections(sections);
      return true;
    }
  }
  return false;
}

export function reorderSectionItems(sections, sectionTitle, oldIndex, newIndex) {
  const sec = sections.find(s => s.title === sectionTitle);
  if (sec && sec.items[oldIndex]) {
    const [item] = sec.items.splice(oldIndex, 1);
    sec.items.splice(newIndex, 0, item);
    saveSections(sections);
    return true;
  }
  return false;
}

export function reorderSections(sections, oldIndex, newIndex) {
  if (sections[oldIndex]) {
    const [sec] = sections.splice(oldIndex, 1);
    sections.splice(newIndex, 0, sec);
    saveSections(sections);
    return true;
  }
  return false;
}

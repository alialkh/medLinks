import { loadSections, saveSections, addSection, removeSection, addItemToSection, defaultSections } from './data.js';
import { renderSections } from './ui.js';

const container = document.getElementById('app-container');
const themeToggle = document.getElementById('theme-toggle');
const searchInput = document.getElementById('search-input');
const dateElement = document.getElementById('current-date');

const addSectionBtn = (() => {
  // create or reuse add button in header
  let b = document.getElementById('add-section');
  if (!b) {
    b = document.createElement('button');
    b.id = 'add-section';
    b.className = 'icon-btn';
    b.title = 'Add section';
    b.innerText = '+';
    // insert next to theme toggle
    const header = document.querySelector('header');
    header.insertBefore(b, themeToggle.nextSibling);
  }
  return b;
})();

let sections = loadSections();
let collapsedStates = JSON.parse(localStorage.getItem('collapsedStates') || '{}');
let visibleStates = JSON.parse(localStorage.getItem('visibleStates') || '{}');

// expose default/protected section titles so UI can hide remove button for them
window.DEFAULT_SECTIONS = defaultSections.map(s => s.title);

// set current date
const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
if (dateElement) dateElement.textContent = new Date().toLocaleDateString('en-US', options);

function refresh() {
  // only render sections that are visible
  const toRender = sections.filter(s => visibleStates[s.title] !== false);
  renderSections(container, toRender, collapsedStates, () => {});
}

// initial render
refresh();

// search/filter
if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase();
    if (!q) {
      sections = loadSections();
      refresh();
      return;
    }

    const filtered = sections.map(s => {
      const items = s.items.filter(i => (i.name + ' ' + i.url).toLowerCase().includes(q));
      return { title: s.title, items };
    }).filter(s => s.items.length > 0 || s.title.toLowerCase().includes(q));

    renderSections(container, filtered, collapsedStates, () => {});
  });
}

// theme toggle wiring
const savedTheme = localStorage.getItem('theme') || 'dark';
if (savedTheme === 'light') document.body.classList.add('light-theme');

themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('light-theme');
  const current = document.body.classList.contains('light-theme') ? 'light' : 'dark';
  localStorage.setItem('theme', current);
});

// add section button
addSectionBtn.addEventListener('click', (ev) => {
  // show popup menu listing hardcoded default sections that are currently hidden
  const existing = document.getElementById('section-add-menu');
  if (existing) { existing.remove(); return; }

  const menu = document.createElement('div');
  menu.id = 'section-add-menu';
  menu.style.position = 'absolute';
  const rect = addSectionBtn.getBoundingClientRect();
  menu.style.left = (rect.left) + 'px';
  menu.style.top = (rect.bottom + 8) + 'px';
  menu.style.background = getComputedStyle(document.body).getPropertyValue('--card-bg') || '#fff';
  menu.style.border = '1px solid rgba(0,0,0,0.08)';
  menu.style.padding = '8px';
  menu.style.borderRadius = '8px';
  menu.style.boxShadow = '0 6px 18px rgba(0,0,0,0.12)';
  menu.style.zIndex = 9999;

  const hiddenDefaults = defaultSections.filter(ds => visibleStates[ds.title] === false);
  if (hiddenDefaults.length === 0) {
    const note = document.createElement('div');
    note.style.padding = '6px 12px';
    note.style.color = getComputedStyle(document.body).getPropertyValue('--text-secondary') || '#666';
    note.textContent = 'No hidden sections to add';
    menu.appendChild(note);
  } else {
    hiddenDefaults.forEach(ds => {
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.alignItems = 'center';
      row.style.gap = '8px';
      row.style.padding = '6px 10px';
      row.style.cursor = 'pointer';
      row.textContent = ds.title;
      row.addEventListener('click', () => {
        // ensure section exists in sections list
        const exists = sections.find(s => s.title === ds.title);
        if (!exists) {
          sections.push(JSON.parse(JSON.stringify(ds)));
          saveSections(sections);
        }
        visibleStates[ds.title] = true;
        localStorage.setItem('visibleStates', JSON.stringify(visibleStates));
        menu.remove();
        sections = loadSections();
        refresh();
      });
      menu.appendChild(row);
    });
  }

  document.body.appendChild(menu);
  // close on outside click
  const onDocClick = (e) => {
    if (!menu.contains(e.target) && e.target !== addSectionBtn) {
      menu.remove();
      document.removeEventListener('click', onDocClick);
    }
  };
  document.addEventListener('click', onDocClick);
});

// respond to collapse events from ui
window.addEventListener('sectionToggled', (e) => {
  const { title, collapsed } = e.detail;
  collapsedStates[title] = collapsed;
  localStorage.setItem('collapsedStates', JSON.stringify(collapsedStates));
});

// hide section (persist visibility)
window.addEventListener('sectionHidden', (e) => {
  const { title } = e.detail;
  visibleStates[title] = false;
  localStorage.setItem('visibleStates', JSON.stringify(visibleStates));
  // do not delete data, just refresh view
  refresh();
});

// allow removing items via context menu (optional)
window.addEventListener('contextmenu', (ev) => {
  const target = ev.target.closest('.app-card');
  if (!target) return;
  ev.preventDefault();
  const name = target.querySelector('.app-name')?.textContent || '';
  if (confirm(`Remove link '${name}'?`)) {
    // find section that contains it
    let removed = false;
    for (const s of sections) {
      const idx = s.items.findIndex(i => i.name === name);
      if (idx >= 0) {
        s.items.splice(idx, 1);
        removed = true;
        break;
      }
    }
    if (removed) {
      saveSections(sections);
      sections = loadSections();
      refresh();
    }
  }
});

// expose for debug
window.MedLinks = { refresh };

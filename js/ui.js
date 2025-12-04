import { getFaviconUrl, adjustColor, el } from './utils.js';
import { addItemToSection, removeItemFromSection, saveSections } from './data.js';

// Renders the sections and provides UI hooks
export function createCard(app) {
  const card = el('a', { class: 'app-card', href: app.url, target: '_blank', rel: 'noopener noreferrer' });

  const iconDiv = el('div', { class: 'app-icon' });

  const faviconUrl = getFaviconUrl(app.url, 64);
  const img = document.createElement('img');
  img.src = faviconUrl;
  img.alt = app.name + ' favicon';
  img.width = 40;
  img.height = 40;
  img.style.borderRadius = '6px';

  let fallbackAdded = false;
  img.onerror = () => {
    // fallback to gradient + icon/initials
    if (fallbackAdded) return;
    fallbackAdded = true;
    img.remove();
    if (app.icon) {
      const i = document.createElement('i');
      i.className = `ph ${app.icon}`;
      i.style.color = 'white';
      i.style.fontSize = '1.4rem';
      iconDiv.appendChild(i);
    } else {
      const initial = el('div', { class: 'app-initial' }, app.name.slice(0,2).toUpperCase());
      iconDiv.appendChild(initial);
    }
    iconDiv.style.background = `linear-gradient(135deg, ${app.color || '#777'}, ${adjustColor(app.color || '#777', -20)})`;
  };

  img.onload = () => {
    // If image exists, make iconDiv transparent / subtle background
    iconDiv.appendChild(img);
    iconDiv.style.background = 'transparent';
  };

  // Begin by optimistic append of img; onerror will replace
  iconDiv.appendChild(img);
  iconDiv.style.background = `linear-gradient(135deg, ${app.color || '#777'}, ${adjustColor(app.color || '#777', -20)})`;

  const nameSpan = el('span', { class: 'app-name' }, app.name);
  card.appendChild(iconDiv);
  card.appendChild(nameSpan);
  return card;
}

export function renderSections(container, sections, collapsedStates, onRemoveSection) {
  container.innerHTML = '';
  sections.forEach(section => {
    const secEl = el('div', { class: 'section-container' });
    if (collapsedStates[section.title]) secEl.classList.add('collapsed');

    // header (title + icons)
    const header = el('div', { class: 'section-header' });
    const title = el('h2', { class: 'section-title' }, section.title);
    const rightControls = el('div');

    // remove per-section add button; provide a single X to hide the section from view
    const removeBtn = el('button', { class: 'small-btn warn', title: 'Hide section' }, '\u2716');
    removeBtn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      if (confirm(`Hide section "${section.title}" from view? You can re-add it from the + menu.`)) {
        const e = new CustomEvent('sectionHidden', { detail: { title: section.title } });
        window.dispatchEvent(e);
      }
    });

    rightControls.appendChild(removeBtn);

    header.appendChild(title);
    header.appendChild(rightControls);

    // collapse toggle
    header.addEventListener('click', () => {
      secEl.classList.toggle('collapsed');
      // update localStorage via main
      const event = new CustomEvent('sectionToggled', { detail: { title: section.title, collapsed: secEl.classList.contains('collapsed') } });
      window.dispatchEvent(event);
    });

    secEl.appendChild(header);

    const grid = el('div', { class: 'app-grid' });
    section.items.forEach(app => {
      const c = createCard(app);
      grid.appendChild(c);
    });

    secEl.appendChild(grid);
    container.appendChild(secEl);
  });
}

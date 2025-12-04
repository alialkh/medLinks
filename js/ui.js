import { getFaviconUrl, adjustColor, el } from './utils.js';
import { addItemToSection, removeItemFromSection, saveSections } from './data.js';

// DnD state
let dragSrcEl = null;
let dragSrcSection = null;

// --- Item DnD ---
function handleDragStart(e) {
  e.stopPropagation(); // Prevent bubbling to section
  dragSrcEl = this;
  dragSrcSection = null; // Ensure we are not dragging a section
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', JSON.stringify({
    type: 'item',
    index: this.dataset.index,
    section: this.dataset.section
  }));
  this.classList.add('dragging');
}

function handleDragOver(e) {
  if (!dragSrcEl) return; // Ignore if not dragging an item
  if (e.preventDefault) e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  return false;
}

function handleDragEnter(e) {
  if (!dragSrcEl) return; // Ignore if not dragging an item
  if (dragSrcEl !== this) {
    this.classList.add('drag-over-target');
  }
}

function handleDragLeave(e) {
  if (!dragSrcEl) return;
  // Only remove if we are leaving the element entirely (not entering a child)
  if (this.contains(e.relatedTarget)) return;
  this.classList.remove('drag-over-target');
}

function handleDrop(e) {
  if (!dragSrcEl) return; // Ignore if not dragging an item (let it bubble to section)
  
  if (e.stopPropagation) e.stopPropagation();
  this.classList.remove('drag-over-target');
  
  if (dragSrcEl !== this) {
    try {
        const data = JSON.parse(e.dataTransfer.getData('text/plain'));
        if (data.type !== 'item') return false;

        const oldIndex = parseInt(data.index);
        const sectionTitle = data.section;
        const newIndex = parseInt(this.dataset.index);
        const targetSection = this.dataset.section;

        if (sectionTitle === targetSection) {
            const event = new CustomEvent('itemReordered', {
                detail: { section: sectionTitle, oldIndex, newIndex }
            });
            window.dispatchEvent(event);
        }
    } catch (err) {}
  }
  return false;
}

function handleDragEnd(e) {
  this.classList.remove('dragging');
  document.querySelectorAll('.app-card').forEach(item => {
      item.classList.remove('drag-over-target');
      item.classList.remove('over');
  });
}

// --- Section DnD ---
function handleSectionDragStart(e) {
    // 'this' is the dragHandle
    const section = this.closest('.section-container');
    dragSrcSection = section;
    dragSrcEl = null; // Ensure we are not dragging an item
    
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify({
        type: 'section',
        title: section.dataset.title
    }));
    
    // Set drag image to the section element
    if (e.dataTransfer.setDragImage) {
        e.dataTransfer.setDragImage(section, 10, 10);
    }
    
    section.classList.add('dragging');
}

function handleSectionDragOver(e) {
    if (e.preventDefault) e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleSectionDragEnter(e) {
    if (dragSrcSection !== this) {
        this.classList.add('drag-over-target');
    }
}

function handleSectionDragLeave(e) {
    if (this.contains(e.relatedTarget)) return;
    this.classList.remove('drag-over-target');
}

function handleSectionDrop(e) {
    if (e.stopPropagation) e.stopPropagation();
    this.classList.remove('drag-over-target');

    if (dragSrcSection !== this) {
        try {
            const data = JSON.parse(e.dataTransfer.getData('text/plain'));
            if (data.type !== 'section') return false;

            const sourceTitle = data.title;
            const targetTitle = this.dataset.title;

            const event = new CustomEvent('sectionReordered', {
                detail: { sourceTitle, targetTitle }
            });
            window.dispatchEvent(event);
        } catch (err) {}
    }
    return false;
}

function handleSectionDragEnd(e) {
    const section = this.closest('.section-container');
    if (section) section.classList.remove('dragging');
    
    document.querySelectorAll('.section-container').forEach(s => {
        s.classList.remove('drag-over-target');
    });
}

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
  sections.forEach((section, index) => {
    const secEl = el('div', { class: 'section-container' });
    if (collapsedStates[section.title]) secEl.classList.add('collapsed');

    // Section DnD
    secEl.dataset.title = section.title;
    secEl.addEventListener('dragenter', handleSectionDragEnter);
    secEl.addEventListener('dragover', handleSectionDragOver);
    secEl.addEventListener('dragleave', handleSectionDragLeave);
    secEl.addEventListener('drop', handleSectionDrop);

    // header (title + icons)
    const header = el('div', { class: 'section-header' });
    
    // Drag Handle
    const dragHandle = el('div', { class: 'section-drag-handle', title: 'Drag to reorder' });
    dragHandle.innerHTML = '<i class="ph ph-dots-six-vertical"></i>';
    dragHandle.draggable = true;
    dragHandle.addEventListener('dragstart', handleSectionDragStart);
    dragHandle.addEventListener('dragend', handleSectionDragEnd);
    
    const title = el('h2', { class: 'section-title' }, section.title);
    
    const leftControls = el('div', { style: 'display:flex; align-items:center;' });
    leftControls.appendChild(dragHandle);
    leftControls.appendChild(title);

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

    header.appendChild(leftControls);
    header.appendChild(rightControls);

    // collapse toggle
    header.addEventListener('click', (e) => {
      // Don't toggle if clicking handle or remove button
      if (e.target.closest('.section-drag-handle') || e.target.closest('button')) return;

      secEl.classList.toggle('collapsed');
      // update localStorage via main
      const event = new CustomEvent('sectionToggled', { detail: { title: section.title, collapsed: secEl.classList.contains('collapsed') } });
      window.dispatchEvent(event);
    });

    secEl.appendChild(header);

    const grid = el('div', { class: 'app-grid' });
    section.items.forEach((app, index) => {
      const c = createCard(app);
      
      // DnD attributes
      c.draggable = true;
      c.dataset.index = index;
      c.dataset.section = section.title;
      
      c.addEventListener('dragstart', handleDragStart);
      c.addEventListener('dragenter', handleDragEnter);
      c.addEventListener('dragover', handleDragOver);
      c.addEventListener('dragleave', handleDragLeave);
      c.addEventListener('drop', handleDrop);
      c.addEventListener('dragend', handleDragEnd);

      grid.appendChild(c);
    });

    secEl.appendChild(grid);
    container.appendChild(secEl);
  });
}

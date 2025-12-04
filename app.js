(function () {
  // utils
  function getDomain(url) {
    try {
      const u = new URL(url);
      return u.hostname;
    } catch (e) {
      return url;
    }
  }


  function getFaviconUrl(url, size = 64) {
    const domain = getDomain(url);
    // DuckDuckGo’s favicon service returns official icons and supports CORS.
    if (domain) {
      return 'https://icons.duckduckgo.com/ip3/' + domain + '.ico';
    }
    return '';
  }

  function adjustColor(hex, amount) {
    try {
      let col = hex.replace('#', '');
      if (col.length === 3) col = col.split('').map(c => c + c).join('');
      const num = parseInt(col, 16);
      let r = (num >> 16) + amount;
      let g = ((num >> 8) & 0x00FF) + amount;
      let b = (num & 0x0000FF) + amount;
      r = Math.max(0, Math.min(255, r));
      g = Math.max(0, Math.min(255, g));
      b = Math.max(0, Math.min(255, b));
      return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    } catch (e) {
      return hex;
    }
  }

  function el(tag, props, ...children) {
    const node = document.createElement(tag);
    props = props || {};
    Object.keys(props).forEach(k => {
      if (k === 'class') node.className = props[k];
      else if (k === 'html') node.innerHTML = props[k];
      else node.setAttribute(k, props[k]);
    });
    children.flat().forEach(c => {
      if (typeof c === 'string') node.appendChild(document.createTextNode(c));
      else if (c instanceof Node) node.appendChild(c);
    });
    return node;
  }

  // data
  var STORAGE_KEY = 'medlinks_sections_v1';
  var defaultSections = [
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
    }
  ];

  function loadSections() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return JSON.parse(JSON.stringify(defaultSections));
      var parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return JSON.parse(JSON.stringify(defaultSections));
      return parsed;
    } catch (e) {
      return JSON.parse(JSON.stringify(defaultSections));
    }
  }

  function saveSections(sections) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sections));
  }

  function addSection(sections, title) {
    var s = { title: title, items: [] };
    sections.push(s);
    saveSections(sections);
    return s;
  }

  function removeSection(sections, title) {
    var idx = sections.findIndex(function (s) { return s.title === title; });
    if (idx >= 0) {
      sections.splice(idx, 1);
      saveSections(sections);
      return true;
    }
    return false;
  }

  function addItemToSection(sections, sectionTitle, item) {
    var sec = sections.find(function (s) { return s.title === sectionTitle; });
    if (sec) {
      sec.items.push(item);
      saveSections(sections);
    }
  }

  function removeItemFromSection(sections, sectionTitle, itemName) {
    var sec = sections.find(function (s) { return s.title === sectionTitle; });
    if (sec) {
      var idx = sec.items.findIndex(function (i) { return i.name === itemName; });
      if (idx >= 0) {
        sec.items.splice(idx, 1);
        saveSections(sections);
        return true;
      }
    }
    return false;
  }

  // UI
  function createCard(app) {
    var card = el('a', { class: 'app-card', href: app.url, target: '_blank', rel: 'noopener noreferrer' });
    var iconDiv = el('div', { class: 'app-icon' });

    // helper: generate deterministic color from a string
    function hslToHex(h, s, l) {
      s /= 100; l /= 100;
      const k = n => (n + h / 30) % 12;
      const a = s * Math.min(l, 1 - l);
      const f = n => {
        const val = l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
        return Math.round(255 * val).toString(16).padStart(2, '0');
      };
      return `#${f(0)}${f(8)}${f(4)}`;
    }

    function stringToColor(str) {
      var s = (str || '').toString();
      var hash = 0;
      for (var i = 0; i < s.length; i++) {
        hash = s.charCodeAt(i) + ((hash << 5) - hash);
        hash = hash & hash;
      }
      var hue = Math.abs(hash) % 360;
      return hslToHex(hue, 60, 50);
    }

    var faviconUrl = getFaviconUrl(app.url, 64);
    var img = document.createElement('img');
    img.alt = app.name + ' favicon';
    img.width = 40;
    img.height = 40;
    img.style.borderRadius = '6px';

    var fallbackUsed = false;
    var domainForLetter = (function () {
      try {
        var d = getDomain(app.url) || '';
        d = d.replace(/^www\./i, '');
        return (d[0] || app.name[0] || '?').toUpperCase();
      } catch (e) { return (app.name[0] || '?').toUpperCase(); }
    })();

    function applyFallback() {
      if (fallbackUsed) return;
      fallbackUsed = true;
      try { img.remove(); } catch (e) {}
      if (app.icon) {
        var i = document.createElement('i');
        i.className = 'ph ' + app.icon;
        i.style.color = 'white';
        i.style.fontSize = '1.4rem';
        iconDiv.appendChild(i);
      } else {
        var initial = el('div', { class: 'app-initial' }, domainForLetter);
        iconDiv.appendChild(initial);
      }
      var baseColor = app.color || stringToColor(getDomain(app.url) || app.name || 'x');
      iconDiv.style.background = 'linear-gradient(135deg, ' + baseColor + ', ' + adjustColor(baseColor, -18) + ')';
    }

    var faviconTimeout = setTimeout(function () {
      applyFallback();
    }, 1200);

    img.onload = function () {
      clearTimeout(faviconTimeout);
      if (!img.naturalWidth || img.naturalWidth < 8 || !img.complete) {
        applyFallback();
        return;
      }
      var currentSrc = (img.currentSrc || img.src || '').toLowerCase();
      var isFallbackImage = currentSrc.includes('fallback_opts') || currentSrc.includes('faviconv2');
      if (isFallbackImage) {
        applyFallback();
        return;
      }
      iconDiv.appendChild(img);
      iconDiv.style.background = 'transparent';
    };
    img.onerror = function () {
      clearTimeout(faviconTimeout);
      applyFallback();
    };

    try { img.src = faviconUrl; } catch (e) { clearTimeout(faviconTimeout); applyFallback(); }

    // optimistic background while loading
    var bgColor = app.color || stringToColor(getDomain(app.url) || app.name || 'x');
    iconDiv.style.background = 'linear-gradient(135deg, ' + bgColor + ', ' + adjustColor(bgColor, -18) + ')';

    var nameSpan = el('span', { class: 'app-name' }, app.name);
    card.appendChild(iconDiv);
    card.appendChild(nameSpan);
    return card;
  }

  function renderSections(container, sections, collapsedStates, onRemoveSection) {
    container.innerHTML = '';
    sections.forEach(function (section) {
      var secEl = el('div', { class: 'section-container' });
      if (collapsedStates && collapsedStates[section.title]) secEl.classList.add('collapsed');
      var header = el('div', { class: 'section-header' });
      var title = el('h2', { class: 'section-title' }, section.title);
      var rightControls = el('div');

      // provide an X to hide the section from view (can be re-added via + menu)
      var removeBtn = el('button', { class: 'small-btn warn', title: 'Hide section' }, '✖');
      removeBtn.addEventListener('click', function (ev) {
        ev.stopPropagation();
        if (confirm('Hide section "' + section.title + '" from view? You can re-add it from the + menu.')) {
          var e = new CustomEvent('sectionHidden', { detail: { title: section.title } });
          window.dispatchEvent(e);
        }
      });
      rightControls.appendChild(removeBtn);

      header.appendChild(title);
      header.appendChild(rightControls);
      header.addEventListener('click', function () {
        secEl.classList.toggle('collapsed');
        var event = new CustomEvent('sectionToggled', { detail: { title: section.title, collapsed: secEl.classList.contains('collapsed') } });
        window.dispatchEvent(event);
      });
      secEl.appendChild(header);
      var grid = el('div', { class: 'app-grid' });
      section.items.forEach(function (app) {
        var c = createCard(app);
        grid.appendChild(c);
      });
      secEl.appendChild(grid);
      container.appendChild(secEl);
    });
  }

  // main
  var containerEl = document.getElementById('app-container');
  var themeToggle = document.getElementById('theme-toggle');
  var searchInput = document.getElementById('search-input');
  var dateElement = document.getElementById('current-date');

  var addSectionBtn = (function () {
    var b = document.getElementById('add-section');
    if (!b) {
      b = document.createElement('button');
      b.id = 'add-section';
      b.className = 'icon-btn';
      b.title = 'Add section';
      b.innerText = '+';
      var header = document.querySelector('header');
      header.insertBefore(b, themeToggle.nextSibling);
    }
    return b;
  })();

  var sections = loadSections();
  var collapsedStates = JSON.parse(localStorage.getItem('collapsedStates') || '{}');
  var visibleStates = JSON.parse(localStorage.getItem('visibleStates') || '{}');
  window.DEFAULT_SECTIONS = defaultSections.map(function (s) { return s.title; });

  function refresh() {
    // render only visible sections
    var toRender = sections.filter(function (s) { return visibleStates[s.title] !== false; });
    renderSections(containerEl, toRender, collapsedStates, function () {});
  }

  // set date
  var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  if (dateElement) dateElement.textContent = new Date().toLocaleDateString('en-US', options);

  refresh();

  // theme toggle
  var savedTheme = localStorage.getItem('theme') || 'dark';
  if (savedTheme === 'light') document.body.classList.add('light-theme');
  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      document.body.classList.toggle('light-theme');
      var current = document.body.classList.contains('light-theme') ? 'light' : 'dark';
      localStorage.setItem('theme', current);
    });
  }

  // add section
  if (addSectionBtn) {
    addSectionBtn.addEventListener('click', function (ev) {
      var existing = document.getElementById('section-add-menu');
      if (existing) { existing.remove(); return; }
      var menu = document.createElement('div');
      menu.id = 'section-add-menu';
      menu.style.position = 'absolute';
      var rect = addSectionBtn.getBoundingClientRect();
      menu.style.left = (rect.left) + 'px';
      menu.style.top = (rect.bottom + 8) + 'px';
      menu.style.background = getComputedStyle(document.body).getPropertyValue('--card-bg') || '#fff';
      menu.style.border = '1px solid rgba(0,0,0,0.08)';
      menu.style.padding = '8px';
      menu.style.borderRadius = '8px';
      menu.style.boxShadow = '0 6px 18px rgba(0,0,0,0.12)';
      menu.style.zIndex = 9999;
      var hiddenDefaults = defaultSections.filter(function (ds) { return visibleStates[ds.title] === false; });
      if (hiddenDefaults.length === 0) {
        var note = document.createElement('div');
        note.style.padding = '6px 12px';
        note.style.color = getComputedStyle(document.body).getPropertyValue('--text-secondary') || '#666';
        note.textContent = 'No hidden sections to add';
        menu.appendChild(note);
      } else {
        hiddenDefaults.forEach(function (ds) {
          var row = document.createElement('div');
          row.style.display = 'flex';
          row.style.alignItems = 'center';
          row.style.gap = '8px';
          row.style.padding = '6px 10px';
          row.style.cursor = 'pointer';
          row.textContent = ds.title;
          row.addEventListener('click', function () {
            var exists = sections.find(function (s) { return s.title === ds.title; });
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
      var onDocClick = function (e) {
        if (!menu.contains(e.target) && e.target !== addSectionBtn) {
          menu.remove();
          document.removeEventListener('click', onDocClick);
        }
      };
      document.addEventListener('click', onDocClick);
    });
  }

  // collapse events
  window.addEventListener('sectionToggled', function (e) {
    var title = e.detail.title, collapsed = e.detail.collapsed;
    collapsedStates[title] = collapsed;
    localStorage.setItem('collapsedStates', JSON.stringify(collapsedStates));
  });

  // hide section (persist visible state)
  window.addEventListener('sectionHidden', function (e) {
    var title = e && e.detail && e.detail.title;
    if (!title) return;
    visibleStates[title] = false;
    localStorage.setItem('visibleStates', JSON.stringify(visibleStates));
    // refresh sections list
    sections = loadSections();
    refresh();
  });

  // context menu remove
  window.addEventListener('contextmenu', function (ev) {
    var target = ev.target.closest('.app-card');
    if (!target) return;
    ev.preventDefault();
    var name = (target.querySelector('.app-name') && target.querySelector('.app-name').textContent) || '';
    if (confirm("Remove link '" + name + "'?")) {
      var removed = false;
      for (var i = 0; i < sections.length; i++) {
        var s = sections[i];
        var idx = s.items.findIndex(function (it) { return it.name === name; });
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

  // search/filter
  if (searchInput) {
    searchInput.addEventListener('input', function (e) {
      var q = e.target.value.trim().toLowerCase();
      if (!q) {
        sections = loadSections();
        refresh();
        return;
      }
      var filtered = sections.map(function (s) {
        var items = s.items.filter(function (i) { return (i.name + ' ' + i.url).toLowerCase().includes(q); });
        return { title: s.title, items: items };
      }).filter(function (s) { return s.items.length > 0 || s.title.toLowerCase().includes(q); });
      renderSections(containerEl, filtered, collapsedStates, function (sectionTitle, item) {
        addItemToSection(sections, sectionTitle, item);
        sections = loadSections();
        refresh();
      }, function (title) {
        if (confirm('Delete section "' + title + '"?')) {
          removeSection(sections, title);
          sections = loadSections();
          refresh();
        }
      });
    });
  }

  // expose for debug
  window.MedLinks = { refresh: refresh };
})();

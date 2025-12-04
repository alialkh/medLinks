const sections = [
    {
        title: "University of Calgary",
        items: [
            { name: "Fresh Sheet", url: "https://freshsheet.ucalgary.ca/", color: "#2b6cb0", icon: "ph-newspaper" },
            { name: "Cards", url: "https://cards.ucalgary.ca/", color: "#dd6b20", icon: "ph-cards" },
            { name: "Osler", url: "https://osler.ucalgary.ca/", color: "#2c5282", icon: "ph-stethoscope" },
            { name: "One45", url: "https://calgary.one45.com/index.php?login_message=107", color: "#805ad5", icon: "ph-calendar-check" },
            { name: "Blackbook", url: "https://blackbook.ucalgary.ca/", color: "#1a202c", icon: "ph-notebook" },
            { name: "Calgary Guide", url: "https://calgaryguide.ucalgary.ca/", color: "#e53e3e", icon: "ph-map-trifold" }
        ]
    },
    {
        title: "Resources",
        items: [
            { name: "UpToDate", url: "https://www.uptodate.com/contents/search", color: "#2f855a", icon: "ph-first-aid" },
            { name: "OpenEvidence", url: "https://www.openevidence.com/", color: "#3182ce", icon: "ph-magnifying-glass-plus" },
            { name: "PubMed", url: "https://pubmed.ncbi.nlm.nih.gov/", color: "#2b6cb0", icon: "ph-database" },
            { name: "StatPearls", url: "https://www.ncbi.nlm.nih.gov/books/NBK430685/", color: "#38a169", icon: "ph-lightbulb" }
        ]
    }
];

const appContainer = document.getElementById('app-container');
const searchInput = document.getElementById('search-input');
const dateElement = document.getElementById('current-date');
const themeToggle = document.getElementById('theme-toggle');

// Theme Logic
const savedTheme = localStorage.getItem('theme') || 'dark';
if (savedTheme === 'light') {
    document.body.classList.add('light-theme');
}

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    const currentTheme = document.body.classList.contains('light-theme') ? 'light' : 'dark';
    localStorage.setItem('theme', currentTheme);
});

// Collapsible Logic
const collapsedStates = JSON.parse(localStorage.getItem('collapsedStates')) || {};

// Set current date
const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
dateElement.textContent = new Date().toLocaleDateString('en-US', options);

function getInitials(name) {
    return name.substring(0, 2).toUpperCase();
}

// Helper to darken color for gradient
function adjustColor(color, amount) {
    return '#' + color.replace(/^#/, '').replace(/../g, color => ('0' + Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2));
}

function createCard(app) {
    const card = document.createElement('a');
    card.className = 'app-card';
    card.href = app.url;
    card.target = '_blank';
    card.rel = 'noopener noreferrer';

    const iconDiv = document.createElement('div');
    iconDiv.className = 'app-icon';
    
    // Use Phosphor Icon if available, else initials
    if (app.icon) {
        const i = document.createElement('i');
        i.className = `ph ${app.icon}`;
        i.style.color = 'white';
        i.style.fontSize = '2rem';
        iconDiv.appendChild(i);
        iconDiv.style.background = `linear-gradient(135deg, ${app.color}, ${adjustColor(app.color, -20)})`;
    } else {
        const initialDiv = document.createElement('div');
        initialDiv.className = 'app-initial';
        initialDiv.textContent = getInitials(app.name);
        iconDiv.appendChild(initialDiv);
        iconDiv.style.background = `linear-gradient(135deg, ${app.color || '#007bff'}, ${adjustColor(app.color || '#007bff', -20)})`;
    }
    
    const nameSpan = document.createElement('span');
    nameSpan.className = 'app-name';
    nameSpan.textContent = app.name;

    card.appendChild(iconDiv);
    card.appendChild(nameSpan);
    return card;
}

function renderSections(data) {
    appContainer.innerHTML = '';
    
    data.forEach(section => {
        if (section.items.length === 0) return;

        const sectionContainer = document.createElement('div');
        sectionContainer.className = 'section-container';
        
        // Check if collapsed
        if (collapsedStates[section.title]) {
            sectionContainer.classList.add('collapsed');
        }

        if (section.title) {
            const header = document.createElement('div');
            header.className = 'section-header';
            
            const title = document.createElement('h2');
            title.className = 'section-title';
            title.textContent = section.title;
            
            const icon = document.createElement('div');
            icon.className = 'collapse-icon';
            icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>';

            header.appendChild(title);
            header.appendChild(icon);
            
            // Toggle logic
            header.addEventListener('click', () => {
                sectionContainer.classList.toggle('collapsed');
                collapsedStates[section.title] = sectionContainer.classList.contains('collapsed');
                localStorage.setItem('collapsedStates', JSON.stringify(collapsedStates));
            });

            sectionContainer.appendChild(header);
        }

        const grid = document.createElement('div');
        grid.className = 'app-grid';

        section.items.forEach(app => {
            grid.appendChild(createCard(app));
        });

        sectionContainer.appendChild(grid);
        appContainer.appendChild(sectionContainer);
    });
}

// Initial render
renderSections(sections);

// Search functionality
searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    
    // Filter sections and items
    const filteredSections = sections.map(section => {
        return {
            title: section.title,
            items: section.items.filter(app => 
                app.name.toLowerCase().includes(searchTerm)
            )
        };
    }).filter(section => section.items.length > 0);

    if (filteredSections.length === 0 && searchTerm !== '') {
        appContainer.innerHTML = '<div class="no-results">No resources found matching "' + searchTerm + '"</div>';
        // Add simple style for this dynamically or in CSS
        const noResults = appContainer.querySelector('.no-results');
        if (noResults) {
            noResults.style.gridColumn = "1 / -1";
            noResults.style.textAlign = "center";
            noResults.style.color = "#718096";
            noResults.style.fontSize = "1.1rem";
            noResults.style.marginTop = "2rem";
        }
    } else {
        renderSections(filteredSections);
    }
});
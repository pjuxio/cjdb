let organizations = [];
let filteredOrganizations = [];
let searchDebounceTimer = null;

// Load and initialize the data
async function loadData() {
    try {
        const response = await fetch('data/source.json');
        organizations = await response.json();
        
        // Sort organizations alphabetically by name
        organizations.sort((a, b) => {
            const nameA = (a.Name || '').toLowerCase();
            const nameB = (b.Name || '').toLowerCase();
            return nameA.localeCompare(nameB);
        });
        
        // Filter out flagged records by default
        filteredOrganizations = organizations.filter(org => {
            const isFlagged = org['Flagged for Review'] === true || org['Flagged for Review'] === 'true';
            return !isFlagged;
        });
        
        populateFilters();
        renderCards();
        updateStats();
    } catch (error) {
        console.error('Error loading data:', error);
        document.getElementById('cardsContainer').innerHTML = 
            '<div class="no-results">Error loading data. Please check the console.</div>';
    }
}

// Populate filter dropdowns
function populateFilters() {
    const domains = new Set();
    const regions = new Set();
    const focuses = new Set();

    organizations.forEach(org => {
        if (org['Operational Domain']) domains.add(org['Operational Domain']);
        
        // Handle Region as array
        if (org.Region && Array.isArray(org.Region)) {
            org.Region.forEach(region => {
                if (region) regions.add(region);
            });
        } else if (org.Region) {
            regions.add(org.Region);
        }
        
        if (org.Focus && Array.isArray(org.Focus)) {
            org.Focus.forEach(focus => {
                if (focus) focuses.add(focus);
            });
        }
    });

    populateSelect('scopeFilter', Array.from(domains).sort());
    populateSelect('regionFilter', Array.from(regions).sort());
    populateSelect('focusFilter', Array.from(focuses).sort());
}

function populateSelect(selectId, options) {
    const select = document.getElementById(selectId);
    const currentOptions = select.querySelectorAll('option:not(:first-child)');
    currentOptions.forEach(opt => opt.remove());
    
    options.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option;
        opt.textContent = option;
        select.appendChild(opt);
    });
}

// Render organization cards
function renderCards() {
    const container = document.getElementById('cardsContainer');
    
    if (filteredOrganizations.length === 0) {
        const activeFiltersCount = getActiveFiltersCount();
        const message = activeFiltersCount > 0 
            ? 'No organizations found matching your criteria.<br><br>Try adjusting your filters or search terms.'
            : 'No organizations available.';
        container.innerHTML = `<div class="no-results">${message}</div>`;
        return;
    }

    container.innerHTML = filteredOrganizations.map(org => createCard(org)).join('');
}

function createCard(org) {
    const hasWebsite = org.Website && org.Website.trim() !== '';
    const hasOverview = org.Overview && org.Overview.trim() !== '';
    const hasFocus = org.Focus && Array.isArray(org.Focus) && org.Focus.length > 0;
    const isFlagged = org['Flagged for Review'] === true || org['Flagged for Review'] === 'true';
    
    const domain = org['Operational Domain'] || org.Scope || 'General';
    const region = org.Region && Array.isArray(org.Region) && org.Region.length > 0 
        ? org.Region.join(', ') 
        : (org.Region || '');
    
    return `
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">
                    ${org.Name || 'Unnamed Organization'}${org.Abbreviation && org.Abbreviation.trim() !== '' ? ` (${org.Abbreviation})` : ''}
                </h3>
                ${domain || region ? `
                    <div class="card-badges-section">
                        ${domain ? `
                            <div class="badge-group">
                                <div class="badge-label">Operational Domain</div>
                                <span class="card-domain">${domain}</span>
                            </div>
                        ` : ''}
                        ${(org.Region && ((Array.isArray(org.Region) && org.Region.length > 0) || org.Region)) || (org.Country && org.Country.trim() !== '') ? `
                            <div class="badge-group">
                                <div class="badge-label">Region / Country</div>
                                <div class="region-badges">
                                    ${Array.isArray(org.Region) 
                                        ? org.Region.map(r => `<span class="card-region-badge">${r}</span>`).join('')
                                        : (org.Region ? `<span class="card-region-badge">${org.Region}</span>` : '')
                                    }
                                    ${org.Country && org.Country.trim() !== '' ? `<span class="card-country-badge">${org.Country}</span>` : ''}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                ` : ''}
            </div>

            <!--<div class="card-meta">
                ${region ? `
                    <div class="meta-item">
                        <span class="icon">📍</span>
                        <span>${region}</span>
                    </div>
                ` : ''}
                ${org.Country ? `
                    <div class="meta-item">
                        <span class="icon">🌍</span>
                        <span>${org.Country}</span>
                    </div>
                ` : ''}
            </div>-->

            <div class="card-body">
                ${hasOverview ? `
                    <p class="card-overview" data-full-text="${org.Overview.replace(/"/g, '&quot;')}" data-index="${organizations.indexOf(org)}">
                        ${truncateText(org.Overview, 200)}
                    </p>
                    ${org.Overview.length > 200 ? `
                        <button class="btn-expand" onclick="toggleOverview(${organizations.indexOf(org)})">
                            Read more
                        </button>
                    ` : ''}
                ` : '<p class="card-overview" style="font-style: italic; color: #95a5a6;">No overview available</p>'}
            </div>

            ${hasFocus ? `
                <div class="focus-section">
                    <div class="focus-label">Organization Focus</div>
                    <div class="focus-tags">
                        ${org.Focus.slice(0, 3).map(focus => 
                            `<span class="focus-tag">${focus}</span>`
                        ).join('')}
                        ${org.Focus.length > 3 ? `<span class="focus-tag">+${org.Focus.length - 3} more</span>` : ''}
                    </div>
                </div>
            ` : ''}

            ${isFlagged ? `
                <div class="card-info-panel">
                    <span class="info-icon">⚠️</span>
                    <span class="info-text">This record is flagged for review${org['Flag Reason'] && org['Flag Reason'].trim() !== '' ? `: ${org['Flag Reason']}` : ''}</span>
                </div>
            ` : ''}

            <div class="card-footer">
                ${hasWebsite ? `
                    <a href="${org.Website}" target="_blank" class="btn btn-primary">Visit Website</a>
                ` : ''}
                <button class="btn btn-secondary" onclick="showDetails(${organizations.indexOf(org)})">
                    View Details
                </button>
            </div>
        </div>
    `;
}

function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// Show detailed information in modal
function showDetails(index) {
    const org = organizations[index];
    const modal = document.getElementById('detailsModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    const modalFooter = document.getElementById('modalFooter');
    
    // Set modal title
    const orgName = org.Name || 'Unnamed Organization';
    const abbreviation = org.Abbreviation && org.Abbreviation.trim() !== '' ? ` (${org.Abbreviation})` : '';
    modalTitle.textContent = orgName + abbreviation;
    
    // Build modal body content
    const hasWebsite = org.Website && org.Website.trim() !== '';
    const isFlagged = org['Flagged for Review'] === true || org['Flagged for Review'] === 'true';
    
    // Combine Operational Domain and Scope like on the card
    const domain = org['Operational Domain'] || org.Scope || '';
    const hasRegion = org.Region && ((Array.isArray(org.Region) && org.Region.length > 0) || org.Region);
    const hasCountry = org.Country && org.Country.trim() !== '';
    
    modalBody.innerHTML = `
        ${isFlagged ? '<div class="detail-section"><span class="flagged-badge" style="font-size: 1rem; padding: 8px 16px;">⚠️ Flagged for Review</span></div>' : ''}
        
        <div class="detail-grid">
            ${domain ? `
                <div class="detail-item">
                    <span class="detail-label">Operational Domain</span>
                    <div class="detail-value">
                        ${domain}
                    </div>
                </div>
            ` : ''}
            
            ${hasRegion ? `
                <div class="detail-item">
                    <span class="detail-label">Region</span>
                    <div class="detail-value">
                        ${Array.isArray(org.Region) ? org.Region.join(', ') : org.Region}
                    </div>
                </div>
            ` : ''}
            
            ${hasCountry ? `
                <div class="detail-item">
                    <span class="detail-label">Country</span>
                    <div class="detail-value">
                        ${org.Country}
                    </div>
                </div>
            ` : ''}
        </div>
        
        ${org['Locations/Countries'] ? `
            <div class="detail-section">
                <span class="detail-label">Locations/Countries</span>
                <div class="detail-value">${org['Locations/Countries']}</div>
            </div>
        ` : ''}
        
        ${org.Focus && org.Focus.length > 0 ? `
            <div class="detail-section">
                <span class="detail-label">Focus Areas</span>
                <div class="detail-tags">
                    ${org.Focus.map(focus => `<span class="detail-tag">${focus}</span>`).join('')}
                </div>
            </div>
        ` : ''}
        
        ${org.Overview ? `
            <div class="detail-divider"></div>
            <div class="detail-section">
                <span class="detail-label">Overview</span>
                <div class="detail-value">${org.Overview}</div>
            </div>
        ` : ''}
        
        ${org['Key Activities'] ? `
            <div class="detail-section">
                <span class="detail-label">Key Activities</span>
                <div class="detail-value">${org['Key Activities']}</div>
            </div>
        ` : ''}
        
        ${org['Address Line 1'] || org['Address Line 2'] || org.City || org['State/Province'] || org['Postal Code'] ? `
            <div class="detail-divider"></div>
            <div class="detail-section">
                <span class="detail-label">Address</span>
                <div class="detail-value">
                    ${org['Address Line 1'] ? `${org['Address Line 1']}<br>` : ''}
                    ${org['Address Line 2'] ? `${org['Address Line 2']}<br>` : ''}
                    ${org.City ? org.City : ''}${org['State/Province'] ? `, ${org['State/Province']}` : ''}${org['Postal Code'] ? ` ${org['Postal Code']}` : ''}
                    ${(org.City || org['State/Province'] || org['Postal Code']) ? '<br>' : ''}
                </div>
            </div>
        ` : ''}
        
        ${org.Latitude && org.Longitude ? `
            <div class="detail-section">
                <span class="detail-label">Coordinates</span>
                <div class="detail-value">
                    Latitude: ${org.Latitude}, Longitude: ${org.Longitude}
                </div>
            </div>
        ` : ''}
    `;
    
    // Build modal footer
    modalFooter.innerHTML = `
        ${hasWebsite ? `
            <a href="${org.Website}" target="_blank" class="btn btn-primary">
                🌐 Visit Website
            </a>
        ` : ''}
        <button class="btn btn-secondary" onclick="closeModal()">Close</button>
    `;
    
    // Show modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Close modal
function closeModal() {
    const modal = document.getElementById('detailsModal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('detailsModal');
    if (event.target === modal) {
        closeModal();
    }
}

// Close modal with Escape key
window.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeModal();
    }
});

// Toggle overview text expansion
function toggleOverview(index) {
    const cards = document.querySelectorAll('.card-overview');
    const targetCard = Array.from(cards).find(card => card.dataset.index == index);
    
    if (!targetCard) return;
    
    const button = targetCard.nextElementSibling;
    const isExpanded = targetCard.classList.contains('expanded');
    
    if (isExpanded) {
        // Collapse
        const fullText = targetCard.dataset.fullText;
        targetCard.textContent = truncateText(fullText, 200);
        targetCard.classList.remove('expanded');
        if (button && button.classList.contains('btn-expand')) {
            button.textContent = 'Read more';
        }
    } else {
        // Expand
        const fullText = targetCard.dataset.fullText;
        targetCard.textContent = fullText;
        targetCard.classList.add('expanded');
        if (button && button.classList.contains('btn-expand')) {
            button.textContent = 'Read less';
        }
    }
}

// Filter functionality
function applyFilters() {
    // Show loading indicator
    const loadingIndicator = document.getElementById('loadingIndicator');
    loadingIndicator.classList.add('active');
    
    // Small delay to ensure loading indicator is visible
    setTimeout(() => {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const scopeFilter = document.getElementById('scopeFilter').value;
        const regionFilter = document.getElementById('regionFilter').value;
        const focusFilter = document.getElementById('focusFilter').value;
        const showFlagged = document.getElementById('flaggedToggle').checked;

    filteredOrganizations = organizations.filter(org => {
        // Search filter
        const matchesSearch = !searchTerm || 
            (org.Name && org.Name.toLowerCase().includes(searchTerm)) ||
            (org.Overview && org.Overview.toLowerCase().includes(searchTerm)) ||
            (org['Key Activities'] && org['Key Activities'].toLowerCase().includes(searchTerm));

        // Operational Domain filter
        const matchesScope = !scopeFilter || 
            org['Operational Domain'] === scopeFilter;

        // Region filter - handle array
        const matchesRegion = !regionFilter || 
            (org.Region && Array.isArray(org.Region) && org.Region.includes(regionFilter)) ||
            org.Region === regionFilter;

        // Focus filter
        const matchesFocus = !focusFilter || 
            (org.Focus && Array.isArray(org.Focus) && org.Focus.includes(focusFilter));

        // Flagged filter - hide flagged records by default unless toggle is checked
        const isFlagged = org['Flagged for Review'] === true || org['Flagged for Review'] === 'true';
        const matchesFlagged = showFlagged || !isFlagged;

        return matchesSearch && matchesScope && matchesRegion && matchesFocus && matchesFlagged;
    });

        renderCards();
        updateStats();
        
        // Hide loading indicator
        loadingIndicator.classList.remove('active');
    }, 150);
}

// Update statistics
function updateStats() {
    const total = organizations.length;
    const filtered = filteredOrganizations.length;
    const statsText = filtered === total 
        ? `Showing all ${total} organizations`
        : `Showing ${filtered} of ${total} organizations`;
    
    document.getElementById('resultCount').textContent = statsText;
    updateActiveFilterBadges();
}

// Get count of active filters
function getActiveFiltersCount() {
    let count = 0;
    if (document.getElementById('searchInput').value) count++;
    if (document.getElementById('scopeFilter').value) count++;
    if (document.getElementById('regionFilter').value) count++;
    if (document.getElementById('focusFilter').value) count++;
    if (document.getElementById('flaggedToggle').checked) count++;
    return count;
}

// Update active filter badges
function updateActiveFilterBadges() {
    const container = document.getElementById('activeFilters');
    const badges = [];
    
    const searchTerm = document.getElementById('searchInput').value;
    if (searchTerm) {
        badges.push(createFilterBadge('Search', searchTerm, 'search'));
    }
    
    const scopeFilter = document.getElementById('scopeFilter');
    if (scopeFilter.value) {
        badges.push(createFilterBadge('Domain', scopeFilter.value, 'scope'));
    }
    
    const regionFilter = document.getElementById('regionFilter');
    if (regionFilter.value) {
        badges.push(createFilterBadge('Region', regionFilter.value, 'region'));
    }
    
    const focusFilter = document.getElementById('focusFilter');
    if (focusFilter.value) {
        badges.push(createFilterBadge('Focus', focusFilter.value, 'focus'));
    }
    
    const flaggedToggle = document.getElementById('flaggedToggle');
    if (flaggedToggle.checked) {
        badges.push(createFilterBadge('Show', 'Flagged Records', 'flagged'));
    }
    
    container.innerHTML = badges.join('');
}

// Create filter badge HTML
function createFilterBadge(label, value, type) {
    return `
        <div class="filter-badge">
            <span class="filter-badge-label">${label}:</span>
            <span class="filter-badge-value">${value}</span>
            <button class="filter-badge-remove" onclick="removeFilter('${type}')" aria-label="Remove filter">&times;</button>
        </div>
    `;
}

// Remove specific filter
function removeFilter(type) {
    switch(type) {
        case 'search':
            document.getElementById('searchInput').value = '';
            updateClearButton();
            break;
        case 'scope':
            document.getElementById('scopeFilter').value = '';
            break;
        case 'region':
            document.getElementById('regionFilter').value = '';
            break;
        case 'focus':
            document.getElementById('focusFilter').value = '';
            break;
        case 'flagged':
            document.getElementById('flaggedToggle').checked = false;
            break;
    }
    applyFilters();
}

// Reset filters
function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('scopeFilter').value = '';
    document.getElementById('regionFilter').value = '';
    document.getElementById('focusFilter').value = '';
    document.getElementById('flaggedToggle').checked = false;
    updateClearButton();
    
    applyFilters();
}

// Update clear button visibility
function updateClearButton() {
    const searchInput = document.getElementById('searchInput');
    const clearButton = document.getElementById('clearSearch');
    
    if (searchInput.value.length > 0) {
        clearButton.classList.add('visible');
    } else {
        clearButton.classList.remove('visible');
    }
}

// Clear search input
function clearSearch() {
    document.getElementById('searchInput').value = '';
    updateClearButton();
    document.getElementById('searchInput').focus();
    applyFilters();
}

// Toggle filters visibility (mobile)
function toggleFilters() {
    const filtersContainer = document.querySelector('.filters');
    filtersContainer.classList.toggle('collapsed');
}

// Debounced search
function debounceSearch() {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
        applyFilters();
    }, 300);
}

// Event listeners
document.getElementById('searchInput').addEventListener('input', function() {
    updateClearButton();
    debounceSearch();
});

document.getElementById('searchInput').addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        clearSearch();
    }
});

document.getElementById('clearSearch').addEventListener('click', clearSearch);
document.getElementById('scopeFilter').addEventListener('change', applyFilters);
document.getElementById('regionFilter').addEventListener('change', applyFilters);
document.getElementById('focusFilter').addEventListener('change', applyFilters);
document.getElementById('flaggedToggle').addEventListener('change', applyFilters);
document.getElementById('resetFilters').addEventListener('click', resetFilters);
document.getElementById('toggleFilters').addEventListener('click', toggleFilters);

// Initialize on page load
window.addEventListener('DOMContentLoaded', loadData);

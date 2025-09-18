// Store all jobs in memory for filtering and manipulation
let allJobs = [];

// Base URL for our backend API
const API_BASE = 'http://localhost:3000';

/**
 * Fetches jobs from the backend API with optional search query and pagination
 * @param {string} query - Search term for filtering jobs
 * @param {number} page - Page number for pagination (50 jobs per page)
 */
async function fetchJobs(query = '', page = 1) {
  showLoadingMessage(); // Show loading indicator while fetching
  try {
    // Build the query parameter string
    // If there's a search query, include it, otherwise just use pagination
    const qParam = query 
      ? `?q=${encodeURIComponent(query)}&limit=50&offset=${(page-1)*50}` 
      : `?limit=50&offset=${(page-1)*50})`;
    
    // Make API request to our backend
    const resp = await fetch(`${API_BASE}/api/jobs${qParam}`);
    if (!resp.ok) {
      throw new Error(`API error ${resp.status}`);
    }

    // Parse JSON response and ensure jobs is always an array
    const data = await resp.json();
    const jobs = Array.isArray(data.jobs) ? data.jobs : [];
    allJobs = jobs; // Update global jobs array
    displayJobs(jobs); // Show jobs on the page
    console.log(`loaded ${jobs.length} jobs for query: ${query || '(all)'}`);
  } catch (error) {
    console.error('Failed to load job:', error);
    showErrorMessage(error.message);
  }
}

/**
 * Displays job cards in the container
 * Shows a "No jobs found" message if the array is empty
 */
function displayJobs(jobs) {
  const container = document.querySelector('.job-listings-container');
  container.innerHTML = ''; // Clear existing content

  // Show message if no jobs found
  if (jobs.length === 0) {
    container.innerHTML = `
      <div class="no-jobs-message"> 
        <h3>No jobs found</h3>
        <p>Try adjusting your search or filters</p>
      </div>
    `;
    return;
  }

  // Create and add job cards to container
  jobs.forEach(job => {
    const jobCard = createJobCard(job);
    container.appendChild(jobCard);
  });
}

/**
 * Creates a job card element with job details and apply button
 * @param {Object} job - Job object containing title, company, location etc.
 * @returns {HTMLElement} The created job card
 */
function createJobCard(job) {
  const card = document.createElement('div');
  card.className = 'job-card';

  // Format the date string
  const formattedDate = job.posted_date ? new Date(job.posted_date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }) : '';
  
  // Fill card with job details, using empty string as fallback if property is missing
  card.innerHTML = `
    <h3 class="job-title">${job.title || ''}</h3> 
    <p class="job-company">${job.company || ''}</p>
    <p class="job-location">${job.location || ''}</p>
    <p class="job-type">${job.employment_type || job.type || ''}</p>
    <p class="job-date">${formattedDate}</p>
    <button class="apply-button" ${job.apply_link ? '' : 'disabled'}> Apply </button> 
  `;

  // Add click handler to apply button if link exists
  const applyBtn = card.querySelector('.apply-button');
  if (job.applied_link) {
    applyBtn.addEventListener('click', () => {
      window.open(job.apply_link, '_blank'); // Open application link in new tab
    });
  }

  return card;
}

/**
 * Shows error message when job fetching fails
 */
function showErrorMessage(message) {
  const container = document.querySelector('.job-listings-container');
  container.innerHTML = `
    <div class="error-message">
      <h3>Oops, something went wrong</h3>
      <p>${message}</p>
      <button onclick="fetchJobs()">Try Again</button>
    </div>
  `;
}

/**
 * Shows loading message while fetching jobs
 */
function showLoadingMessage() {
  const container = document.querySelector('.job-listings-container');
  container.innerHTML = `
    <div class="loading-message">
      <h3>Loading jobs...</h3>
      <p>Please wait while we fetch the latest job listings.</p>
    </div>
  `;
}

// When page loads, set up search and fetch initial jobs
document.addEventListener('DOMContentLoaded', () => {
  console.log("Loaded job finder");
  setupSearch();
  fetchJobs('');
});

/**
 * Sets up search input with debounced event handler
 * Debouncing prevents too many API calls while user is typing
 */
function setupSearch() {
  const searchInput = document.getElementById('searchInput');
  // Create debounced search function that waits 400ms after last keystroke
  const debounced = debounce((term) => {
    fetchJobs(term, 1);
  }, 400);

  // Add input event listener
  searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value;
    const trimmed = searchTerm.trim();
    if (trimmed.length === 0) {
      fetchJobs('', 1); // If search is empty, show all jobs
    } else {
      debounced(trimmed); // Otherwise search with trimmed term
    }
  });
}

/**
 * Toggles visibility of filter panel
 */
function toggleFilters() {
  const panel = document.getElementById('filterPanel');
  panel.style.display = (panel.style.display === 'flex') ? 'none' : 'flex';
}

/**
 * Helper function to prevent too many function calls
 * Waits for pause in triggering before executing
 */
function debounce(fn, delay) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId); // Clear previous timeout
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

// Get the menu elements
const hamburgerBtn = document.getElementById('hamburgerToggle');
const navBar = document.getElementById('nav-bar');

// Toggle menu when hamburger is clicked
hamburgerBtn.addEventListener('click', () => {
    navBar.classList.toggle('is-active');
});

// Close menu when clicking outside
document.addEventListener('click', (e) => {
    if (!navBar.contains(e.target) && !hamburgerBtn.contains(e.target)) {
        navBar.classList.remove('is-active');
    }
});

// Close menu when escape key is pressed
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        navBar.classList.remove('is-active');
    }
});

// Tab switching functionality
document.addEventListener('DOMContentLoaded', () => {
    const tabButtons = document.querySelectorAll('.tab-button');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and panes
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
            
            // Add active class to clicked button
            button.classList.add('active');
            
            // Show corresponding pane
            const tabId = button.dataset.tab;
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });
});


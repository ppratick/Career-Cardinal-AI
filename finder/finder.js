let allJobs = [];

const API_BASE = 'http://localhost:3000';
const PAGE_SIZE = 8;
const REQUEST_SIZE = PAGE_SIZE * 2;

let currentPage = 1;
let lastPageCount = 0;
let currentQuery = '';
let totalJobsCount = null;

async function fetchJobs(query = '', page = 1) {
  showLoadingMessage();
  try {
    const queryParam = query 
      ? `?q=${encodeURIComponent(query)}&limit=${REQUEST_SIZE}&offset=${(page-1)*PAGE_SIZE}` 
      : `?limit=${REQUEST_SIZE}&offset=${(page-1)*PAGE_SIZE}`;

    const response = await fetch(`${API_BASE}/api/jobs${queryParam}`);
    if (!response.ok) {
      throw new Error(`API error ${response.status}`);
    }

    const data = await response.json();
    const allJobsFromAPI = Array.isArray(data.jobs) ? data.jobs : [];

    const savedJobs = await getSavedJobs();
    const unsavedJobs = allJobsFromAPI.filter(job => {
      return !savedJobs.some(savedJob => 
        savedJob.title === job.title && 
        savedJob.company === job.company
      );
    });

    const toDisplay = unsavedJobs.slice(0, PAGE_SIZE);
    allJobs = toDisplay;
    displayJobs(toDisplay);

    currentPage = page;
    currentQuery = query;
    lastPageCount = toDisplay.length;
    updatePaginationControls();
    updateDbCountLabel(query);
    console.log(`loaded ${allJobsFromAPI.length} jobs, showing ${unsavedJobs.length} unsaved jobs for query: ${query || '(all)'}`);
  } catch (error) {
    console.error('Failed to load job:', error);
    showErrorMessage(error.message);
  }
}

function displayJobs(jobs) {
  const container = document.querySelector('.job-listings-container');
  container.innerHTML = '';

  if (jobs.length === 0) {
    container.innerHTML = `
      <div class="no-jobs-message"> 
        <h3>No jobs found</h3>
        <p>Try adjusting your search or filters</p>
      </div>
    `;
    return;
  }

  jobs.forEach(job => {
    const jobCard = createJobCard(job);
    container.appendChild(jobCard);
  });
}

function createJobCard(job) {
  const card = document.createElement('div');
  card.className = 'job-card';

  const formattedDate = job.posted_date ? new Date(job.posted_date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }) : '';
  
  card.innerHTML = `
    <h3 class="job-title">${job.title || ''}</h3> 
    <p class="job-company">${job.company || ''}</p>
    <p class="job-location">${job.location || ''}</p>
    <p class="job-type">${job.employment_type || job.type || ''}</p>
    <p class="job-date">${formattedDate}</p>
    <button class="apply-button" ${job.apply_link ? '' : 'disabled'}> Apply </button>
    <button type="button" class="star-button">&#9734;</button>
  `;

  const applyButton = card.querySelector('.apply-button');
  if (job.apply_link) {
    applyButton.addEventListener('click', () => {
      window.open(job.apply_link, '_blank');
    });
  }

  const starButton = card.querySelector('.star-button');
  
  starButton.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    await saveJobToTracker(job);
    
    card.remove();
    
    console.log('Job saved and removed from finder:', job.title);
  });
  
  return card;
}

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

function showLoadingMessage() {
  const container = document.querySelector('.job-listings-container');
  container.innerHTML = `
    <div class="loading-message">
      <h3>Loading jobs...</h3>
      <p>Please wait while we fetch the latest job listings.</p>
    </div>
  `;
}

async function getSavedJobs() {
  try {
    const response = await fetch(`${API_BASE}/jobs`);
    const jobs = await response.json();
    return jobs.filter(job => job.status === 'saved');
  } catch (error) {
    console.error('Failed to get saved jobs:', error);
    return [];
  }
}

async function saveJobToTracker(job) {
  const jobData = {
    title: job.title || '',
    company: job.company || '',
    date: job.posted_date ? new Date(job.posted_date).toISOString().split('T')[0] : '',
    link: job.apply_link || '',
    notes: `Found via Job Finder - ${job.location || ''} - ${job.employment_type || ''}`,
    status: 'saved'
  };

  await fetch(`${API_BASE}/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(jobData)
  });
}

document.addEventListener('DOMContentLoaded', () => {
  console.log("Loaded job finder");
  setupSearch();
  wirePaginationButtons();
  updateDbCountLabel('');
  fetchJobs('');
});

function setupSearch() {
  const searchInput = document.getElementById('searchInput');
  const debounced = debounce((term) => {
    fetchJobs(term, 1);
  }, 400);

  searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value;
    const trimmed = searchTerm.trim();
    if (trimmed.length === 0) {
      fetchJobs('', 1);
    } else {
      debounced(trimmed);
    }
  });
}

function updatePaginationControls() {
  const prevBtn = document.getElementById('prevPage');
  const nextBtn = document.getElementById('nextPage');
  const pageInfo = document.getElementById('pageInfo');

  if (!prevBtn || !nextBtn || !pageInfo) return;

  const startIndex = (currentPage - 1) * PAGE_SIZE + 1;
  const endIndex = startIndex + lastPageCount - 1;

  const rangeText = `${startIndex}\u2013${Math.max(startIndex, endIndex)}`;

  pageInfo.innerHTML = (typeof totalJobsCount === 'number')
    ? `<span class="page-range">${rangeText}</span> / <span class="page-total">${totalJobsCount}</span>`
    : `<span class="page-range">${rangeText}</span>`;

  prevBtn.disabled = currentPage <= 1;

  nextBtn.disabled = lastPageCount < PAGE_SIZE;
}

async function updateDbCountLabel(query) {
  try {
    const queryParam = query ? `?q=${encodeURIComponent(query)}` : '';
    const response = await fetch(`${API_BASE}/api/jobs/count${queryParam}`);
    if (!response.ok) return;

    const data = await response.json();

    if (typeof data.total === 'number') {
      totalJobsCount = data.total;
      updatePaginationControls();
    }
  } catch (e) {
  }
}

function wirePaginationButtons() {
  const prevBtn = document.getElementById('prevPage');
  const nextBtn = document.getElementById('nextPage');

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        fetchJobs(currentQuery, currentPage - 1);
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      fetchJobs(currentQuery, currentPage + 1);
    });
  }
}

function toggleFilters() {
  const panel = document.getElementById('filterPanel');
  panel.style.display = (panel.style.display === 'flex') ? 'none' : 'flex';
}

function debounce(fn, delay) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

const hamburgerBtn = document.getElementById('hamburgerToggle');
const navBar = document.getElementById('nav-bar');

hamburgerBtn.addEventListener('click', () => {
    navBar.classList.toggle('is-active');
});

document.addEventListener('click', (e) => {
    if (!navBar.contains(e.target) && !hamburgerBtn.contains(e.target)) {
        navBar.classList.remove('is-active');
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        navBar.classList.remove('is-active');
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const tabButtons = document.querySelectorAll('.tab-button');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
            
            button.classList.add('active');
            
            const tabID = button.dataset.tab;
            document.getElementById(`${tabID}-tab`).classList.add('active');
        });
    });
});


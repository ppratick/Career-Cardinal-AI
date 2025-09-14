let allJobs = [];
const API_BASE = 'http://localhost:3000';

async function fetchJobs(query = '', page = 1) {
  showLoadingMessage();
  try{
    // Ternary (condition ? A : B)
    const qParam = query ? `?q=${encodeURIComponent(query)}&limit=50&offset=${(page-1)*50}` : `?limit=50&offset=${(page-1)*50})`;
    const resp = await fetch(`${API_BASE}/api/jobs${qParam}`);
    if (!resp.ok){
      throw new Error(`API error ${resp.status}`)
    }

    const data = await resp.json();
    const jobs = Array.isArray(data.jobs) ? data.jobs : [];
    allJobs = jobs;
    displayJobs(jobs);
    console.log(`loaded ${jobs.length} jobs for query: ${query || '(all)'}`);
  } catch (error){
    console.error('Failed to load job:', error);
      alert('Failed to load jobs, please try again'); 
    showErrorMessage(error.message);
  }
}

function displayJobs(jobs){
  const container = document.querySelector('.job-listings-container');
  container.innerHTML = '';
  if(jobs.length === 0){
    container.innerHTML = `
      <div class = "no-jobs-message"> 
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

function createJobCard(job){
  const card = document.createElement('div');
  card.className = 'job-card';
  card.innerHTML = `
    <h3 class = "job-title">${job.title || ''}</h3> 
    <p class = "job-company">${job.company || ''}</p>
    <p class = "job-location">${job.location || ''}</p>
    <p class = "job-type">${job.employment_type || job.type || ''}</p>
    <button class = "apply-button" ${job.apply_link ? '' : 'disabled'}> Apply </button> 
  `;

  const applyBtn = card.querySelector('.apply-button');
  if (job.applied_link) {
    applyBtn.addEventListener('click', () =>{
      window.open(job.apply_link, '_blank');
    });
  }

  return card;
}



function showErrorMessage(message){
  const container = document.querySelector('.job-listings-container');
  container.innerHTML = `
    <div class = "error-message">
      <h3> Oops, something went wrong </h3>
      <p> ${message} </p>
      <button onclick = "fetchJobs()"> Try Again </button>
    </div>
  `;
}

function showLoadingMessage(){
  const container = document.querySelector('.job-listings-container');
    container.innerHTML = `
    <div class = "loading-message">
      <h3> Loading jobs... </h3>
      <p> Please wait while we fetch the latest job listings. </p>
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  console.log("Loaded job finder");
  setupSearch();
  fetchJobs('');
});

function setupSearch(){
  const searchInput = document.getElementById('searchInput');
  const debounced  = debounce((term) => {
    fetchJobs(term, 1);
  }, 400);
  searchInput.addEventListener('input', (e) => {
  const searchTerm = e.target.value;
  const trimmed = searchTerm.trim();
  if (trimmed.length === 0) {
    fetchJobs('', 1);
  } else{
    debounced(trimmed);
  }
  });
}

function toggleFilters() {
  const panel = document.getElementById('filterPanel');
  panel.style.display = (panel.style.display === 'flex') ? 'none' : 'flex';
};

const filterButton = document.createElement('button');
  filterButton.className = 'filter-button';
  filterButton.addEventListener('click', () => {
    toggleFilters();
  });

  async function fetchAPIJOBS(query = 'developer jobs in Chicago', page = 1) {
    return fetchJobs(query, page);
  };

  function debounce(fn, delay){
    let t;
    return function(...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), delay);
    };
  }

const hamburger = document.getElementById('hamburgerToggle');
const navBar = document.getElementById('nav-bar');
hamburger.addEventListener('click', () => {
  navBar.classList.toggle('is-active');
});


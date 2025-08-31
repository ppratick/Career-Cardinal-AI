let allJobs = [];

async function fetchJobs() {
  showLoadingMessage();
  try {
    const sampleJobs = [
      {
        id: 1, 
        title: 'Frontend Developer',
        company: 'Google',
        location: 'San Francisco, CA',
        type: 'Full time',
        desc: '40 minutes away'
      },
      {
        id: 2, 
        title: 'Backend Developer',
        company: 'Apple',
        location: 'Myrtle Beach, VA',
        type: 'Full time',
        desc: '40 minutes away'
      },
      {
        id: 3, 
        title: 'Middleend Developer',
        company: 'Apple',
        location: 'M',
        type: 'Full time',
        desc: '40 minutes away'
      }
    ];

    allJobs = sampleJobs;
    displayJobs(sampleJobs);
    console.log(`Successfully loaded ${sampleJobs.length} sample jobs`);
  } catch (error) {
    console.error('Failed to load jobs: ', error)
    showErrorMessage('Failed to load jobs, please try again later');

  }
}



function displayJobs(jobs){
  const container = document.querySelector('.jobs-listings-container');
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

function createJobCard(jobCard){
  const card = document.createElement('div');
  card.className = 'job-card';
  card.innerHTML = `
    <h3 class = "job-title">${job.title}</h3>
    <p class = "job-company">${job.company}</p>
    <p class = "job-location">${job.location}</p>
    <p class = "job-type">${job.type}</p>
    <button class = apply-button> Apply </button> 
  `;
  return card;
}

function showErrorMessage(message){
  const container = document.querySelector('.job-listings-container');
  container.innerHTML = `
    <div class = "error-message">
      <h3> Oops, something went wrong </h3>
      <p> ${message} </p>
      <button onClick = "fetchJobs()"> Try Again </button>
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
  fetchJobs();
});

function setupSearch(){
  const searchInput = document.getElementById('searchInput');
  searchInput.addEventListener('input', (e) => {
  const searchTerm = e.target.value.toLowerCase().trim();
  const filteredJobs = allJobs.filter(job => 
    job.title.toLowerCase().include(searchTerm) ||
    job.company.toLowerCase().include(searchTerm) ||
    job.location.toLowerCase().include(searchTerm) ||
    job.type.toLowerCase().include(searchTerm)
  );
  displayJobs(filteredJobs);
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
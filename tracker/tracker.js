// ----------------------
// Job Tracker Script
// ----------------------

const API_BASE_URL = "http://localhost:3000"; // Base URL for API requests

async function apiCall(endpoint, options ={}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json'
    }, 
    ...options
  });

  if(!response.ok){
    throw new Error(`API call failed: ${response.status} ${response.statusText}`);
  }
  return response.json();
};

// On page load, retrieve any saved job data from localStorage and render it into the correct columns.
window.addEventListener('DOMContentLoaded', async() => {
  try {
    const jobs = await apiCall('/jobs')
    console.log('Jobs loaded from the server: ', jobs);
    if (jobs && jobs.length > 0){
      jobs.forEach(job =>{
        const jobCard = createJobCard(job);
        const targetColumn = document.getElementById(job.status);
        targetColumn.querySelector('.column-content').insertBefore(jobCard, targetColumn.querySelector('.input-wrapper'));
      });
    } else {
      console.log('No jobs found in the database');
    }
  } catch (error) {
    console.error('Failed to load jobs from the server: ', error)
    alert('Failed to load jobs from the server, please refresh your page');
  }
});


// Track the next unique job ID and store the currently dragged job for drag-and-drop
let draggedJob = { job: null, sourceColumnId: '' };

// Creates a new job card element with display and edit modes
function createJobCard(job) {

  // Main job card container
  const card = document.createElement('div');
  card.className = 'job-card';
  card.setAttribute('draggable', 'true'); // Enable drag-and-drop
  card.setAttribute('data-job-id', job.id);

  // -------------------
  // Job title display
  // -------------------
  const titleSpan = document.createElement('span');
  titleSpan.className = 'job-title';
  titleSpan.textContent = job.title;
  card.appendChild(titleSpan);

  // -------------------
  // Display mode details
  // -------------------
  const displayDiv = document.createElement('div');
  displayDiv.className = 'job-details';
  displayDiv.innerHTML = `
    <div><strong>Company:</strong> ${job.company || ''}</div>
    <div><strong>Date Applied:</strong> ${job.date || ''}</div>
    <div><strong>Job Link:</strong> <a href="${job.link || '#'}" target="_blank">${job.link || ''}</a></div>
    <div><strong>Notes:</strong> ${job.notes || ''}</div>
  `;

  // -------------------
  // Edit mode form
  // -------------------
  const editDiv = document.createElement('div');
  editDiv.className = 'job-details';
  editDiv.style.display = 'none'; // Hidden until user clicks "Edit"
  editDiv.innerHTML = `
    <label><strong>Position:</strong><br><input type="text" class="edit-title" value="${job.title || ''}" /></label><br>
    <label><strong>Company:</strong><br><input type="text" class="edit-company" value="${job.company || ''}" /></label><br>
    <label><strong>Applied:</strong><br><input type="date" class="edit-date" value="${job.date || ''}" /></label><br>
    <label><strong>Link:</strong><br><input type="url" class="edit-link" value="${job.link || ''}" /></label><br>
    <label><strong>Notes:</strong><br><textarea class="edit-notes">${job.notes || ''}</textarea></label><br>
    <button class="update-button">Update</button>
    <button class="cancel-button">Cancel</button>
  `;

  // -------------------
  // Edit button toggles between display and edit modes
  // -------------------
  const editButton = document.createElement('button');
  editButton.textContent = 'Edit';
  editButton.className = 'edit-button';
  editButton.addEventListener('click', (e) => {
    e.stopPropagation();
    displayDiv.style.display = 'none';
    editDiv.style.display = 'block';
  });
  displayDiv.appendChild(editButton);

  // Append display and edit sections to card
  card.appendChild(displayDiv);
  card.appendChild(editDiv);

  // Prevent clicks on buttons from triggering card click events
  card.addEventListener('click', (e) => {
    if (e.target.closest('button')) return;
  });

  // -------------------
  // Delete button
  // -------------------
  const deleteButton = document.createElement('button');
  deleteButton.className = 'delete-button';
  deleteButton.textContent = 'X';
  deleteButton.addEventListener('click', async () => {
    try {
     await apiCall(`/jobs/${job.id}`, {
      method: 'DELETE'
      
     });
     card.remove();
     console.log(`${job.id} was successfully deleted`);
    } catch (error) {
      console.error('Failed to delete job:', error);
      alert('Failed to delete job, please try again');
    }
  });
  card.appendChild(deleteButton);

  // -------------------
  // Update button logic — saves edits to localStorage and updates the display
  // -------------------
  card.querySelector('.update-button').addEventListener('click', async () => {
    try{
      const updatedValues = {
        title: editDiv.querySelector('.edit-title').value.trim(),
        company: editDiv.querySelector('.edit-company').value.trim(),
        date: editDiv.querySelector('.edit-date').value.trim(),
        link: editDiv.querySelector('.edit-link').value.trim(),
        notes: editDiv.querySelector('.edit-notes').value.trim(),
        status: job.status
      };
      await apiCall(`/jobs/${job.id}`, {
        method: 'PUT',
        body: JSON.stringify(updatedValues)
      });
      Object.assign(job, updatedValues);
      titleSpan.textContent = job.title;
      displayDiv.innerHTML = `
        <div><strong>Company:</strong> ${job.company || ''}</div>
        <div><strong>Date Applied:</strong> ${job.date || ''}</div>
        <div><strong>Job Link:</strong> <a href="${job.link || '#'}" target="_blank">${job.link || ''}</a></div>
        <div><strong>Notes:</strong> ${job.notes || ''}</div>
      `;
      const newEditButton = document.createElement('button');
      newEditButton.textContent = 'Edit';
      newEditButton.className = 'edit-button';
      newEditButton.addEventListener('click', (e) => {
        e.stopPropagation();
        displayDiv.style.display = 'none';
        editDiv.style.display = 'block';
      });
      displayDiv.appendChild(newEditButton);
      editDiv.style.display = 'none';
      displayDiv.style.display = 'block';
      console.log(`${job.id} updated successfully`);
    } catch (error) {
      console.error('Failed to update job: ', error);
      alert('Failed to update job, please try again');
    }
  });

  // -------------------
  // Cancel button logic — restores original values and switches back to display mode
  // -------------------
  card.querySelector('.cancel-button').addEventListener('click', () => {
    editDiv.querySelector('.edit-title').value = job.title || '';
    editDiv.querySelector('.edit-company').value = job.company || '';
    editDiv.querySelector('.edit-date').value = job.date || '';
    editDiv.querySelector('.edit-link').value = job.link || '';
    editDiv.querySelector('.edit-notes').value = job.notes || '';
    editDiv.style.display = 'none';
    displayDiv.style.display = 'block';
  });

  // -------------------
  // Drag-and-drop start event — store dragged job details
  // -------------------
  card.addEventListener('dragstart', () => {
    draggedJob.job = job;
    draggedJob.sourceColumnId = card.closest('.column').id;
  });

  return card; // Return complete job card element
}

// -------------------
// Drag-and-drop handling for each column's content area
// -------------------
document.querySelectorAll('.column-content').forEach(container => {
  container.addEventListener('dragover', event => {
    event.preventDefault();
    container.classList.add('drag-over'); // Visual cue for drop target
  });

  container.addEventListener('dragleave', () => {
    container.classList.remove('drag-over');
  });

  container.addEventListener('drop', async () => {
    container.classList.remove('drag-over');
    const targetColumn = container.closest('.column');
    const targetColumnID = targetColumn.id;

    // Prevent dropping if no job is being dragged or dropping into same column
    if (!draggedJob.job) return;
    if (draggedJob.sourceColumnId == targetColumnID) return;

    try {
      await apiCall(`/jobs/${draggedJob.job.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...draggedJob.job,
          status: targetColumnID
        })
      });

      draggedJob.job.status = targetColumnID;

      const newJobCard = createJobCard(draggedJob.job);
      container.insertBefore(newJobCard, container.querySelector('.input-wrapper'));

      const sourceColumn = document.getElementById(draggedJob.sourceColumnId);
      const cards = sourceColumn.querySelectorAll('.job-card');
      for (let card of cards) {
        if (card.getAttribute('data-job-id') == draggedJob.job.id){
          card.remove();
          break;
        }
      }

      console.log(`${draggedJob.job.id} moved from ${draggedJob.sourceColumnId} to ${targetColumnID}`);
    } catch (error) {
      console.error('Failed to update job status: ', error);
      alert('Failed to move job');
    }

    // Reset dragged job tracking
    draggedJob = { job: null, sourceColumnId: '' };
  });
});

// -------------------
// Toggle the visibility of the Add Job form
// -------------------
document.querySelectorAll('.add-button').forEach(button => {
  button.addEventListener('click', () => {
    const wrapper = button.previousElementSibling.querySelector('.input-wrapper');
    const isHidden = wrapper.style.display === 'none' || wrapper.style.display === '';

    if (isHidden) {
      // Show input form and switch to "Cancel"
      wrapper.style.display = 'flex';
      button.textContent = 'Cancel';
    } else {
      // Hide input form and switch back to "Add Job"
      wrapper.style.display = 'none';
      button.textContent = 'Add Job';
    }
  });
});

// -------------------
// Submit button logic — adds a new job to a column
// -------------------
document.querySelectorAll('.submit-button').forEach(button => {
  button.addEventListener('click', async () => {
    const columnID = button.getAttribute('data-column');
    const inputWrapper = button.parentElement;

    // Get values from input fields
    const title = inputWrapper.querySelector('.job-title').value.trim();
    const company = inputWrapper.querySelector('.company-name').value.trim();
    const date = inputWrapper.querySelector('.date-applied').value.trim();
    const link = inputWrapper.querySelector('.job-link').value.trim();
    const notes = inputWrapper.querySelector('.job-notes')?.value.trim() || '';

    if (title === '') return; // Require a title

    const jobData = {title, company, date, link, notes, status: columnID};

    try {
      const response = await apiCall('/jobs', {
        method: 'POST',
        body: JSON.stringify(jobData)
      });
      const completeJob = {
        id: response.id,
        title: jobData.title,
        company: jobData.company,
        date: jobData.date,
        link: jobData.link,
        notes: jobData.notes,
        status: jobData.status
      }
      const newJobInput = createJobCard(completeJob);
      const column = document.getElementById(columnID);
      column.querySelector('.column-content').insertBefore(newJobInput, column.querySelector('.input-wrapper'));

      inputWrapper.querySelector('.job-title').value = '';
      inputWrapper.querySelector('.company-name').value = '';
      inputWrapper.querySelector('.date-applied').value = '';
      inputWrapper.querySelector('.job-link').value = '';
      if (inputWrapper.querySelector('.job-notes')) {
        inputWrapper.querySelector('.job-notes').value = '';

      }
      button.parentElement.style.display = 'none';

      const addButton = column.querySelector('.add-button');
      addButton.textContent = 'Add Job';
    } catch (error) {
      console.error('Failed to create job:', error);
      alert('Failed to create job card, please try again');
    }

  });
});
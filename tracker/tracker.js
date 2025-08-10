// ----------------------
// Job Tracker Script
// ----------------------

// On page load, retrieve any saved job data from localStorage and render it into the correct columns.
window.addEventListener('DOMContentLoaded', () => {
  const savedData = JSON.parse(localStorage.getItem('jobData')) || {}; // Retrieve saved job data or use empty object
  for (const columnID in savedData) {
    const column = document.getElementById(columnID); // Find the column by its ID
    const jobs = savedData[columnID]; // Get array of jobs for this column
    jobs.forEach(job => {
      const jobCard = createJobCard(job); // Create DOM element for job
      // Insert job card above the input form
      column.querySelector('.column-content').insertBefore(jobCard, column.querySelector('.input-wrapper'));
    });
  }
});

// Track the next unique job ID and store the currently dragged job for drag-and-drop
let nextJobID = 1;
let draggedJob = { job: null, sourceColumnId: '' };

// Creates a new job card element with display and edit modes
function createJobCard(job) {
  if (!job.id) {
    job.id = nextJobID; // Assign ID if not provided
  }

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
  deleteButton.addEventListener('click', () => {
    const column = card.closest('.column');
    const columnId = column.id;
    card.remove(); // Remove from DOM
    removeJobLocalStorage(job.id, columnId); // Remove from storage
  });
  card.appendChild(deleteButton);

  // -------------------
  // Update button logic — saves edits to localStorage and updates the display
  // -------------------
  card.querySelector('.update-button').addEventListener('click', () => {
    const columnId = card.closest('.column').id;
    const originalID = job.id;
    // Update job object from edit form values
    job.title = editDiv.querySelector('.edit-title').value.trim();
    job.company = editDiv.querySelector('.edit-company').value.trim();
    job.date = editDiv.querySelector('.edit-date').value.trim();
    job.link = editDiv.querySelector('.edit-link').value.trim();
    job.notes = editDiv.querySelector('.edit-notes').value.trim();
    titleSpan.textContent = job.title;

    updateJobInLocalStorage(originalID, columnId, job); // Save updates to storage

    // Refresh display with updated info
    displayDiv.innerHTML = `
      <div><strong>Company:</strong> ${job.company || ''}</div>
      <div><strong>Date Applied:</strong> ${job.date || ''}</div>
      <div><strong>Job Link:</strong> <a href="${job.link || '#'}" target="_blank">${job.link || ''}</a></div>
      <div><strong>Notes:</strong> ${job.notes || ''}</div>
    `;
    // Re-add edit button after overwriting display HTML
    const newEditButton = document.createElement('button');
    newEditButton.textContent = 'Edit';
    newEditButton.className = 'edit-button';
    newEditButton.addEventListener('click', (e) => {
      e.stopPropagation();
      displayDiv.style.display = 'none';
      editDiv.style.display = 'block';
    });
    displayDiv.appendChild(newEditButton);

    // Switch back to display mode
    editDiv.style.display = 'none';
    displayDiv.style.display = 'block';
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

  container.addEventListener('drop', () => {
    container.classList.remove('drag-over');
    const targetColumn = container.closest('.column');
    const targetColumnID = targetColumn.id;

    // Prevent dropping if no job is being dragged or dropping into same column
    if (!draggedJob.job) return;
    if (draggedJob.sourceColumnId == targetColumnID) return;

    // Save job in new column
    saveJobToLocalStorage(draggedJob.job, targetColumnID);

    // Create and insert job card into new column
    const newCard = createJobCard(draggedJob.job);
    container.insertBefore(newCard, container.querySelector('.input-wrapper'));

    // Remove job from old column in DOM
    const sourceColumn = document.getElementById(draggedJob.sourceColumnId);
    const cards = sourceColumn.querySelectorAll('.job-card');
    for (let card of cards) {
      if (card.getAttribute('data-job-id') == draggedJob.job.id) {
        card.remove();
        break;
      }
    }

    // Remove from old column in storage
    removeJobLocalStorage(draggedJob.job.id, draggedJob.sourceColumnId);

    // Reset dragged job tracking
    draggedJob = { job: null, sourceColumnId: '' };
  });
});

// -------------------
// Remove a job from localStorage by job ID and column ID
// -------------------
function removeJobLocalStorage(jobID, columnId) {
  const data = JSON.parse(localStorage.getItem('jobData')) || {};
  if (!data[columnId]) return;
  data[columnId] = data[columnId].filter(item => item && item.id !== jobID);
  localStorage.setItem('jobData', JSON.stringify(data));
}

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
  button.addEventListener('click', () => {
    const columnID = button.getAttribute('data-column');
    const inputWrapper = button.parentElement;

    // Get values from input fields
    const title = inputWrapper.querySelector('.job-title').value.trim();
    const company = inputWrapper.querySelector('.company-name').value.trim();
    const date = inputWrapper.querySelector('.date-applied').value.trim();
    const link = inputWrapper.querySelector('.job-link').value.trim();
    const notes = inputWrapper.querySelector('.job-notes')?.value.trim() || '';

    if (title === '') return; // Require a title

    // Create job object
    const job = { id: nextJobID++, title, company, date, link, notes };

    // Create and insert job card into the column
    const newJobInput = createJobCard(job);
    const column = document.getElementById(columnID);
    column.querySelector('.column-content').insertBefore(newJobInput, column.querySelector('.input-wrapper'));

    // Save job to localStorage
    saveJobToLocalStorage(job, columnID);

    // Clear form inputs
    inputWrapper.querySelector('.job-title').value = '';
    inputWrapper.querySelector('.company-name').value = '';
    inputWrapper.querySelector('.date-applied').value = '';
    inputWrapper.querySelector('.job-link').value = '';
    if (inputWrapper.querySelector('.job-notes')) {
      inputWrapper.querySelector('.job-notes').value = '';
    }

    // Hide input form and reset Add Job button text
    button.parentElement.style.display = 'none';
    addButton.textContent = 'Add Job'; // NOTE: `addButton` must exist in outer scope
  });
});

// -------------------
// Save a job to localStorage under the given column ID
// -------------------
function saveJobToLocalStorage(job, columnID) {
  const data = JSON.parse(localStorage.getItem('jobData')) || {};
  if (!data[columnID]) {
    data[columnID] = [];
  }
  data[columnID].push(job);
  localStorage.setItem('jobData', JSON.stringify(data));
}

// -------------------
// Update an existing job in localStorage
// -------------------
function updateJobInLocalStorage(jobID, columnId, updatedJob) {
  const data = JSON.parse(localStorage.getItem('jobData')) || {};
  if (!data[columnId]) {
    return;
  }
  const jobIndex = data[columnId].findIndex(job => job.id === jobID);
  if (jobIndex !== -1) {
    data[columnId][jobIndex] = updatedJob;
    localStorage.setItem('jobData', JSON.stringify(data));
  }
}

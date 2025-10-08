const API_BASE_URL = "http://localhost:3000";

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

let draggedJob = { job: null, sourceColumnId: '' };

function createJobCard(job) {

  const card = document.createElement('div');
  card.className = 'job-card';
  card.setAttribute('draggable', 'true');
  card.setAttribute('data-job-id', job.id);

  const titleSpan = document.createElement('span');
  titleSpan.className = 'job-title';
  titleSpan.textContent = job.title;
  card.appendChild(titleSpan);

  const displayDiv = document.createElement('div');
  displayDiv.className = 'job-details';
  const dateLabel = job.status === 'saved' ? 'Date Saved:' : 'Date Applied:';
  displayDiv.innerHTML = `
    <div><strong>Company:</strong> ${job.company || ''}</div>
    <div><strong>${dateLabel}</strong> ${job.date || ''}</div>
    <div><strong>Job Link:</strong> <a href="${job.link || '#'}" target="_blank" class="job-link">${job.link ? 'View Job Posting' : 'No link'}</a></div>
    <div><strong>Notes:</strong> ${job.notes || ''}</div>
  `;

  const editDiv = document.createElement('div');
  editDiv.className = 'job-details';
  editDiv.style.display = 'none';
  editDiv.innerHTML = `
    <label><strong>Position:</strong><br><input type="text" class="edit-title" value="${job.title || ''}" /></label><br>
    <label><strong>Company:</strong><br><input type="text" class="edit-company" value="${job.company || ''}" /></label><br>
    <label><strong>Applied:</strong><br><input type="date" class="edit-date" value="${job.date || ''}" /></label><br>
    <label><strong>Link:</strong><br><input type="url" class="edit-link" value="${job.link || ''}" /></label><br>
    <label><strong>Notes:</strong><br><textarea class="edit-notes">${job.notes || ''}</textarea></label><br>
    <button class="update-button">Update</button>
    <button class="cancel-button">Cancel</button>
  `;

  const editButton = document.createElement('button');
  editButton.textContent = 'Edit';
  editButton.className = 'edit-button';
  editButton.addEventListener('click', (e) => {
    e.stopPropagation();
    displayDiv.style.display = 'none';
    editDiv.style.display = 'block';
  });
  displayDiv.appendChild(editButton);

  card.appendChild(displayDiv);
  card.appendChild(editDiv);

  card.addEventListener('click', (e) => {
    if (e.target.closest('button')) return;
  });

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
      const dateLabel = job.status === 'saved' ? 'Date Saved:' : 'Date Applied:';
      displayDiv.innerHTML = `
        <div><strong>Company:</strong> ${job.company || ''}</div>
        <div><strong>${dateLabel}</strong> ${job.date || ''}</div>
        <div><strong>Job Link:</strong> <a href="${job.link || '#'}" target="_blank" class="job-link">${job.link ? 'View Job Posting' : 'No link'}</a></div>
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

  card.querySelector('.cancel-button').addEventListener('click', () => {
    editDiv.querySelector('.edit-title').value = job.title || '';
    editDiv.querySelector('.edit-company').value = job.company || '';
    editDiv.querySelector('.edit-date').value = job.date || '';
    editDiv.querySelector('.edit-link').value = job.link || '';
    editDiv.querySelector('.edit-notes').value = job.notes || '';
    editDiv.style.display = 'none';
    displayDiv.style.display = 'block';
  });

  card.addEventListener('dragstart', () => {
    draggedJob.job = job;
    draggedJob.sourceColumnId = card.closest('.column').id;
  });

  return card;
}

document.querySelectorAll('.column-content').forEach(container => {
  container.addEventListener('dragover', event => {
    event.preventDefault();
    container.classList.add('drag-over');
  });

  container.addEventListener('dragleave', () => {
    container.classList.remove('drag-over');
  });

  container.addEventListener('drop', async () => {
    container.classList.remove('drag-over');
    const targetColumn = container.closest('.column');
    const targetColumnId = targetColumn.id;

    if (!draggedJob.job) return;
    if (draggedJob.sourceColumnId == targetColumnId) return;

    try {
      await apiCall(`/jobs/${draggedJob.job.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...draggedJob.job,
          status: targetColumnId
        })
      });

      draggedJob.job.status = targetColumnId;

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

      console.log(`${draggedJob.job.id} moved from ${draggedJob.sourceColumnId} to ${targetColumnId}`);
    } catch (error) {
      console.error('Failed to update job status: ', error);
      alert('Failed to move job');
    }

    draggedJob = { job: null, sourceColumnId: '' };
  });
});

document.querySelectorAll('.add-button').forEach(button => {
  button.addEventListener('click', () => {
    const wrapper = button.previousElementSibling.querySelector('.input-wrapper');
    const isHidden = wrapper.style.display === 'none' || wrapper.style.display === '';

    if (isHidden) {
      wrapper.style.display = 'flex';
      button.textContent = 'Cancel';
    } else {
      wrapper.style.display = 'none';
      button.textContent = 'Add Job';
    }
  });
});

document.querySelectorAll('.submit-button').forEach(button => {
  button.addEventListener('click', async () => {
    const columnId = button.getAttribute('data-column');
    const inputWrapper = button.parentElement;

    const title = inputWrapper.querySelector('.job-title').value.trim();
    const company = inputWrapper.querySelector('.company-name').value.trim();
    const date = inputWrapper.querySelector('.date-applied').value.trim();
    const link = inputWrapper.querySelector('.job-link').value.trim();
    const notes = inputWrapper.querySelector('.job-notes')?.value.trim() || '';

    if (title === '') return;

    const jobData = {title, company, date, link, notes, status: columnId};

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
      const column = document.getElementById(columnId);
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
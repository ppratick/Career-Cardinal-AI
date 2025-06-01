window.addEventListener('DOMContentLoaded', () => {
    const savedData = JSON.parse(localStorage.getItem('jobData')) || {};
    for (const columnID in savedData) {
        const column = document.getElementById(columnID);
        const jobTitles = savedData[columnID];
        jobTitles.forEach(title => {
        const jobCard = createJobCard(title);
        column.querySelector('.column-content').insertBefore(jobCard, column.querySelector('.input-wrapper'));
     });
    }
});

function createJobCard(title) {
    const card = document.createElement('div');
    card.className = 'job-card';
    card.textContent = title;
    return card;
}

document.querySelectorAll('.add-button').forEach(button => {
  button.addEventListener('click', () => {
    const wrapper = button.previousElementSibling.querySelector('.input-wrapper');
    wrapper.style.display = wrapper.style.display === 'none' ? 'flex' : 'none';
  });
});

document.querySelectorAll('.submit-button').forEach(button => {
  button.addEventListener('click', () => {
    const columnID = button.getAttribute('data-column');
    const input = button.previousElementSibling;
    const jobTitle = input.value.trim();
    if (jobTitle === '') return;

    const newJobInput = document.createElement('div');
    newJobInput.className = 'job-card';
    newJobInput.textContent = jobTitle;

    const column = document.getElementById(columnID);
    column.querySelector('.column-content').insertBefore(newJobInput, column.querySelector('.input-wrapper'));

    saveJobToLocalStorage(jobTitle, columnID);

    input.value = '';
    button.parentElement.style.display = 'none';
  });
});

function saveJobToLocalStorage(jobTitle, columnID) {
    const data = JSON.parse(localStorage.getItem('jobData')) || {};
    if (!data[columnID]) {
        data[columnID] = [];
    }
    data[columnID].push(jobTitle)
    localStorage.setItem('jobData', JSON.stringify(data));
}

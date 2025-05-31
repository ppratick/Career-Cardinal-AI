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

    input.value = '';
    button.parentElement.style.display = 'none';
  });
});
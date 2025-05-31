document.querySelectorAll('.addButton').forEach(button => {
    button.addEventListener('click', () => {
        const wrapper = button.previousElementSibling;
        wrapper.style.display = wrapper.style.display === 'none' ? 'flex' : 'none';
    });
});


document.querySelectorAll('.submitButton').forEach(button => {
    button.addEventListener('click', () => {
        const columnID = button.getAttribute('data-column');
        const input = button.previousElementSibling;
        const jobTitle = input.value.trim();
        if (jobTitle === '') return;

        const newJobInput = document.createElement('div');
        newJobInput.className = 'jobCard';
        newJobInput.textContent = jobTitle;

        const column = document.getElementById(columnID);
        column.insertBefore(newJobInput, column.querySelector('.inputWrapper'));

        input.value = '';
        button.parentElement.style.display = 'none';


    });
});



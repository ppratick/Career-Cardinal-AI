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

let draggedJob = { title: '', sourceColumnId: ''};

function createJobCard(title) {
    const card = document.createElement('div');
    card.className = 'job-card';
    // set draggable = true
    card.setAttribute('draggable', 'true')

    const titleSpan = document.createElement('span');
    titleSpan.textContent = title;
    card.appendChild(titleSpan);


    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-button';
    deleteButton.textContent = 'X';
    deleteButton.addEventListener('click', () => {
      const column = card.closest('.column');
      const columnId = column.id;
      card.remove();
      removeJobLocalStorage(title, columnId);
    });

    card.appendChild(deleteButton);

    dragstart.addEventListener('dragstart', () =>{ /////////
         draggedJob.title = title;
         draggedJob.sourceColumnId = card.closest('.columnId');
    });
    // add event listener for dragstart:
      // - set draggedJob.title to title 
      // - set draggedJob.sourceColumnId to column id (using closest)
    return card;
}



// for(const card in columnId) { /////
//   dragover.addEventListener('click', () =>{
//     event.preventDefault();
//     container.classList.add('drag-over');
//   });
//   dragleave.addEventListener('click', () => {
//     classList.remove('drag-over');
//   });

//   dragdrop.addEventListener('click', () => {
//     classList.remove('drag-over');
//     const columnId = columnId;
//     if(!title) return;
//     if (sourceColumnId === columnId) return;

//   })
// }

document.querySelectorAll('.column-content').forEach(container => {
  container.addEventListener('dragover', event => {
  event.preventDefault();
  container.classList.add('drag-over');
  });

  container.addEventListener('dragleave', () => {
    container.classList.remove('drag-over');
  });

  container.addEventListener('drop', () => {
    container.classList.remove('drag-over');
    const targetColumn = container.closest('.column');
    const targetColumnID = targetColumn.id;
    if(!draggedJob.title) return;
    if(draggedJob.sourceColumnId == targetColumnID) return;
    const sourceColumn = document.getElementById(draggedJob.sourceColumnId);
    const cards = sourceColumn.querySelectorAll('.job-card');
    for(let card of cards){
      if (card.querySelector('span')?.textContent === draggedJob.title) {
        card.remove();
        break;
      }
    }
    removeJobLocalStorage(draggedJob.title, draggedJob.sourceColumnId);
    const newCard = createJobCard(draggedJob.title);
    container.insertBefore(newCard, container.querySelectorAll('.input-wrapper'));
    saveJobToLocalStorage(draggedJob.title, targetColumnID);
    draggedJob = {title: '', sourceColumnId: ''};
    

  });

});

// for each column-content elememnt: 
  // - add event listen for 'dragover':
    // - prevent default (so drop is allowed) "event.preventDefault();"
    // - add class for visual feedback (container.classList.add('drag-over'))

  // - add event listener for 'dragleave' 
    // remove visual feedback class

  // add event listener for drop
    // remove visual feedback after drop
    // get columnId of of what we're dropping into 
    // if dragged job title is empty return it
    // if sourceColumnId = dropped columnId then return

    // Remove job from source column in DOM
    // get all cards in source column 
    // for each card if card title matches dragged card title remove previous card 

    // Remove job from source column in local storage 
    // Call removeJobLocalStorage (set title and columnId to draggedJob)

    // Add job to new column 
    // Create new job card by using createJobCard and pass in draggedJob.title
    // insert it before the input-wrapper inside the target column-content
    
    // Save to new column in localstorage
    // Call saveJobToLocalStorage and pass in draggedJob.title and droppedColumnId

    // Clear dragged job 
    // draggedJob = { title: '', sourceColumnId: ''};
function removeJobLocalStorage(title, columnId){
    const data = JSON.parse(localStorage.getItem('jobData')) || {};
    if (!data[columnId]) return;
    data[columnId] = data[columnId].filter(item => item !== title);
    localStorage.setItem('jobData', JSON.stringify(data));
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

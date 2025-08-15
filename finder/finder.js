function toggleFilters() {
  const panel = document.getElementById('filterPanel');
  panel.style.display = (panel.style.display === 'flex') ? 'none' : 'flex';
};
const filterButton = document.createElement('button');
  filterButton.className = 'filter-button';
  filterButton.addEventListener('click', () => {
    toggleFilters();
  });
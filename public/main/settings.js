document.getElementById('settingsButton').addEventListener('click', function() {
  document.getElementById('settingsModal').style.display = 'flex';
});

document.getElementById('settingsModal').addEventListener('click', function(event) {
  if (event.target === this) {
    this.style.display = 'none';
  }
});

//ADDING OBJECTS MODAL
document.getElementById("add-object").addEventListener("click", function() {
  showAddObjectModal();
});

function showAddObjectModal() {
  let modal = document.getElementById("new-object-modal");
  if (!modal) {
    console.log("Modal element not found"); // add log if modal element is not found
    return;
  }

  // Show the modal
  modal.style.display = "flex";

  modal.addEventListener("click", function(event) {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  });
  
}


//LOADING ALL OBJECTS MODAL

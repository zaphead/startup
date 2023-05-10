//MODAL POPUP SCRIPTS

// Get the modal dialog box
var modal = document.getElementById("myModal");

// Get the text button elements
var buttons = document.querySelectorAll('.text-button[business="yes"]');


var businessContent = document.querySelector(".business-content")

// Add event listener to each button
for (var i = 0; i < buttons.length; i++) {
  buttons[i].addEventListener("click", function() {
    // Show the modal
    modal.style.display = "flex";

    // Get the text content of the clicked button and set it as the modal title
    var buttonText = this.textContent;
    var modalTitle = document.getElementById("modal-title");
    modalTitle.textContent = buttonText;
    businessContent.setAttribute("data-placeholder", this.textContent + " information");
  });
}

// Hide modal when clicking outside of it
window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
}


//PROCESS FLOWCHART SCRIPTS
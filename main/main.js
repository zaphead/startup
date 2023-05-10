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

// Get the Add Step button
var addStepButton = document.querySelector(".click-button");

// Get the parent container
var cardGroup = document.querySelector(".card-group");

// Add event listener to the Add Step button
addStepButton.addEventListener("click", function() {
  // Create a new card container div
  var newCardContainer = document.createElement("div");
  newCardContainer.classList.add("card-container");

  // Copy the HTML of the card container div to the new div
  newCardContainer.innerHTML = document.querySelector(".card-container").innerHTML;

  // Insert the new card container div before the Add Step button
  cardGroup.insertBefore(newCardContainer, addStepButton);
});


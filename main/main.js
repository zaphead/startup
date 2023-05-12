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
//ANALYZE MODAL
const analyzeButton = document.querySelector('.analyze');
const analyzeModal = document.getElementById('modal-analyze');
const closeButton = document.querySelector('.modal-button');
const overlayButton = document.getElementById('modal-analyze')

analyzeButton.addEventListener('click', function() {
  analyzeModal.style.display = 'block';
});

closeButton.addEventListener('click', function() {
  analyzeModal.style.display = 'none';
});

window.onclick = function(event) {
  if (event.target == overlayButton) {
    analyzeModal.style.display = "none";
  }
}


// JSON PARSING AND RENDERING
fetch('client_acquisition.json')
  .then((response) => response.json())
  .then((jsonData) => {
    // jsonData is the JavaScript object containing the data from the JSON file
    // Assign the jsonData to the data variable
    const data = jsonData;

    parseData(data);
  })
  .catch((error) => {
    console.error('Error fetching data from JSON file:', error);
  });

function parseData(data) {
  // Get the container element
  const container = document.querySelector('.main-section');

  // Create the card wrapper
  const cardWrapper = document.createElement('div');
  cardWrapper.classList.add('card-wrapper');
  container.appendChild(cardWrapper);

  // Create the steps container
  const stepsContainer = document.createElement('div');
  stepsContainer.classList.add('steps-container');
  cardWrapper.appendChild(stepsContainer);

  // Function to render a step
  function renderStep(step, index, stepsContainer) {
    // Create the card container
    const cardContainer = document.createElement('div');
    cardContainer.classList.add('card-container');

    // Create the content container
    const contentContainer = document.createElement('div');
    contentContainer.classList.add('content-container');
    cardContainer.appendChild(contentContainer);

    // Create the card
    const card = document.createElement('div');
    card.classList.add('card');
    contentContainer.appendChild(card);

    // Create the process title
    const processTitle = document.createElement('div');
    processTitle.classList.add('process-title');
    processTitle.contentEditable = true;
    processTitle.dataset.placeholder = 'Process title';
    processTitle.textContent = step.title;
    card.appendChild(processTitle);

    // Create the process content
    const processContent = document.createElement('div');
    processContent.classList.add('process-content');
    processContent.contentEditable = true;
    processContent.dataset.placeholder = 'Process content';
    processContent.textContent = step.description;
    card.appendChild(processContent);

    // Create the arrow buttons
    const arrowButtons = document.createElement('div');
    arrowButtons.classList.add('arrow-buttons');
    contentContainer.appendChild(arrowButtons);

    // Create the up button
    if (index > 0) {
      const upButton = document.createElement('button');
      upButton.classList.add('up-button');
      upButton.innerHTML = '&#8593;';
      arrowButtons.appendChild(upButton);

      // Add event listener to the up button
      upButton.addEventListener('click', () => {
        // Swap the nodes in the data object
        [data.process[index], data.process[index - 1]] = [data.process[index - 1], data.process[index]];

        // Re-render the steps
        renderSteps();
      });
    }

    // Create the down button
    if (index < data.process.length - 1) {
      const downButton = document.createElement('button');
      downButton.classList.add('down-button');
      downButton.innerHTML = '&#8595;';
      arrowButtons.appendChild(downButton);

      // Add event listener to the down button
      downButton.addEventListener('click', () => {
        // Swap the nodes in the data object
        [data.process[index], data.process[index + 1]] = [data.process[index + 1], data.process[index]];

        // Re-render the steps
        renderSteps();
      });
    }

    // Create the arrow image
    const arrowImg = document.createElement('img');
    arrowImg.classList.add('arrowimg');
    arrowImg.height = '30';
    arrowImg.src = '../Images/down_arrow.png';

    // Create the arrow image container
    const arrowImageContainer = document.createElement('div');
       arrowImageContainer.classList.add('arrow-image-container');
    arrowImageContainer.appendChild(arrowImg);

    // Append the card container to the steps container
    cardContainer.appendChild(contentContainer);
    cardContainer.appendChild(arrowImageContainer);
    stepsContainer.appendChild(cardContainer);
  }

  // Function to render all steps
  function renderSteps() {
    // Remove all child elements of the stepsContainer
    while (stepsContainer.firstChild) {
      stepsContainer.removeChild(stepsContainer.firstChild);
    }

    // Re-render the steps
    data.process.forEach((step, i) => {
      renderStep(step, i, stepsContainer);
    });
  }

  // Render the initial steps
  renderSteps();

  // Create the "Add Step" button
  const addStepButton = document.createElement('button');
  addStepButton.classList.add('click-button');
  addStepButton.textContent = 'Add Step';
  cardWrapper.appendChild(addStepButton);

  // Event handler for the "Add Step" button
  addStepButton.addEventListener('click', () => {
    // Create a new step object
    const newStep = { title: 'New Step', description: 'This is a new step' };

    // Add the new step to the data object
    data.process.push(newStep);

    // Re-render the steps
    renderSteps();
  });
}






//SAVING DATA PROGRAM

function saveDataAndRerender() {
  // Save the data to a JSON file
  saveDataToFile(data);

  // Re-render the steps
  renderSteps();
}

function saveDataToFile(data) {
  const jsonData = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonData], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const downloadLink = document.createElement('a');
  downloadLink.href = url;
  downloadLink.download = 'client_acquisition_updated.json';
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
}

// Create the process title
const processTitle = document.createElement('div');
processTitle.classList.add('process-title');
processTitle.contentEditable = true;
processTitle.dataset.placeholder = 'Process title';
processTitle.textContent = step.title;
card.appendChild(processTitle);

// Listen for changes in the process title
processTitle.addEventListener('input', () => {
  data.process[index].title = processTitle.textContent;
  saveDataAndRerender();
});
processTitle.addEventListener('blur', () => {
  data.process[index].title = processTitle.textContent;
  saveDataAndRerender();
});

// Create the process content
const processContent = document.createElement('div');
processContent.classList.add('process-content');
processContent.contentEditable = true;
processContent.dataset.placeholder = 'Process content';
processContent.textContent = step.description;
card.appendChild(processContent);

// Listen for changes in the process content
processContent.addEventListener('input', () => {
  data.process[index].description = processContent.textContent;
  saveDataAndRerender();
});
processContent.addEventListener('blur', () => {
  data.process[index].description = processContent.textContent;
  saveDataAndRerender();
});

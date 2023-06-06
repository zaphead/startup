import { loadingPhrases } from './loadingSequence.js';
import { interpretJSON, exportButton, modalHeaderText, modalTextContent, modalText, fetchProcessData } from './jsonImportExport.js';




var modal = document.getElementById("myModal");
var buttons = document.querySelectorAll('.text-button[business="yes"]');
var businessContent = document.querySelector(".business-content");

const TEST_PUBLISHABLE_KEY = 'pk_test_51NC96zIMorCkqLBZJhKJxgPJwsODTXaNccmfsr3Sk7sXwmg4AkTezs4mu5ZbJzYCJRuFIolLWuNq91utRL3fzF9C00aQHJ9ulq';


const stripePublishableKey = TEST_PUBLISHABLE_KEY;

for (var i = 0; i < buttons.length; i++) {
  buttons[i].addEventListener("click", function() {
    modal.style.display = "flex";
    var buttonText = this.textContent;
    var modalTitle = document.getElementById("modal-title");
    modalTitle.textContent = buttonText;
    businessContent.setAttribute("data-placeholder", buttonText + " information");
  });
}

modal.addEventListener("click", function(event) {
  if (event.target === modal) {
    modal.style.display = "none";
  }
});



//ANALYZE MODAL
const analyzeButton = document.querySelector('.analyze');
const analyzeModal = document.getElementById('modal-analyze');
const closeButton = document.querySelector('.modal-button');
const overlayButton = document.getElementById('modal-analyze')

analyzeButton.addEventListener('click', function() {
  analyzeModal.style.display = 'flex';
});

closeButton.addEventListener('click', function() {
  analyzeModal.style.display = 'none';
});


//ANALYZE MODAL IMAGE SWITCHER
// get the select dropdown
let personaSelect = document.getElementById('persona-select');

personaSelect.addEventListener('change', function() {
  let selectedValue = this.value;
  let imageFileName = selectedValue.replace(' ', '') + '.png';
  let imagePath = `../Images/people/${imageFileName}`;
  let personaTip = document.getElementById('persona-info');

  let personaImage = document.getElementById('persona-image');

  // add the fade-out class to start the animation
  personaImage.classList.add('fade-out');

  // after the transition ends, update the image source and remove the fade-out class
  personaImage.addEventListener('transitionend', function handler() {
    personaImage.src = imagePath;
    personaImage.classList.remove('fade-out');

    // remove the event handler after it runs once, to prevent it from running multiple times
    personaImage.removeEventListener('transitionend', handler);
  });
});





//DIALOGUE MODAL
// Get the necessary elements
const addProcessBtn = document.getElementById('add-process');
const modalDialogue = document.getElementById('modal-dialogue');
const addObjectBtn = document.getElementById('add-object');


// Add click event listener to the modal dialogue to close it when clicked outside
modalDialogue.addEventListener('click', (event) => {
  // Check if the clicked element is the modal content itself
  if (event.target === modalDialogue) {
    // Hide the modal dialogue
    modalDialogue.style.display = 'none';
  }
});



//NAME PLACEHOLDER & AUTHORIZER
async function fetchAuthenticatedUser() {
try {
  const response = await fetch('/api/user/name');
  if (response.ok) {
    const data = await response.json();
    return { status: 'authorized', name: data.name };
  } else if (response.status === 401) {
    return { status: 'unauthorized' };
  } else {
    throw new Error('Failed to fetch user name');
  }
} catch (error) {
  console.error('Error fetching user name:', error);
  return null;
}
}


// Update the user's name in the HTML
async function updateAuthenticatedUser() {
  const authenticatedUserElement = document.getElementById("authenticated-user");

  const response = await fetchAuthenticatedUser();
  if (response && response.status === 'authorized') {
    authenticatedUserElement.textContent = response.name;
    authenticatedUserElement.style.display = 'block';
  } else if (response && response.status === 'unauthorized') {
    // Redirect to the login page
    window.location.href = "/index.html";
  } else {
    authenticatedUserElement.textContent = 'Unknown User';
    authenticatedUserElement.style.display = 'none';
  }
}

updateAuthenticatedUser();

const businessInfoMap = {
  'business_name': '',
  'target_market': '',
  'product': '',
  'stage': '',
  'hours': '',
  'experience': '',
};


let currentId = null;

function openModal(title, content, id) {
  currentId = id;
  document.getElementById('modal-title').textContent = title;

  // Update this line to render fetched content
  document.getElementById('modal-content').textContent = businessInfoMap[id] || '';
  
  document.getElementById('myModal').style.display = 'flex';
}


document.querySelectorAll('.text-button[business="yes"]').forEach((button) => {
  button.addEventListener('click', (event) => {
    const id = button.id;
    const title = button.getAttribute('data-title');
    const content = businessInfoMap[id];
    openModal(title, content, id);
  });
});

function closeModal() {
  document.getElementById('myModal').style.display = 'none';
}

window.onclick = function (event) {
  if (event.target === modal && savingInProgress === false) {
    // closeModal();
  } else if (event.target === overlayButton) {
    analyzeModal.style.display = "none";
  }
};

async function fetchBusinessInfo() {
  try {
    const response = await fetch('/api/user');
    const data = await response.json();

    if (response.ok) {
      const businessInfo = data.user.businessInfo;
      if (!businessInfo) {
        console.error('Business info not found in the response data');
        return;
      }

      businessInfoMap['business_name'] = businessInfo.business_name;
      businessInfoMap['target_market'] = businessInfo.target_market;
      businessInfoMap['product'] = businessInfo.product;
      businessInfoMap['stage'] = businessInfo.stage;
      businessInfoMap['hours'] = businessInfo.hours;
      businessInfoMap['experience'] = businessInfo.experience;
    } else {
      console.error('Error retrieving business info:', data.error);
    }
  } catch (error) {
    console.error('Error fetching business info:', error);
  }
}


fetchBusinessInfo();






async function updateBusinessInfo(key, content) {
  try {
    const response = await fetch('/api/update-business-info', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ key, content }),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to update business info');
    }

    const result = await response.json();

    if (result.success) {
      console.log('Business info updated successfully');
    } else {
      console.error('Error updating business info');
    }
  } catch (error) {
    console.error('Error updating business info:', error);
  }
}



document.getElementById('modal-content').addEventListener('input', (event) => {
  let content = event.target.textContent;
  businessInfoMap[currentId] = content;
});

document.getElementById('myModal').addEventListener('click', async (event) => {
  if (event.target === modal && contentChanged) {
    savingInProgress = true;
    clearTimeout(saveTimeout);
    let content = businessInfoMap[currentId] || ''; // Use an empty string if the content is null
    const saveSuccess = await saveBusinessInfo(currentId, content); // Get the save success status
    if (saveSuccess) {
      await showToast('Saved!', 1000); // Wait for the 'Saved!' toast to finish
      closeModal();
      savingInProgress = false;
      contentChanged = false;
    } else {
      showToast('Error saving. Please try again.', 2000);
      savingInProgress = false;
    }
  } else if (event.target === modal && !contentChanged) {
    closeModal(); // Close the modal if there were no changes
  }
});




const saveDelay = 500;
let saveTimeout;
let contentChanged = false;
let savingInProgress = false;

async function saveBusinessInfo(key, content) {
  try {
    const response = await fetch('/api/update-business-info', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ key: key.replace('-', '_'), content })
    });

    if (!response.ok) {
      throw new Error('Error updating business info');
    }

    console.log('Business info updated successfully');
    return true; // Indicate the update was successful
  } catch (error) {
    console.error('Error saving business info:', error);
    return false; // Indicate the update failed
  }
}


document.getElementById('modal-content').addEventListener('input', (event) => {
  clearTimeout(saveTimeout);
  contentChanged = true;
  let id = document.querySelector('.text-button.selected').id;
  let content = event.target.textContent;
  businessInfoMap[id] = content;

  saveTimeout = setTimeout(async () => {
    await saveBusinessInfo(id, content);
  }, saveDelay);
});

let currentToast = null;
let processEditor = null;


//RENDERING FLOWCHART
class ProcessEditor {
  constructor(processName) {
    if (processEditor) {
      processEditor.processName = processName;
      processEditor.fetchProcess();
      return processEditor;
    }
    
    console.log("ProcessEditor is being instantiated with processName: ", processName);
    this.processName = processName;
    this.process = null;
    this.fetchProcess();
    
    processEditor = this;
  }
  fetchProcess = () => {
    console.log("fetchProcess is being called with processName: ", this.processName); // Log when fetchProcess method is called
    fetch(`/api/user/processes/${this.processName}`)
      .then(response => {
        console.log('Fetch Process Response:', response.status, response.body); // Log the fetch response
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(json => {
        console.log('Received process:', json.process); // Log the fetched process
        this.process = json.process;
        this.renderProcess();
      })
      .catch(e => {
        console.error('An error occurred fetching the process data:', e);
        throw e;
      });
  }

  handleMoveStepUp = (event) => {
    const stepIndex = Number(event.target.dataset.id);
    if (stepIndex === 0) {
      // If it's the first step, it cannot move up
      return;
    }
    [this.process[stepIndex - 1], this.process[stepIndex]] = [this.process[stepIndex], this.process[stepIndex - 1]];
    
    this.unsavedChanges = true;
    if (this.saveTimeout !== null) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => this.saveChanges(), 1500);
  
    this.renderProcess();
  }
  
  handleMoveStepDown = (event) => {
    const stepIndex = Number(event.target.dataset.id);
    if (stepIndex === this.process.length - 1) {
      // If it's the last step, it cannot move down
      return;
    }
    [this.process[stepIndex + 1], this.process[stepIndex]] = [this.process[stepIndex], this.process[stepIndex + 1]];
    
    this.unsavedChanges = true;
    if (this.saveTimeout !== null) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => this.saveChanges(), 1500);
  
    this.renderProcess();
  }
  
  

  renderProcess = () => {
    console.log('Rendering process:', this.process); // Log when rendering begins
    const mainSection = document.querySelector('.main-section .steps-container');
    mainSection.innerHTML = '';

    this.process.forEach((step, index) => {
      const card = document.createElement('div');
      card.classList.add('card-container');
      card.innerHTML = `
        <div class="content-container">
          <div class="delete-process secondary-button" data-id="${index}">
            <img class="image-icon-button" src="../Images/icons/trash.svg">
          </div>
          <div class="card">
            <div class="process-title" contenteditable="true" data-placeholder="Step Title" data-id="${index}">${step.title}</div>
            <div class="process-content" contenteditable="true" data-placeholder="Step Description" data-id="${index}">${step.description}</div>
          </div>
          <div class="arrow-buttons">
          <button class="up-button main-button" data-id="${index}">&#8593;</button>
          <button class="down-button main-button" data-id="${index}">&#8595;</button>
        </div>
        </div>
        <div class="arrow-image-container">
          <img class="arrowimg" height="30" src="../Images/down_arrow.png" />
        </div>
      `;
      if (index === 0) {
        card.querySelector('.up-button').style.display = 'none';
      }
      if (index === this.process.length - 1) {
        card.querySelector('.down-button').style.display = 'none';
      }
      
      card.querySelector('.up-button').addEventListener('click', this.handleMoveStepUp);
      card.querySelector('.down-button').addEventListener('click', this.handleMoveStepDown);

      mainSection.appendChild(card);
    });

    const editableElements = mainSection.querySelectorAll('[contenteditable]');
    editableElements.forEach(element => {
      element.addEventListener('input', this.handleTyping);
    });

    const deleteButtons = mainSection.querySelectorAll('.delete-process');
    deleteButtons.forEach(button => {
      button.addEventListener('click', this.handleDeleteStep);
    });
  }

  handleTyping = (event) => {
    const textContent = event.target.textContent;
    const stepIndex = event.target.dataset.id;
    const field = event.target.classList.contains('process-title') ? 'title' : 'description';

    this.process[stepIndex][field] = textContent;
    this.unsavedChanges = true;

    if (this.saveTimeout !== null) {
      clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = setTimeout(() => saveProcess(this), 1500);
  }

  handleDeleteStep = (event) => {
    let stepIndex;
    if (event.target.tagName === 'IMG') {
      stepIndex = event.target.parentNode.dataset.id;
    } else {
      stepIndex = event.target.dataset.id;
    }
    this.process.splice(stepIndex, 1);
    this.unsavedChanges = true;
  
    if (this.saveTimeout !== null) {
      clearTimeout(this.saveTimeout);
    }
  
    this.saveChanges();
    this.renderProcess();
  }
  

  saveChanges = () => {
    return fetch(`/api/user/processes/${this.processName}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(this.process),
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        this.unsavedChanges = false;
        return true;
      })
      .catch(e => {
        console.error('An error occurred saving the process data:', e);
        throw e;
      });
  }

  addStep = () => {
    this.process.push({
      title: '',
      description: ''
    });

    this.unsavedChanges = true;

    if (this.saveTimeout !== null) {
      clearTimeout(this.saveTimeout);
    }

    this.saveChanges();
    this.renderProcess();
  }

  warnBeforeClosing = (event) => {
    if (this.unsavedChanges) {
      event.preventDefault();
      event.returnValue = 'You have unsaved changes. Do you really want to leave?';
    }
  }
}

function showProcessEditor(processName) {
  if (currentProcessEditor && currentProcessEditor.unsavedChanges) {
    saveProcess(currentProcessEditor);
  }

  currentProcessEditor = new ProcessEditor(processName);
  addButton.style.display = 'block';
  introSplash.style.display = 'none';
  toolbar.style.display = 'flex';

  // Remove 'button-highlight' from all buttons
  document.querySelectorAll('#processes_div .text-button').forEach(button => {
    button.classList.remove('button-highlight');
  });

  // Add 'button-highlight' to the clicked button
  const button = document.getElementById(processName);
  if (button) {
    button.classList.add('button-highlight');
  }

  //Set the toolbar title to the process name


  // Store the selected process in sessionStorage
  sessionStorage.setItem('selectedProcess', processName);
}

async function saveProcess(processEditor) {
  if (!processEditor.unsavedChanges) {
    return;
  }

  // showToast('Saving...', 2000);
  const saveSuccess = await processEditor.saveChanges();
  if (saveSuccess) {
    showToast('Process saved!', 2000);
  } else {
    showToast('Error saving process. Please try again.', 2000);
  }
}

// Initial load of page
const addButton = document.querySelector('.click-button');
const introSplash = document.getElementById('introSplash');
const toolbar = document.getElementById('toolbar')

let currentProcessEditor = null;

window.addEventListener('beforeunload', (event) => {
  if (currentProcessEditor && currentProcessEditor.unsavedChanges) {
    event.preventDefault();
    event.returnValue = 'You have unsaved changes. Do you want to leave?';
    saveProcess(currentProcessEditor);
  }
});

document.querySelectorAll('#processes_div .text-button').forEach((link) => {
  link.addEventListener('click', (event) => {
    console.log('text-button clicked'); // Log when a button is clicked
    event.preventDefault();
    if (currentProcessEditor && currentProcessEditor.unsavedChanges) {
      saveProcess(currentProcessEditor);
    }
    currentProcessEditor = new ProcessEditor(event.target.id);
    currentProcessEditor.fetchProcess();
    addButton.style.display = 'block';
    introSplash.style.display = 'none';

    // Remove 'button-highlight' from all buttons
    document.querySelectorAll('#processes_div .text-button').forEach(button => {
      button.classList.remove('button-highlight');
    });

    // Add 'button-highlight' to the clicked button
    event.target.classList.add('button-highlight');
  });
});

document.querySelector('.click-button').addEventListener('click', () => {
  if (currentProcessEditor) {
    currentProcessEditor.addStep();
  } else {
    showToast('Please select a process first.', 2000);
  }
});


//TOAST FUNCTIONS

function showToast(message, duration = 3000) {
  return new Promise((resolve) => {
    if (currentToast) {
      currentToast.classList.add('slide-out');
      setTimeout(() => {
        currentToast.remove();
        showNewToast(message, duration, resolve); // Show the new toast after removing the previous one
      }, 500);
    } else {
      showNewToast(message, duration, resolve); // Show the new toast directly if there is no previous one
    }
  });
}

function showNewToast(message, duration, resolve) {
  const toast = document.createElement('div');
  toast.classList.add('toast');
  toast.textContent = message;
  document.body.appendChild(toast);

  currentToast = toast;

  setTimeout(() => {
    toast.classList.remove('slide-out');
  }, 10);

  setTimeout(() => {
    toast.classList.add('slide-out');
    setTimeout(() => {
      toast.remove(); // Remove the toast after the specified duration
      currentToast = null; // Reset the current toast
      resolve(); // Resolve the promise
    }, 500);
  }, duration);
}


//TOOLTIPS
window.onload = function() {
  let tooltipElements = document.querySelectorAll('[tooltip]');

  tooltipElements.forEach(function(element) {
    let tooltipText = element.getAttribute('tooltip');
    let tooltipDiv = document.createElement('div');
    tooltipDiv.classList.add('tooltip-text');
    tooltipDiv.innerText = tooltipText;

    // Add position relative if necessary
    let position = getComputedStyle(element).position;
    if (position !== 'absolute' && position !== 'relative' && position !== 'fixed') {
      element.style.position = 'relative';
    }

    element.classList.add('tooltip');
    element.appendChild(tooltipDiv);

    // Check if the element is near the top of the page
    if (element.getBoundingClientRect().top < tooltipDiv.offsetHeight) {
      tooltipDiv.style.bottom = 'auto'; // Reset bottom position
      tooltipDiv.style.top = 'calc(100% + 15px)'; // Position tooltip below the element
    }
  });
};





//ADDING AND DELETING PROCESSES

document.addEventListener("DOMContentLoaded", function() {
  fetch("/api/user/processes")
    .then(response => response.json())
    .then(data => {
      for (let processName in data.processes) {
        let displayProcessName = processName.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        let processItem = generateProcessItemHTML(displayProcessName, processName);
        document.querySelector('#processes_div').insertAdjacentHTML('beforeend', processItem);
      }

      attachDeleteProcessClickEvent();
      attachProcessEditorEvent(); // attach processEditor function as click event for process buttons
    })
    .catch(error => {
      console.log("Error loading processes:", error);
    });
});



function generateProcessItemHTML(displayProcessName, processName) {
  return `
    <div class="processes-item">
      <div class="processes-item-left">
        <a href="#" business="no" id="${processName}" class="text-button menu-text-buttons">${displayProcessName}</a>
      </div>
      <div class="processes-item-right">
        <a id="delete-process" data-process-name="${processName}"><img class="image-icon icon-button" src="../Images/icons/trash.svg"></a>
      </div>
    </div>`;
}

function attachDeleteProcessClickEvent() {
  document.querySelectorAll("[id=delete-process]").forEach(item => {
    item.addEventListener("click", function() {
      const processName = this.getAttribute("data-process-name");
      showDeleteProcessModal(processName);
    });
  });
}

function attachProcessEditorEvent() {
  document.querySelectorAll('.text-button[business="no"').forEach(item => {
    item.addEventListener("click", function(event) {
      event.preventDefault();
      const id = this.id;
      showProcessEditor(id);

      // Remove 'button-highlight' from all buttons
      document.querySelectorAll('#processes_div .text-button[business="no"').forEach(button => {
        button.classList.remove('button-highlight');
      });

      // Add 'button-highlight' to the clicked button
      this.classList.add('button-highlight');
    });
  });
}



// ADDING A PROCESS
document.getElementById("add-process").addEventListener("click", function() {
  showAddProcessModal();
});

function showAddProcessModal() {
  let modal = document.getElementById("modal-dialogue");
  if (!modal) {
    console.log("Modal element not found"); // add log if modal element is not found
    return;
  }

  let modalHeader = modal.querySelector(".modal-dialogue-header");
  let modalText = modal.querySelector(".modal-dialogue-text");

  // Change the header and text
  modalHeader.textContent = "Add Process";
  modalText.innerHTML = "Process Name: <input type='text' required class='modal-dialogue-textbox' id='new-process-name'>";

  // Show the modal
  modal.style.display = "flex";
}

function showDeleteProcessModal(processName) {
  let modal = document.getElementById("modal-dialogue");
  if (!modal) {
    console.log("Modal element not found"); // add log if modal element is not found
    return;
  }

  let modalHeader = modal.querySelector(".modal-dialogue-header");
  let modalText = modal.querySelector(".modal-dialogue-text");

  // Change the header and text
  modalHeader.textContent = "Delete Process";
  modalText.textContent = "Do you want to delete " + processName + "?";

  // Show the modal
  modal.style.display = "flex";
}

document.querySelector("#modal-dialogue .main-button").addEventListener("click", function() {
  let modal = document.getElementById("modal-dialogue");
  let modalHeader = modal.querySelector(".modal-dialogue-header");
  let modalText = modal.querySelector(".modal-dialogue-text");

  if(modalHeader.textContent === "Add Process") {
    // Create a new process
    let processName = modal.querySelector("#new-process-name").value.toLowerCase().replace(/\s/g, '-');

    fetch('/api/user/processes/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ processName: processName, processSteps: [] }),  // assuming empty steps when creating a new process
    })
    .then(response => response.json())
    .then(data => {
      if(data.message === 'Process added successfully.') {
        showToast('Process added successfully', 2000);
        location.reload(); // reload the page to reflect the change
      } else {
        showToast('Process creation failed', 2000);
      }
    })
    .catch((error) => {
      console.error('Error:', error);
    });

  } else if(modalHeader.textContent === "Delete Process") {
    // Delete the process
    let processName = modalText.textContent.replace('Do you want to delete ', '').replace('?', '');

    fetch('/api/user/processes/delete', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ processName: processName }),
    })
    .then(response => response.json())
    .then(data => {
      if(data.message === 'Process deleted successfully.') {
        showToast('Process deleted successfully', 2000);
        location.reload(); // reload the page to reflect the change
      } else {
        showToast('Process deletion failed', 2000);
      }
    })
    .catch((error) => {
      console.error('Error:', error);
    });
  }

  // Hide the modal
  modal.style.display = "none";
});

// Fetch process names from the backend
async function fetchProcessNames() {
  try {
    const response = await fetch('/api/user/processes');
    if (response.ok) {
      const data = await response.json();
      const processNames = Object.keys(data.processes);
      return processNames;
    } else {
      console.error('Error:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('Error:', error);
  }
  return [];
}


// Update Analysis Scope options
async function updateAnalysisScopeOptions() {
  const select2 = document.getElementById('select2');

  // Fetch process names
  console.log('Updating Analysis Scope options...');
  const processNames = await fetchProcessNames();
  console.log('Process names:', processNames);

  // Append new options to the existing options
  processNames.forEach((processName) => {
    const option = document.createElement('option');
    option.value = processName;
    option.textContent = processName.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    select2.appendChild(option);
  });
}


// Populate Analysis Scope options on page load
document.addEventListener('DOMContentLoaded', () => {
  console.log('Document loaded. Updating Analysis Scope...');
  updateAnalysisScopeOptions();
});





// Add a global variable to control loading sequence and completion
let loading = true;
let doneLoading = false;

// Handle Analysis Form submission
document.getElementById('analysisForm').addEventListener('submit', async (event) => {
  event.preventDefault();

  // Get form data
  const lengthOfResponse = document.getElementById('select1').value;
  const analysisScope = document.getElementById('select2').value;
  const tone = document.getElementById('select3').value;
  console.log('Form data:', { lengthOfResponse, analysisScope, tone });

  // Reset loading and doneLoading flags
  loading = true;
  doneLoading = false;

  // Fetch user info
  console.log('Fetching user info...');
  let userResponse = await fetch('/api/user', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'same-origin'
  });

  if (userResponse.ok) {
    // Call the loading sequence function
    runLoadingSequence();
  
    let userInfo = await userResponse.json();
    console.log('User info received:', userInfo);
    let userId = userInfo.user._id; // Assuming the user info includes _id
  
    // Check if the user is at the analysis limit for the free tier
    if (userInfo.user.tier === 'free' && userInfo.user.analysisCount >= 15) {
      // Show modal dialogue with upgrade message
      showModalDialogue('Analysis Limit Reached', 'You have used all your analyses for StrataMind Free. Upgrade to StrataMind Pro to continue.', 'Upgrade');
      return;
    }
  
    // Post analysis data
    console.log('Posting analysis data...');
    let response = await fetch('/api/analysis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId, lengthOfResponse, analysisScope, tone }),
      credentials: 'same-origin'
    });

    if (response.ok) {
      let result = await response.json();
      console.log('Analysis result:', result);

      // Stop the loading sequence
      loading = false;

      // Wait until the loading sequence has finished backspacing
      while (!doneLoading) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Assuming the returned result is a string containing the analysis
      const analysisPane = document.getElementById("analysisPane");
      analysisPane.innerText = result.message;
      // Add fade-in class to the analysisPane
      analysisPane.classList.add('fade-in');

      // Remove the fade-in class after animation finishes to reset the state for next time
      setTimeout(() => {
        analysisPane.classList.remove('fade-in');
      }, 1000); // Assuming your animation duration is 1s as in your CSS
    } else {
      console.error('Error posting analysis data:', response.status, response.statusText);
    }

  } else {
    console.error('Failed to fetch user info:', userResponse.status, userResponse.statusText);
  }
});




//LOADING SEQUENCE FUNCTION
async function runLoadingSequence() {

  const analysisPane = document.getElementById("analysisPane");
  analysisPane.innerHTML = '<div class="loading-sequence"></div>';

  const loadingSequence = analysisPane.querySelector(".loading-sequence");

  // This will keep running until we manually break the loop
  while (loading) {
    const randomIndex = Math.floor(Math.random() * loadingPhrases.length);
    const currentPhrase = loadingPhrases[randomIndex];
    const randomDelay = Math.floor(Math.random() * 500) + 500; // Random delay between 500ms and 1000ms

    loadingSequence.textContent = "";

    // Await the typing and backspacing animations
    await typePhrase(currentPhrase);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Pause for 1 second
    await backspacePhrase();

    await new Promise(resolve => setTimeout(resolve, randomDelay));
  }

  // After the loading sequence finishes, set doneLoading to true
  doneLoading = true;

  function typePhrase(phrase) {
    return new Promise(resolve => {
      let i = 0;
      const typingInterval = setInterval(() => {
        loadingSequence.textContent += phrase[i];
        i++;

        if (i === phrase.length) {
          clearInterval(typingInterval);
          resolve();
        }
      }, 100);
    });
  }

  function backspacePhrase() {
    return new Promise(resolve => {
      const backspaceInterval = setInterval(() => {
        loadingSequence.textContent = loadingSequence.textContent.slice(0, -1);

        if (loadingSequence.textContent === "") {
          clearInterval(backspaceInterval);
          resolve();
        }
      }, 25);
    });
  }
  
  // After the loading sequence finishes, set doneLoading to true
  if (!loading) doneLoading = true;
}





// Function to create the modal HTML
function createModalHTML(header, content, confirmText) {
  const modalHTML = `
    <div id="confirmation-modal" class="modal-generic">
      <div class="modal-content-generic dialogue-box">
        <h2 id="confirmation-modal-header" class="modal-dialogue-header">${header}</h2>
        <p class="modal-dialogue-text">${content}</p>
        <div class="modal-dialogue-buttons-container">
          <button id="confirmation-modal-cancel-button" class="secondary-button">Cancel</button>
          <button id="confirmation-modal-confirm-button" class="main-button">${confirmText}</button>
        </div>
      </div>
    </div>
  `;
  return modalHTML;
}

// Function to show the modal dialogue
function showModalDialogue(header, content, confirmText) {
  // Create the modal HTML
  const modalHTML = createModalHTML(header, content, confirmText);

  // Check if the container element exists
  let modalContainer = document.getElementById('modal-container');
  if (!modalContainer) {
    // Create the container element and append it to the document body
    modalContainer = document.createElement('div');
    modalContainer.id = 'modal-container';
    document.body.appendChild(modalContainer);
  }

  // Append the modal HTML to the container element
  modalContainer.innerHTML = modalHTML;

  // Add event listener to the Confirm button
  const confirmButton = document.getElementById('confirmation-modal-confirm-button');
  if (confirmButton) {
    confirmButton.addEventListener('click', handleConfirmUpgrade);
  }

  // Add event listener to the Cancel button
  const cancelButton = document.getElementById('confirmation-modal-cancel-button');
  if (cancelButton) {
    cancelButton.addEventListener('click', closeModal);
  }

  // Add event listener to the modal container
  modalContainer.addEventListener('click', closeModal);

  // Stop the propagation of click events within the modal content
  const modalContent = document.querySelector('.modal-content-generic');
  if (modalContent) {
    modalContent.addEventListener('click', (event) => {
      event.stopPropagation();
    });
  }

  // Display the modal
  const modal = document.getElementById('confirmation-modal');
  if (modal) {
    modal.style.display = 'block';
  }
}



// Function to handle the upgrade confirmation
function handleConfirmUpgrade() {
  // Redirect to the upgrade page
  window.location.href = 'https://buy.stripe.com/test_aEU8y5b0YgMRcX6dQR';
}




//UPGRADE BUTTON DISPLAY
async function checkUserTier() {
  try {
    // Fetch user info
    console.log('Fetching user info...');
    let userResponse = await fetch('/api/user', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'same-origin'
    });

    if (userResponse.ok) {
      let userInfo = await userResponse.json();
      console.log('User info received:', userInfo);

      // Check the user's tier parameter
      const upgradeButton = document.getElementById('upgrade-button');
      if (userInfo.user.tier === 'free') {
        // Show the upgrade button
        upgradeButton.style.display = 'inline';
      } else {
        // Hide the upgrade button
        upgradeButton.style.display = 'none';
      }

      // Rest of your code...
    } else {
      console.error('Failed to fetch user info:', userResponse.status, userResponse.statusText);
    }
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

// Call the function when needed
checkUserTier();



//STRIPE CHECKOUT INTEGRATION
// Function to handle the upgrade button click
async function handleUpgradeButtonClick() {
  try {
    // Make an AJAX request to the backend to retrieve the publishable key
    const keyResponse = await fetch('/api/publishable-key', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'same-origin',
    });

    if (keyResponse.ok) {
      const { publishableKey } = await keyResponse.json();

      // Make an AJAX request to the backend to initiate the upgrade process
      const response = await fetch('/api/checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publishableKey}`,
        },
        credentials: 'same-origin',
        body: JSON.stringify({ priceId: 'price_1NDEM6IMorCkqLBZp4Nf1iW2' }), // Replace with the actual price ID
      });

      if (response.ok) {
        const { sessionId } = await response.json();

        // Create an instance of Stripe
        const stripe = Stripe(publishableKey);

        // Redirect the user to the Stripe Checkout page
        stripe.redirectToCheckout({ sessionId: sessionId }).then(function (result) {
          if (result.error) {
            console.error('Error redirecting to checkout:', result.error.message);
          }
        });
        
      } else {
        console.error('Error initiating checkout session:', response.status, response.statusText);
      }
    } else {
      console.error('Error retrieving publishable key:', keyResponse.status, keyResponse.statusText);
    }
  } catch (error) {
    console.error('Error initiating checkout session:', error);
  }
}

// Attach event listener to the upgrade button
document.getElementById('upgrade-button').addEventListener('click', handleUpgradeButtonClick);
document.getElementById('upgrade-subscription').addEventListener('click', handleUpgradeButtonClick);


//CANCEL STRIPE SUBSCRIPTION

document.getElementById('cancel-subscription').addEventListener('click', async () => {
  // Fetch user info
  let userResponse = await fetch('/api/user', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'same-origin'
  });

  if (userResponse.ok) {
    let userInfo = await userResponse.json();
    console.log('User info received:', userInfo);

    const customerId = userInfo.user.stripeCustomerId; // Assuming the user info includes stripeCustomerId
    const subscriptionId = userInfo.user.stripeSubscriptionId; // Assuming the user info includes stripeSubscriptionId

    if (!customerId || !subscriptionId) {
      console.error('Missing customerId or subscriptionId in user info:', userInfo);
      return;
    }

    // Create cancellation session
    let response = await fetch('/create-cancellation-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ customerId, subscriptionId }),
      credentials: 'same-origin'
    });

    if (response.ok) {
      let result = await response.json();
      console.log('Cancellation session created:', result);
      window.location.href = result.url;
    } else {
      console.error('Failed to create cancellation session:', response.status, response.statusText);
    }
  } else {
    console.error('Failed to fetch user info:', userResponse.status, userResponse.statusText);
  }
});



//HIDE SETTINGS BUTTONS BASED ON SUBSCRIPTION

// Fetch user info
fetch('/api/user', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  },
  credentials: 'same-origin'
})
.then(response => response.json())
.then(data => {
  const userTier = data.user.tier; // Assuming the user info includes 'tier'

  // Get the buttons
  const upgradeButton = document.getElementById('upgrade-subscription');
  const manageButton = document.getElementById('cancel-subscription');
  const editionTitle = document.getElementById('edition-title');

  // Hide or show the buttons based on the user's tier
  if (userTier === 'pro') {
    upgradeButton.style.display = 'none';
    manageButton.style.display = 'block';
    editionTitle.textContent = 'StrataMind Pro'
  } else if (userTier === 'free') {
    upgradeButton.style.display = 'block';
    manageButton.style.display = 'none';
    editionTitle.textContent = 'StrataMind'
  }
})
.catch(error => console.error('Error:', error));








//IMPORTING TEXT AS FLOW CHART

// Parse the imported text into process data
function importProcessFromText(text) {
  const trimmedText = text.trim();
  const lines = trimmedText.split('\n');
  const processData = [];

  lines.forEach((line) => {
    let stepText = line.trim();
    stepText = stepText.replace(/\*\*(.*)\*\*/, '$1'); // remove markdown notation

    const firstColonIndex = stepText.indexOf(':');

    if (firstColonIndex !== -1) {
      const title = stepText.slice(0, firstColonIndex).trim();
      const description = stepText.slice(firstColonIndex + 1).trim();

      const step = {
        title,
        description
      };
      processData.push(step);
    } else {

      if (processData.length > 0) {
        processData[processData.length - 1].description += "\n" + stepText;
      } else {
        const step = {
          title: stepText,
          description: ''
        };
        processData.push(step);
      }
    }
  });

  return processData;
}






// Append process data to the existing process
async function appendProcessData(processName, processData) {
  try {
    const response = await fetch('/api/user/process/append', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ processName, processData })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error appending process data:', error);
    throw error;
  }
}

// Replace the existing process data with new process data
async function replaceProcessData(processName, processData) {
  try {
    const response = await fetch('/api/user/process/replace', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ processName, processData })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error replacing process data:', error);
    throw error;
  }
}


// Get a reference to the import button
const importButton = document.getElementById('importButton');

// Add an event listener to the import button click
importButton.addEventListener('click', () => {
  // Set the modal header
  modalHeaderText.textContent = 'Import Process as Text';

  // Clear any existing content
  modalTextContent.innerHTML = '';

  // Create the <h1> element
  const headingElement = document.createElement('h2');
  headingElement.className = 'title-header';
  headingElement.textContent = 'Import a List';

  // Append the heading element to the modal content
  modalTextContent.appendChild(headingElement);

  // Create the textarea element
  const textarea = document.createElement('textarea');
  textarea.classList.add('modal-dialogue-textbox', 'large-textbox');
  textarea.placeholder = 'Enter your process steps as a list:\n\nStep Title: Step Description. Separate each step with a new line.';
  modalTextContent.appendChild(textarea);

  // Create the button container
  const buttonContainer = document.createElement('div');
  buttonContainer.classList.add('modal-dialogue-buttons-container');

  // Create the append button
  const appendButton = document.createElement('button');
  appendButton.classList.add('main-button');
  appendButton.textContent = 'Append';
  buttonContainer.appendChild(appendButton);

  // Create the replace button
  const replaceButton = document.createElement('button');
  replaceButton.classList.add('main-button');
  replaceButton.textContent = 'Replace';
  buttonContainer.appendChild(replaceButton);

  // Append the button container to the modal content
  modalTextContent.appendChild(buttonContainer);

  // Add an event listener to the append button click
  appendButton.addEventListener('click', async () => {
    const text = textarea.value;
    console.log(text);
    const processData = importProcessFromText(text);
    console.log(processData);

    try {
      const selectedProcessName = sessionStorage.getItem('selectedProcess');
      await appendProcessData(selectedProcessName, processData);
      console.log('Process data appended:', processData);
      new ProcessEditor(selectedProcessName);
      modalText.style.display = 'none';
      showToast('Process data appended successfully!', 2000);
    } catch (error) {
      console.error('Error appending process data:', error);
      showToast('An error occurred while appending process data. Please try again.', 2000);
    }
  });

  // Add an event listener to the replace button click
  replaceButton.addEventListener('click', async () => {
    const text = textarea.value;
    console.log(text);
    const processData = importProcessFromText(text);
    console.log(processData);

    try {
      const selectedProcessName = sessionStorage.getItem('selectedProcess');
      await replaceProcessData(selectedProcessName, processData);
      console.log('Process data replaced:', processData);
      new ProcessEditor(selectedProcessName);
      modalText.style.display = 'none';
      showToast('Process data replaced successfully!', 2000);
      
    } catch (error) {
      console.error('Error replacing process data:', error);
      showToast('An error occurred while replacing process data. Please try again.', 2000);
    }
  });

  // Show the modal
  modalText.style.display = 'flex';
});



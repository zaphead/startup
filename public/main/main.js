
var modal = document.getElementById("myModal");
var buttons = document.querySelectorAll('.text-button[business="yes"]');
var businessContent = document.querySelector(".business-content");

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
  analyzeModal.style.display = 'block';
});

closeButton.addEventListener('click', function() {
  analyzeModal.style.display = 'none';
});

//DIALOGUE MODAL
// Get the necessary elements
const addProcessBtn = document.getElementById('add-process');
const modalDialogue = document.getElementById('modal-dialogue');

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
  
  document.getElementById('myModal').style.display = 'block';
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

//RENDERING FLOWCHART
class ProcessEditor {
  constructor(processName) {
    console.log("ProcessEditor is being instantiated with processName: ", processName); // Log when a new instance of the class is created
    this.processName = processName;
    this.process = null;
    this.fetchProcess();
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
          <div class="card card-outlined">
            <div class="process-title" contenteditable="true" data-id="${index}">${step.title}</div>
            <div class="process-content" contenteditable="true" data-id="${index}">${step.description}</div>
          </div>
          <div class="arrow-buttons">
            <button class="up-button main-button">&#8593;</button>
            <button class="down-button main-button">&#8595;</button>
          </div>
        </div>
        <div class="arrow-image-container">
          <img class="arrowimg" height="30" src="../Images/down_arrow.png" />
        </div>
      `;
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
    const stepIndex = event.target.dataset.id;
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
      title: 'New Step',
      description: 'Step Description'
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

function attachProcessEditorEvent() {
  document.querySelectorAll('.text-button[business="no"').forEach(item => {
    item.addEventListener("click", function(event) {
      event.preventDefault();
      const id = this.id;
      showProcessEditor(id);
    });
  });
}

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
  modal.style.display = "block";
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
  modal.style.display = "block";
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

// Handle Analysis Form submission
document.getElementById('analysisForm').addEventListener('submit', async (event) => {
  event.preventDefault();

  // Get form data
  const lengthOfResponse = document.getElementById('select1').value;
  const analysisScope = document.getElementById('select2').value;
  const tone = document.getElementById('select3').value;
  console.log('Form data:', { lengthOfResponse, analysisScope, tone });

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
    document.getElementById("analysisPane").innerText = "Generating Analysis...";
    let userInfo = await userResponse.json();
    console.log('User info received:', userInfo);
    let userId = userInfo.user._id; // Assuming the user info includes _id

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

      // Assuming the returned result is a string containing the analysis
      document.getElementById("analysisPane").innerText = result.message;
    } else {
      console.error('Error posting analysis data:', response.status, response.statusText);
    }

  } else {
    console.error('Failed to fetch user info:', userResponse.status, userResponse.statusText);
  }
});

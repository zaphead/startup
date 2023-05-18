//User Redirect


//MODAL POPUP SCRIPTS

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
  
        console.log('Business info fetched:', businessInfoMap);
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
        await showToast('Saved!', 3000); // Wait for the 'Saved!' toast to finish
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
  
  function showToast(message, duration = 3000) {
    return new Promise((resolve) => {
      if (currentToast) {
        currentToast.classList.add('slide-out');
        setTimeout(() => {
          currentToast.remove();
          showNewToast(message, duration, resolve); // Show the new toast after removing the previous one
        }, 1000);
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
    }, 1000);
  
    setTimeout(() => {
      toast.remove(); // Remove the toast after the specified duration
      currentToast = null; // Reset the current toast
      resolve(); // Resolve the promise
    }, duration);
  }
  
  //RENDERING FLOWCHART

  class ProcessEditor {
    constructor(processName) {
      this.processName = processName;
      this.unsavedChanges = false;
      this.saveTimeout = null;
      this.process = null;
    }

    
  
    fetchProcess = () => {
      fetch(`/api/user/processes/${this.processName}`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then(json => {
          this.process = json.process;
          this.renderProcess();
        })
        .catch(e => {
          console.error('An error occurred fetching the process data:', e);
        });
    }
  
    renderProcess = () => {
      const mainSection = document.querySelector('.main-section .steps-container');
      mainSection.innerHTML = '';
  
      this.process.forEach((step, index) => {
        const card = document.createElement('div');
        card.classList.add('card-container');
        card.innerHTML = `
          <div class="content-container">
              <div class="card">
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
  
        mainSection.appendChild(card);
      });
  
      // Add event listeners to all editable elements
      const editableElements = mainSection.querySelectorAll('[contenteditable]');
      editableElements.forEach(element => {
        element.addEventListener('input', this.handleTyping);
      });
    }

    handleTyping = (event) => {
      const textContent = event.target.textContent;
      const stepIndex = event.target.dataset.id;
      const field = event.target.classList.contains('process-title') ? 'title' : 'description';
    
      // Update the process with the new content
      this.process[stepIndex][field] = textContent;
      this.unsavedChanges = true;
    
      // If there is a pending save, clear it
      if (this.saveTimeout !== null) {
        clearTimeout(this.saveTimeout);
      }
    
      // Set a new save to occur after 5 seconds of inactivity
      this.saveTimeout = setTimeout(() => saveProcess(this), 1500);
    }

    saveChanges = () => {
      // Replace with your function to save changes to the server
      return fetch(`/api/user/processes/${this.processName}`, {
        method: 'PUT', // or 'POST'
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
        return false;
      });
    }
  
    warnBeforeClosing = (event) => {
      if (this.unsavedChanges) {
        event.preventDefault();
        event.returnValue = 'You have unsaved changes. Do you really want to leave?';
      }
    }
  }

  
// New functions to add
async function saveProcess(processEditor) {
  if (!processEditor.unsavedChanges) {
    return;
  }

  showToast('Saving...', 2000);
  const saveSuccess = await processEditor.saveChanges();
  if (saveSuccess) {
    showToast('Process saved!', 2000);
  } else {
    showToast('Error saving process. Please try again.', 2000);
  }
}


async function loadProcess(processName) {
  const processEditor = new ProcessEditor(processName);
  await processEditor.fetchProcess();
  return processEditor;
}

// Initial message when no process is selected
const mainSection = document.querySelector('.main-section .steps-container');
mainSection.innerHTML = '<p>Select a process or business topic to get started.</p>';
  
  

// Warn the user before closing the window
window.addEventListener('beforeunload', function(event) {
  if (currentProcessEditor) {
    currentProcessEditor.warnBeforeClosing(event);
  }
});


let currentProcessEditor = null;

window.addEventListener('beforeunload', (event) => {
  if (currentProcessEditor && currentProcessEditor.unsavedChanges) {
    event.preventDefault();
    event.returnValue = 'You have unsaved changes. Do you want to leave?';
    saveProcess(currentProcessEditor);
  }
});
// Select all process links using their class
document.querySelectorAll('#processes_div .text-button').forEach((link) => {
  link.addEventListener('click', async (event) => {
    // Prevent the link from doing its default action (in this case, navigating to "#")
    event.preventDefault();

    // If there's an editor with unsaved changes, save before loading a new process
    if (currentProcessEditor && currentProcessEditor.unsavedChanges) {
      await saveProcess(currentProcessEditor);
    }

    // Create a new editor instance for the clicked process
    currentProcessEditor = new ProcessEditor(event.target.id);
    currentProcessEditor.fetchProcess();
  });
});

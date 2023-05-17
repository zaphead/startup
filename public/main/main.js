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
      card.classList.add('card', 'card-outline');
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
        upButton.classList.add('up-button', 'main-button');
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
        downButton.classList.add('down-button', 'main-button');
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
    addStepButton.classList.add('click-button', 'main-button');
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
      await showToast('Saving...', 1000); // Wait for the 'Saving...' toast to finish
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
  
  function showToast(message, duration = 5000) {
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
  
  
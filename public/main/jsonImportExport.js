function showToast(message, duration = 2000) {
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


//INTERPRETING JSON AND RETURNING TEXT
function interpretJSON(jsonData) {
  if (Array.isArray(jsonData)) {
    return jsonData
      .map(
        (item, index) =>
          `${index + 1}. **${item.title}**: ${item.description}`
      )
      .join('\n');
  } else if (typeof jsonData === 'string') {
    const parsedData = JSON.parse(jsonData);
    if (Array.isArray(parsedData)) {
      return parsedData
        .map(
          (item, index) =>
            `${index + 1}. **${item.title}**: ${item.description}`
        )
        .join('\n');
    }
  }

  return '';
}



// Get a reference to the export button, the modal text, and the modal text content
const exportButton = document.getElementById('exportButton');
const modalHeaderText = document.getElementById('modal-dialogue-header');
const modalTextContent = document.getElementById('modal-text-content');
const modalText = document.getElementById('modal-text');

// Add a function to fetch the process data
async function fetchProcessData(processName) {
  try {
    const response = await fetch(`/api/user/process?processName=${processName}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const json = await response.json();
    return json;
  } catch (error) {
    console.error('Error fetching process data:', error);
    throw error;
  }
}

// Update the exportButton click event listener
exportButton.addEventListener('click', async () => {
  try {
    //Clear modal text
    modalTextContent.innerHTML = '';

    // Show the modal
    modalText.style.display = 'block';
    const selectedProcessName = sessionStorage.getItem('selectedProcess');
    const processData = await fetchProcessData(selectedProcessName);

    modalHeaderText.textContent = `Process Name: ${selectedProcessName}`;

    

    // Loop through the process data and create elements for each step
    processData.forEach((step, index) => {
      const stepElement = document.createElement('div');
      stepElement.classList.add('modal-dialogue-object');

      const stepTitleElement = document.createElement('p');
      const titleElement = document.createElement('strong');
      titleElement.textContent = step.title;
      stepTitleElement.appendChild(titleElement);
      stepTitleElement.innerHTML += `: ${step.description}`;

      stepElement.appendChild(stepTitleElement);

      modalTextContent.appendChild(stepElement);
    });

    // Create a "Copy" button
    const copyButton = document.createElement('button');
    copyButton.classList.add('main-button');
    copyButton.textContent = 'Copy';

    copyButton.addEventListener('click', () => {
      const contentToCopy = interpretJSON(processData);
      navigator.clipboard.writeText(contentToCopy)
        .then(() => {
          console.log('Content copied to clipboard');
          showToast('Copied!', 1000);
        })
        .catch((error) => {
          console.error('Failed to copy content to clipboard:', error);
        });
    });

    modalTextContent.appendChild(copyButton);


  } catch (error) {
    console.error('An error occurred:', error);
    showToast('An error occurred. Please try again.', 2000);
  }
});

// Add an event listener to close the modal when clicking outside the modal content
modalText.addEventListener('click', (event) => {
  if (event.target === modalText) {
    modalText.style.display = 'none';
  }
});

//Function to handle the sign in form submission
async function handleFormSubmit(event) {
  event.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (response.ok) {
      console.log('User logged in');
      window.location.href = '/main/main.html'; // Redirect to the main page or any other appropriate page
    } else {
      if (response.status === 401) {
        console.error('Wrong password');
        showToast('Wrong password');
        clearPasswordInput(); // Clear the password input field
      } else {
        console.error('An error occurred while submitting the form:', response.statusText);
        showToast('An error occurred while submitting the form: ' + response.statusText);
      }
    }
  } catch (error) {
    console.error('An error occurred while submitting the form:', error.message);
    showToast('An error occurred while submitting the form: ' + error.message);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form');
  form.addEventListener('submit', handleFormSubmit);
});

let currentToast = null;

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

function clearPasswordInput() {
  document.getElementById('password').value = '';
}

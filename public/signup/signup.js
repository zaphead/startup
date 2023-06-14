//TOAST FUNCTIONS
let currentToast;
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


async function handleFormSubmit(event) {
  event.preventDefault();

  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  // Prepare the new user data with empty placeholders
  const newUser = {
    email,
    password,
    name,
    processes: [],
    businessInfo: {
      business_name: "",
      target_market: "",
      product: "",
      business_stage: "",
      hours: 0,
      experience: ""
    }
  };

  try {
    const response = await fetch('/api/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newUser),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('User inserted:', data.insertedId);

      // Log the user in after successful signup
      const loginResponse = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (loginResponse.ok) {
        console.log('User logged in after signup');
        window.location.href = '../setup/setup.html';
      } else {
        console.error('An error occurred while logging in the user:', loginResponse.statusText);
        showToast('Error while logging in. Please try again.');
      }
    } else if (response.status === 409) {  // User with this email already exists
      showToast('A user with this email already exists. Please use a different email.');
    } else {
      console.error('An error occurred while submitting the form:', response.statusText);
      showToast('Error while signing up. Please try again.');
    }
  } catch (error) {
    console.error('An error occurred while submitting the form:', error.message);
    showToast('Error while signing up. Please try again.');
  }
}

const form = document.getElementById('signup-form');
form.addEventListener('submit', handleFormSubmit);

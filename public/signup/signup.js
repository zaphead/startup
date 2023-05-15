async function handleFormSubmit(event) {
  event.preventDefault();

  // Retrieve form input values
  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  console.log('Email:', email);
  console.log('Password:', password);
  console.log('Name:', name);

  // Make a request to the server-side API
  try {
    const response = await fetch('/api/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password }),
    });

    if (response.ok) {
      console.log('User registered successfully');
      // Redirect to the setup page or any other page you want
      window.location.href = '/setup/setup.html';
    } else {
      console.error('An error occurred while registering the user:', response.statusText);
    }
  } catch (error) {
    console.error('An error occurred while registering the user:', error.message);
  }
}

// Add event listener to the form submit event
const form = document.getElementById('signup-form');
form.addEventListener('submit', handleFormSubmit);

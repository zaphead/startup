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
      }
    } else {
      console.error('An error occurred while submitting the form:', response.statusText);
    }
  } catch (error) {
    console.error('An error occurred while submitting the form:', error.message);
  }
}

const form = document.getElementById('signup-form');
form.addEventListener('submit', handleFormSubmit);

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
        console.error('An error occurred while submitting the form:', response.statusText);
      }
    } catch (error) {
      console.error('An error occurred while submitting the form:', error.message);
    }
  }
  
  document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    form.addEventListener('submit', handleFormSubmit);
  });
  
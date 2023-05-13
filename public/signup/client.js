async function handleFormSubmit(event) {
    event.preventDefault();
  
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
  
    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });
  
      if (response.ok) {
        const data = await response.json();
        console.log('User inserted:', data.insertedId);
        window.location.href = '../setup/setup.html';

      } else {
        console.error('An error occurred while submitting the form:', response.statusText);
      }
    } catch (error) {
      console.error('An error occurred while submitting the form:', error.message);
    }
  }
  
  const form = document.getElementById('signup-form');
  form.addEventListener('submit', handleFormSubmit);
  
// Function to check if the user is authenticated
async function checkAuthenticated() {
  try {
    const response = await fetch('/api/user');
    if (response.ok) {
      const user = await response.json();
      console.log('Authenticated user:', user);
      return true;
    }
  } catch (error) {
    console.error('Error checking user authentication:', error);
  }
  return false;
}

// Function to handle form submission
async function handleFormSubmit(event) {
  event.preventDefault();

  const question1 = document.getElementById('question1').value;
  const question2 = document.getElementById('question2').value;
  const question3 = document.getElementById('question3').value;
  const question4 = document.getElementById('question4').value;
  const question5 = document.getElementById('question5').value;
  const question6 = document.getElementById('question6').value;

  try {
    const response = await fetch('/api/setup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question1, question2, question3, question4, question5, question6 }),
    });

    if (response.ok) {
      window.location.href = '/main/main.html';
    } else {
      console.error('An error occurred while submitting the form:', response.statusText);
    }
  } catch (error) {
    console.error('An error occurred while submitting the form:', error.message);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('setup-form');
  if (form) {
    form.addEventListener('submit', handleFormSubmit);
  } else {
    console.error('Setup form not found');
    return;
  }

  if (await checkAuthenticated()) {
    console.log('User is authenticated'); // Add this line for debugging

    // Handle the form submit event here instead of inside handleFormSubmit function

  } else {
    console.error('User is not authenticated');
    window.location.href = '/index.html'; // Redirect to the login page or any other appropriate page
  }
});

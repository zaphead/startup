// import { config } from 'dotenv';
import { MongoClient } from 'mongodb';

// config();

const uri = 'mongodb+srv://bruh:bruh@cluster0.qkibkhv.mongodb.net/?retryWrites=true&w=majority';

// Function to handle form submission
async function handleFormSubmit(event) {
event.preventDefault();

  // Retrieve form input values
  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  console.log('Email:', email);
  console.log('Password:', password);
  console.log('Name:', name);

  // Connect to the MongoDB database
  const client = new MongoClient(uri);

  try {
    console.log('Connecting to the database...');
    await client.connect();
    console.log('Connected to the database successfully');

    // Access the "users" collection
    const database = client.db('users');
    const collection = database.collection('users');

    // Create a new user document
    const user = {
      email,
      password,
      name,
    };

    // Insert the user document into the collection
    console.log('Inserting user into the collection...');
    const result = await collection.insertOne(user);
    console.log('User inserted:', result.insertedId);
  } finally {
    console.log('Closing database connection...');
    await client.close();
    console.log('Database connection closed');
  }
}

// Add event listener to the form submit event
const form = document.getElementById('signup-form');
form.addEventListener('submit', handleFormSubmit);

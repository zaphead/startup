import { MongoClient } from 'mongodb';
import 'dotenv/config';
const cred = process.env.MONGO_URL;


const uri = cred;


//Retrieve PROCESSES data given specific email
async function getProcesses(email) {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const database = client.db('users');
    const collection = database.collection('users');
    const query = { email: email };
    const result = await collection.findOne(query);
    const processes = result?.processes || [];
    console.log(JSON.stringify(processes, null, 2));
  } finally {
    await client.close();
  }
}

// const emailToFind = 'john@example.com'; // Replace with the actual email you want to find
// getData(emailToFind).catch(console.error);

//Retrieve BIZINFO data given specific email
async function getBizinfo(email) {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const database = client.db('users');
    const collection = database.collection('users');
    const query = { email: email };
    const result = await collection.findOne(query);
    const businessInfo = result?.businessInfo || [];
    console.log(JSON.stringify(businessInfo, null, 2));
  } finally {
    await client.close();
  }
}

const emailToFind = 'john@example.com'; // Replace with the actual email you want to find
getBizinfo(emailToFind).catch(console.error);



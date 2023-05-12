const { MongoClient } = require('mongodb');

const userName = 'skylar';
const password = 'deeznuts';
const hostname = 'mongodb.com';

const uri = `mongodb+srv://${userName}:${password}@${hostname}`;

const client = new MongoClient(uri);

const collection = client.db('rental').collection('house');

const house = {
  name: 'Beachfront views',
  summary: 'From your bedroom to the beach, no shoes required',
  property_type: 'Condo',
  beds: 1,
};

const cursor = collection.find();
const rentals = cursor.toArray();
rentals.forEach((i) => console.log(i))
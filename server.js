import express from 'express';
import bodyParser from 'body-parser';
import { MongoClient } from 'mongodb';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from "dotenv";
config();

const uri = MONGODB_URL;

const app = express();
app.use(bodyParser.json());

const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.static(path.join(__dirname, 'public')));

// ... (rest of your server code)


app.post('/api/signup', async (req, res) => {
  const { name, email, password } = req.body;

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const database = client.db('users');
    const collection = database.collection('users');

    const user = {
      email,
      password,
      name,
    };

    const result = await collection.insertOne(user);
    res.status(200).json({ insertedId: result.insertedId });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while processing your request.' });
  } finally {
    await client.close();
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

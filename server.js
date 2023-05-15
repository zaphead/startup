import express from 'express';
import bodyParser from 'body-parser';
import { MongoClient } from 'mongodb';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcryptjs';
import session from 'express-session';
import { promisify } from 'util';


dotenv.config();

const uri = process.env.MONGODB_URL;
const passport_key = process.env.PASSPORT_KEY;

const app = express();
app.use(bodyParser.json());

const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({ secret: passport_key, resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
  const client = new MongoClient(uri);
  await client.connect();
  const database = client.db('users');
  const collection = database.collection('users');

  const user = await collection.findOne({ email });

  if (!user) {
    return done(null, false, { message: 'Incorrect email or password.' });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return done(null, false, { message: 'Incorrect email or password.' });
  }

  return done(null, user);
}));

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  const client = new MongoClient(uri);
  await client.connect();
  const database = client.db('users');
  const collection = database.collection('users');

  const user = await collection.findOne({ _id: new ObjectId(id) });
  done(null, user);
});


//Posting info from user signup and authenticating to proceed to the setup survey
app.post('/api/signup', async (req, res) => {
  const { name, email, password } = req.body;

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const database = client.db('users');
    const collection = database.collection('users');

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
        hours: "",
        experience: "",
      },
    };

    const result = await collection.insertOne(newUser);
    res.status(200).json({ insertedId: result.insertedId });
  } catch (error) {
    console.error('Error in /api/signup:', error);
    res.status(500).json({ error: 'An error occurred while processing your request.', details: error.message });
  } finally {
    await client.close();
  }
});






//Posting info from Setup Survey
app.post('/api/setup', ensureAuthenticated, async (req, res) => {
  const { question1, question2, question3, question4, question5, question6 } = req.body;

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const database = client.db('users');
    const collection = database.collection('users');

    const updateResult = await collection.updateOne(
      { _id: new ObjectId(req.user._id) },
      {
        $set: {
          'businessInfo.business_name': question1,
          'businessInfo.target_market': question2,
          'businessInfo.product': question3,
          'businessInfo.business_stage': question4,
          'businessInfo.hours': question5,
          'businessInfo.experience': question6,
        },
      }
    );

    if (updateResult.matchedCount === 0) {
      res.status(404).json({ error: 'User not found.' });
    } else {
      res.status(200).json({ message: 'Business info updated successfully.' });
    }
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while processing your request.' });
  } finally {
    await client.close();
  }
});






//Authentication code
app.post('/api/login', passport.authenticate('local'), (req, res) => {
  res.status(200).json({ message: 'Login successful.' });
});

app.get('/api/logout', (req, res) => {
  req.logout();
  res.status(200).json({ message: 'Logout successful.' });
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized access.' });
}

// Use ensureAuthenticated for any routes that require authentication.
// Example: app.post('/api/setup', ensureAuthenticated, async (req, res) => { ... });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

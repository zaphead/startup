import express from 'express';
import bodyParser from 'body-parser';
import { MongoClient, ObjectId } from 'mongodb';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcryptjs';
import session from 'express-session';

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
    console.log('User not found:', email);
    return done(null, false, { message: 'Incorrect email or password.' });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    console.log('Incorrect password for user:', email);
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

// Authentication routes
app.post('/api/login', passport.authenticate('local'), (req, res) => {
  res.status(200).json({ message: 'Login successful.' });
});

app.get('/api/logout', (req, res) => {
  req.logout();
  res.status(200).json({ message: 'Logout successful.' });
});

app.get('/api/user', ensureAuthenticated, (req, res) => {
  res.status(200).json({ user: req.user });
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized access.' });
}

//Login Form Route
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await usersCollection.findOne({ email });

    if (!user) {
      // Return a 404 error if the email is not found
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the password matches the stored password
    // Assuming you're using bcrypt for hashing the password
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      // Return a 401 error if the password doesn't match
      return res.status(401).json({ message: 'Incorrect password' });
    }

    // If the password matches, set the user session and return a success status
    req.session.user = user;
    res.status(200).json({ message: 'Login successful' });
  } catch (error) {
    console.error('Error in /api/login:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

//Signup route
app.post('/api/signup', async (req, res) => {
  const { name, email, password } = req.body;

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const database = client.db('users');
    const collection = database.collection('users');

    // Hash the password before inserting the new user
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      email,
      password: hashedPassword, // Store the hashed password
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

//Setup route
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
    console.error('Error in /api/setup:', error);
    res.status(500).json({ error: 'An error occurred while processing your request.' });
  } finally {
    await client.close();
  }
});

// Get user's name Route
app.get('/api/user/name', ensureAuthenticated, async (req, res) => {
  try {
    const { name } = req.user;
    res.status(200).json({ name });
  } catch (error) {
    console.error('Error in /api/user/name:', error);
    res.status(500).json({ error: 'An error occurred while fetching the user name.' });
  }
});



//Get all business info Route. Separate it out in the client cod.
app.get('/api/user', ensureAuthenticated, (req, res) => {
  console.log('req.user:', req.user); // Log the req.user object

  // Assuming the authenticated user's business info is stored in req.user.businessInfo
  const businessInfo = req.user.businessInfo;

  console.log('businessInfo:', businessInfo); // Log the businessInfo object

  res.status(200).json({ businessInfo });
});


//Get a specific user's process Route
app.get('/api/user/processes/:processName', ensureAuthenticated, (req, res) => {
  let processName = req.params.processName;
  if (req.user.processes.hasOwnProperty(processName)) {
    // If the user has the process, return it
    return res.status(200).json({ process: req.user.processes[processName] });
  } else {
    // If the user doesn't have the process, return an error
    return res.status(404).json({ error: 'Process not found' });
  }
});

//UPDATE A SPECIFIC USER'S PROCESS ROUTE
app.put('/api/user/processes/:processName', ensureAuthenticated, async (req, res) => {
  const processName = req.params.processName;
  const updatedProcess = req.body;

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const database = client.db('users');
    const collection = database.collection('users');

    const updateResult = await collection.updateOne(
      { _id: new ObjectId(req.user._id) },
      {
        $set: {
          [`processes.${processName}`]: updatedProcess,
        },
      }
    );

    if (updateResult.matchedCount === 0) {
      res.status(404).json({ error: 'User not found.' });
    } else {
      res.status(200).json({ message: 'Process updated successfully.' });
    }
  } catch (error) {
    console.error('Error in /api/user/processes/:processName:', error);
    res.status(500).json({ error: 'An error occurred while processing your request.' });
  } finally {
    await client.close();
  }
});




const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

//UPDATING THE BIZINFO DATA API
  //Function
  async function updateBusinessInfo(userId, key, content) {
    const client = new MongoClient(uri);
    try {
      await client.connect();
      const database = client.db('users');
      const collection = database.collection('users');
  
      const updateResult = await collection.updateOne(
        { _id: new ObjectId(userId) },
        {
          $set: {
            [`businessInfo.${key}`]: content,
          },
        }
      );
  
      if (updateResult.matchedCount === 0) {
        throw new Error('User not found');
      }
    } catch (error) {
      console.error('Error updating business info:', error);
      throw error;
    } finally {
      await client.close();
    }
  }
  

  app.post('/api/update-business-info', ensureAuthenticated, async (req, res) => {
    try {
      const { key, content } = req.body;

      // Assuming you have a function to update the business info in the database
      await updateBusinessInfo(req.user._id, key, content);

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error updating business info:', error);
      res.status(500).json({ error: 'Error updating business info' });
    }
  });

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
import { Configuration, OpenAIApi } from 'openai';

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

const client = new MongoClient(uri);

const connectToMongo = async () => {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
};

connectToMongo();

passport.use(
  new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
    try {
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
    } catch (error) {
      console.error('Error in passport LocalStrategy:', error);
      return done(error);
    }
  })
);

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const database = client.db('users');
    const collection = database.collection('users');

    const user = await collection.findOne({ _id: new ObjectId(id) });
    done(null, user);
  } catch (error) {
    console.error('Error in passport deserializeUser:', error);
    done(error);
  }
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

// Signup route
app.post('/api/signup', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const database = client.db('users');
    const collection = database.collection('users');

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      email,
      password: hashedPassword,
      name,
      processes: {
        'client-acquisition': [],
        'marketing-strategy': [],
        'service-process': [],
      },
      businessInfo: {
        business_name: '',
        target_market: '',
        product: '',
        business_stage: '',
        hours: '',
        experience: '',
      },
    };

    const result = await collection.insertOne(newUser);
    res.status(200).json({ insertedId: result.insertedId });
  } catch (error) {
    console.error('Error in /api/signup:', error);
    res
      .status(500)
      .json({ error: 'An error occurred while processing your request.', details: error.message });
  }
});

// Setup route
app.post('/api/setup', ensureAuthenticated, async (req, res) => {
  const { question1, question2, question3, question4, question5, question6 } = req.body;

  try {
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

// Get all business info Route. Separate it out in the client code.
app.get('/api/user/business-info', ensureAuthenticated, async (req, res) => {
  try {
    const database = client.db('users');
    const collection = database.collection('users');

    const user = await collection.findOne({ _id: new ObjectId(req.user._id) });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const businessInfo = user.businessInfo;
    res.status(200).json({ businessInfo });
  } catch (error) {
    console.error('Error in /api/user/business-info:', error);
    res.status(500).json({ error: 'An error occurred while fetching business info.' });
  }
});

// Get a specific user's process Route
app.get('/api/user/processes/:processName', ensureAuthenticated, async (req, res) => {
  const processName = req.params.processName;

  try {
    const database = client.db('users');
    const collection = database.collection('users');

    const user = await collection.findOne({ _id: new ObjectId(req.user._id) });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (user.processes.hasOwnProperty(processName)) {
      return res.status(200).json({ process: user.processes[processName] });
    } else {
      return res.status(404).json({ error: 'Process not found.' });
    }
  } catch (error) {
    console.error('Error in /api/user/processes/:processName:', error);
    res.status(500).json({ error: 'An error occurred while fetching the user process.' });
  }
});

// Update a specific user's process Route
app.put('/api/user/processes/:processName', ensureAuthenticated, async (req, res) => {
  const processName = req.params.processName;
  const updatedProcess = req.body;

  try {
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
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

// Update the business info data API
async function updateBusinessInfo(userId, key, content) {
  try {
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
  }
}

app.post('/api/update-business-info', ensureAuthenticated, async (req, res) => {
  try {
    const { key, content } = req.body;

    await updateBusinessInfo(req.user._id, key, content);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error updating business info:', error);
    res.status(500).json({ error: 'Error updating business info' });
  }
});

// Analysis backend API
const openai = new OpenAIApi(new Configuration({
  apiKey: process.env.API_KEY,
}));

async function getUser(userId) {
  try {
    const database = client.db('users');
    const collection = database.collection('users');

    const user = await collection.findOne({ _id: new ObjectId(userId) });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  } catch (error) {
    console.error('Error getting user:', error);
    throw error;
  }
}

async function generatePrompt(userId, tone, maxWords, analysisScope) {
  try {
    const userData = await getUser(userId);

    let processScope;
    if (analysisScope === 0) {
      processScope = 'the whole business';
    } else {
      processScope = `constrained to the ${analysisScope}`;
    }

    const businessInfo = JSON.stringify(userData.businessInfo, null, 2);
    const processInfo = JSON.stringify(userData.processes, null, 2);

    let prompt = `**General**

    You are BusinessAnalystGPT, a guide for small businesses to make wise choices for success. You'll receive JSON data with two categories: general information and processes. Analyze and suggest changes using the following criteria:
    
    1. Improve process requirements.
    2. Remove unnecessary parts or entire processes.
    3. Simplify and optimize.
    4. Accelerate time cycle.
    5. Automate tasks.
    
    Let's get started.
    
    **Business Information:**
    
    ${businessInfo}
    
    **Process Information:**
    
    ${processInfo}
    
    Couple more things to keep in mind:
    
    Tone: You are to be ${tone}
    
    Length: Your response length should be ${maxWords}

    Response scope: You are given context of the whole business. For this question, your response scope should be ${processScope}.`;

    return prompt;
  } catch (error) {
    console.error('Error generating prompt:', error);
    throw error;
  }
}

async function getAnalyzed(userId, tone, maxWords, analysisScope) {
  try {
    const analysisPrompt = await generatePrompt(userId, tone, maxWords, analysisScope);

    let analysisReturned = '';
    await openai
      .createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: analysisPrompt }],
      })
      .then((response) => {
        analysisReturned = response.data.choices[0].message.content;
      });

    return analysisReturned;
  } catch (error) {
    console.error('Error in getAnalyzed:', error);
    throw error;
  }
}

app.post('/api/analysis', ensureAuthenticated, async (req, res) => {
  const { userId, lengthOfResponse, analysisScope, tone } = req.body;

  try {
    const analysisResult = await getAnalyzed(userId, tone, lengthOfResponse, analysisScope);
    res.status(200).json({ message: analysisResult });
  } catch (error) {
    console.error('Error in /api/analysis:', error);
    res.status(500).json({ message: 'An error occurred while processing your request.' });
  }
});


//CREATING AND DELETING PROCESSES ROUTES
//Creating process
app.post('/api/user/processes/create', ensureAuthenticated, async (req, res) => {
  const { processName, processSteps } = req.body;

  try {
    const database = client.db('users');
    const collection = database.collection('users');

    // Use $set to update the specific field in the document.
    const result = await collection.updateOne(
      { _id: new ObjectId(req.user._id) },
      { $set: { [`processes.${processName}`]: processSteps } }
    );

    if(result.modifiedCount === 1) {
      res.status(200).json({ message: "Process added successfully." });
    } else {
      res.status(400).json({ message: "Process creation failed." });
    }
  } catch (error) {
    console.error('Error in /api/user/processes/create:', error);
    res.status(500).json({ error: 'An error occurred while creating the process.' });
  }
});

//Get Processes Route
app.get('/api/user/processes', ensureAuthenticated, async (req, res) => {
  try {
    const database = client.db('users');
    const collection = database.collection('users');

    // Find the document for the current user
    const user = await collection.findOne({ _id: new ObjectId(req.user._id) });

    if (user) {
      res.status(200).json({ processes: user.processes });
    } else {
      res.status(404).json({ message: "User not found." });
    }
  } catch (error) {
    console.error('Error in /api/user/processes:', error);
    res.status(500).json({ error: 'An error occurred while fetching the processes.' });
  }
});

// Get Process Route for parsing JSON to regular format
app.get('/api/user/process', ensureAuthenticated, async (req, res) => {
  try {
    const database = client.db('users');
    const collection = database.collection('users');

    const user = await collection.findOne({ _id: new ObjectId(req.user._id) });

    if (user) {
      const { processName } = req.query;
      const process = user.processes[processName];

      if (process && Array.isArray(process)) {
        res.status(200).json(process);
      } else {
        res.status(404).json({ message: 'Process not found.' });
      }
    } else {
      res.status(404).json({ message: 'User not found.' });
    }
  } catch (error) {
    console.error('Error in /api/user/process:', error);
    res.status(500).json({ error: 'An error occurred while fetching the process.' });
  }
});





//Deleting process
app.delete('/api/user/processes/delete', ensureAuthenticated, async (req, res) => {
  const { processName } = req.body;

  try {
    const database = client.db('users');
    const collection = database.collection('users');

    // Use $unset to remove the specific field from the document.
    const result = await collection.updateOne(
      { _id: new ObjectId(req.user._id) },
      { $unset: { [`processes.${processName}`]: "" } }
    );

    if(result.modifiedCount === 1) {
      res.status(200).json({ message: "Process deleted successfully." });
    } else {
      res.status(400).json({ message: "Process deletion failed." });
    }
  } catch (error) {
    console.error('Error in /api/user/processes/delete:', error);
    res.status(500).json({ error: 'An error occurred while deleting the process.' });
  }
});


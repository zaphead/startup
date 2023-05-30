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
import { Stripe } from 'stripe';


// const stripeSecretKey = process.env.TEST_SECRET_KEY;
const stripeSecretKey = 'sk_test_51NC96zIMorCkqLBZ5Gs1J46Zbl7SY79q8jyXc47IvBjGRC6OFmYeSOiuAn2O19U6lQ0hMBYhNKZhjqytwFERr7GJ001O2AIJ9c';
const stripeClient = new Stripe(stripeSecretKey);



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
      analysisCount: 0, // Add analysisCount parameter with value 0
      firstLogin: 1,
      seenUpdate: 1,
      tier: 'free' //Tier is the version the account is running. free or pro.
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

async function incrementAnalysisCount(userId) {
  try {
    const database = client.db('users');
    const collection = database.collection('users');

    await collection.updateOne({ _id: new ObjectId(userId) }, { $inc: { analysisCount: 1 } });
  } catch (error) {
    console.error('Error incrementing analysisCount:', error);
    throw error;
  }
}

app.post('/api/analysis', ensureAuthenticated, async (req, res) => {
  const { userId, lengthOfResponse, analysisScope, tone } = req.body;

  try {
    // Check if the user has reached the analysis limit for the free tier
    const user = await getUser(userId);
    if (user.tier === 'free' && user.analysisCount >= 15) {
      res.status(400).json({ message: 'You have reached the analysis limit for the free tier. Upgrade to continue.' });
      return;
    }

    // Increment the analysisCount
    await incrementAnalysisCount(userId);

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

// Append process data to the existing process
app.post('/api/user/process/append', ensureAuthenticated, async (req, res) => {
  try {
    const { processName, processData } = req.body;

    const database = client.db('users');
    const collection = database.collection('users');

    const user = await collection.findOne({ _id: new ObjectId(req.user._id) });

    if (user) {
      const process = user.processes[processName];

      if (process && Array.isArray(process)) {
        process.push(...processData);
        await collection.updateOne({ _id: new ObjectId(req.user._id) }, { $set: { processes: user.processes } });
        res.status(200).json({ message: 'Process data appended successfully.' });
      } else {
        res.status(404).json({ message: 'Process not found.' });
      }
    } else {
      res.status(404).json({ message: 'User not found.' });
    }
  } catch (error) {
    console.error('Error appending process data:', error);
    res.status(500).json({ error: 'An error occurred while appending process data.' });
  }
});

// Replace the existing process data with new process data
app.post('/api/user/process/replace', ensureAuthenticated, async (req, res) => {
  try {
    const { processName, processData } = req.body;

    const database = client.db('users');
    const collection = database.collection('users');

    const user = await collection.findOne({ _id: new ObjectId(req.user._id) });

    if (user) {
      user.processes[processName] = processData;
      await collection.updateOne({ _id: new ObjectId(req.user._id) }, { $set: { processes: user.processes } });
      res.status(200).json({ message: 'Process data replaced successfully.' });
    } else {
      res.status(404).json({ message: 'User not found.' });
    }
  } catch (error) {
    console.error('Error replacing process data:', error);
    res.status(500).json({ error: 'An error occurred while replacing process data.' });
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


const endpointSecret = 'whsec_11020ceba14867c47dc7d5c571fff515b121ec8777ed3aa92b0ce32beaa2abf8';


//STRIPE CHECKOUT ROUTE
app.post('/api/checkout-session', ensureAuthenticated, async (req, res) => {
  const { priceId } = req.body;

  try {
    const session = await stripeClient.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: 'http://localhost:4000/main/main.html', // Replace with your success URL
      cancel_url: 'http://localhost:4000/main/main.html', // Replace with your cancel URL
    });

    // Retrieve the user from the database using req.user or any other method you use for authentication
    const user = await client.db('users').collection('users').findOne({ _id: new ObjectId(req.user._id) });

    // Update the user's tier based on the subscription status
    if (session.mode === 'subscription' && session.payment_status === 'paid') {
      user.tier = 'pro';
    } else {
      user.tier = 'free';
    }

    // Save the updated user in the database
    await client.db('users').collection('users').updateOne(
      { _id: new ObjectId(req.user._id) },
      { $set: { tier: user.tier } }
    );

    res.status(200).json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'An error occurred while creating the checkout session.' });
  }
});


app.use(bodyParser.json({
  verify: (req, _, buf) => {
    req.rawBody = buf;
  }
}));


app.post('/webhook', bodyParser.raw({type: 'application/json'}), async (request, response) => {
  console.log('Raw request body:', request.rawBody);
  console.log('Request headers:', request.headers);

  let event;

  try {
    event = stripeClient.webhooks.constructEvent(request.rawBody, request.headers['stripe-signature'], endpointSecret);
  } catch (err) {
    return response.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    // Retrieve the customer from Stripe
    const customer = await stripeClient.customers.retrieve(session.customer);

    // Retrieve the user from the database using the customer email
    const user = await client.db('users').collection('users').findOne({ email: customer.email });

    // Update the user's tier to 'pro'
    user.tier = 'pro';

    // Save the updated user in the database
    await client.db('users').collection('users').updateOne(
      { email: customer.email },
      { $set: { tier: user.tier } }
    );
  }

  // Handle the customer.subscription.deleted event
  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object;

    // Retrieve the customer from Stripe
    const customer = await stripeClient.customers.retrieve(subscription.customer);

    // Retrieve the user from the database using the customer email
    const user = await client.db('users').collection('users').findOne({ email: customer.email });

    // Update the user's tier to 'free'
    user.tier = 'free';

    // Save the updated user in the database
    await client.db('users').collection('users').updateOne(
      { email: customer.email },
      { $set: { tier: user.tier } }
    );
  }

  // Return a response to acknowledge receipt of the event
  response.json({received: true});
});







// Get publishable key
app.get('/api/publishable-key', (req, res) => {
  // const publishableKey = process.env.TEST_PUBLISHABLE_KEY; // Replace with your actual publishable key
  const publishableKey = 'pk_test_51NC96zIMorCkqLBZJhKJxgPJwsODTXaNccmfsr3Sk7sXwmg4AkTezs4mu5ZbJzYCJRuFIolLWuNq91utRL3fzF9C00aQHJ9ulq'; // Replace with your actual publishable key


  if (publishableKey) {
    res.status(200).json({ publishableKey });
  } else {
    res.status(500).json({ error: 'Publishable key not found.' });
  }
});
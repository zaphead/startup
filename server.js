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
import Stripe from 'stripe';

const app = express();
const router = express.Router(); // Create a new router

// Apply the middleware to all routes handled by the router
router.use(bodyParser.json());


// app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

//Config Dotenv
dotenv.config();

//STRIPE VARIABLES
const stripeSecretKey = process.env.TEST_SECRET_KEY;
const stripePublishableKey = process.env.TEST_PUBLISHABLE_KEY;
const stripeClient = new Stripe(stripeSecretKey);


const uri = process.env.MONGODB_URL;
const passport_key = process.env.PASSPORT_KEY;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({ secret: passport_key, resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

const client = new MongoClient(uri);

const connectToMongo = async () => {
  try {
    await client.connect();
    console.log('Connected to MongoDB boiiii');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
};

connectToMongo();

const endpointSecret = 'whsec_r1Ewj9iZtYQ1LW3vRU44VtmRt36p9zfI';



// WEBHOOK ISH
app.post('/webhook', express.raw({type: 'application/json'}), async (request, response) => {
  const sig = request.headers['stripe-signature'];

  let event;

  try {
    event = stripeClient.webhooks.constructEvent(request.body, sig, endpointSecret);
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    response.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Handle the event
  const database = client.db('users');
  const collection = database.collection('users');
  switch (event.type) {
    case 'charge.succeeded':
    case 'invoice.paid':
      const userEmail = event.data.object.customer_email;
      const updateResult = await collection.updateOne({ email: userEmail }, { $set: { tier: 'pro' } });
      console.log(`Updated ${updateResult.modifiedCount} document(s) for ${event.type} event.`);
      break;
    case 'charge.failed':
    case 'invoice.payment_failed':
    case 'customer.subscription.deleted':
      const userEmailFailed = event.data.object.customer_email;
      const updateResultFailed = await collection.updateOne({ email: userEmailFailed }, { $set: { tier: 'free' } });
      console.log(`Updated ${updateResultFailed.modifiedCount} document(s) for ${event.type} event.`);
      break;
    case 'customer.subscription.updated':
      const userEmailUpdated = event.data.object.customer_email;
      const status = event.data.object.status;
      const updateResultUpdated = await collection.updateOne({ email: userEmailUpdated }, { $set: { tier: status === 'active' ? 'pro' : 'free' } });
      console.log(`Updated ${updateResultUpdated.modifiedCount} document(s) for customer.subscription.updated event.`);
      break;
    case 'checkout.session.completed':
      const userEmailSession = event.data.object.customer_email;
      const updateResultSession = await collection.updateOne({ email: userEmailSession }, { $set: { stripeSubscriptionId: event.data.object.subscription } });
      console.log(`Updated ${updateResultSession.modifiedCount} document(s) for checkout.session.completed event.`);
      break;
    case 'customer.updated':
      const userEmailCustomerUpdated = event.data.object.email;
      const updateResultCustomerUpdated = await collection.updateOne({ email: userEmailCustomerUpdated }, { $set: { stripeCustomerId: event.data.object.id } });
      console.log(`Updated ${updateResultCustomerUpdated.modifiedCount} document(s) for customer.updated event.`);
      break;
    case 'checkout.session.expired':
      console.log(`Checkout session expired for customer: ${event.data.object.customer_email}`);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  response.send();
});




//CANCEL STRIPE SUBSCRIPTION
router.post('/create-cancellation-session', async (req, res) => {
  const { customerId } = req.body;

  try {
    const session = await stripeClient.billingPortal.sessions.create({
      customer: customerId,
      return_url: 'http://localhost:4000/'
    });

    res.send({ url: session.url });
  } catch (error) {
    console.error('Failed to create cancellation session:', error);
    res.status(500).send('Failed to create cancellation session');
  }
});





//GET STRIPE USER DATA
router.get('/get-user-data', async (req, res) => {
  // Assuming you have a way to get the current user's ID
  const userId = getCurrentUserId(req);

  // Fetch the user's data from the database
  const database = client.db('users');
  const collection = database.collection('users');
  const user = await collection.findOne({ _id: userId });

  if (!user) {
    res.status(404).send('User not found');
    return;
  }

  // Send the user's data to the client
  res.json({
    stripeCustomerId: user.stripeCustomerId,
    stripeSubscriptionId: user.stripeSubscriptionId
  });
});







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

      // Check the user's subscription status with Stripe
      if (user.stripeSubscriptionId) {
        const subscription = await stripeClient.subscriptions.retrieve(user.stripeSubscriptionId);

        // Update the user's tier based on the subscription status
        let tier;
        if (subscription.status === 'active') {
          tier = 'pro';
        } else {
          tier = 'free';
        }

        await collection.updateOne({ _id: new ObjectId(user._id) }, { $set: { tier } });
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
router.post('/api/login', passport.authenticate('local'), (req, res) => {
  res.status(200).json({ message: 'Login successful.' });
});

router.get('/api/logout', (req, res) => {
  req.logout();
  res.status(200).json({ message: 'Logout successful.' });
});

router.get('/api/user', ensureAuthenticated, (req, res) => {
  res.status(200).json({ user: req.user });
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized access.' });
}

// Signup route
router.post('/api/signup', async (req, res) => {
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
router.post('/api/setup', ensureAuthenticated, async (req, res) => {
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
router.get('/api/user/name', ensureAuthenticated, async (req, res) => {
  try {
    const { name } = req.user;
    res.status(200).json({ name });
  } catch (error) {
    console.error('Error in /api/user/name:', error);
    res.status(500).json({ error: 'An error occurred while fetching the user name.' });
  }
});

// Get all business info Route. Separate it out in the client code.
router.get('/api/user/business-info', ensureAuthenticated, async (req, res) => {
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
router.get('/api/user/processes/:processName', ensureAuthenticated, async (req, res) => {
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
router.put('/api/user/processes/:processName', ensureAuthenticated, async (req, res) => {
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

router.post('/api/update-business-info', ensureAuthenticated, async (req, res) => {
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

    //Replace input with actual prompt variables
    if (tone === 'Roast') {
      tone = "Roast the business and it's strategies. Be critical, harsh and don't hold back. Be absolutely BRUTAL. Make it as personal as possible. Also throw in a few snarky jokes in the roast."
    }
    if (tone === 'anger') {
      tone = "Anger. AlTeRnAtE bEtWeEn CaPiTaL aNd LoWeRcAsE lEtTeRs WiThIn A wOrD, mAiNtAiNiNg ThE oRiGiNaL lEtTeR oRdEr. 'tHiS iS aN aNgRy tExT'. AlWaYs UsE aLtErNaTiNg CaPiTaLs. uSe AlTeRnAtInG cApItAlS."
    }
    if (tone === 'straightForward') {
      tone = "straight forward"
    }
    if (tone === 'soft') {
      tone = "Be soft and gentle with the analysis"
    }

    const businessInfo = JSON.stringify(userData.businessInfo, null, 2);
    const processInfo = JSON.stringify(userData.processes, null, 2);

    let prompt = `**General**

    You are BusinessAnalystGPT, a guide for small businesses to make wise choices for success. You'll receive JSON data with two categories: general information and processes. Analyze and suggest changes using the following criteria:
    Additionally, even though you're being given JSON data, you should interpret it as regular text, so in your response don't mention that it's JSON and don't include any syntax such as hyphens or underscores. For example say "Business name" instead of business_name.

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

router.post('/api/analysis', ensureAuthenticated, async (req, res) => {
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




//====================================================================================//
//==============================MODIFYING OBJECTS ROUTES==============================//
//====================================================================================//



//CREATING OBJECTS ROUTES
// Route for creating a new object
router.post('/api/user/objects', ensureAuthenticated, async (req, res) => {
  const { objectType, name } = req.body;

  // Check if the required fields are provided
  if (!objectType || !name) {
    return res.status(400).json({ error: 'Missing objectType or name in the request body' });
  }

  try {
    const database = client.db('users');
    const collection = database.collection('users');

    // Find the document for the current user
    const user = await collection.findOne({ _id: new ObjectId(req.user._id) });

    if (user) {
      let updatedObject;

      switch (objectType) {
        case 'process':
          if (!user.processes) {
            user.processes = {};
          }
          user.processes[name] = [];
          updatedObject = { processes: user.processes };
          break;
        case 'list':
          if (!user.lists) {
            user.lists = {};
          }
          user.lists[name] = [];
          updatedObject = { lists: user.lists };
          break;
        case 'table':
          if (!user.tables) {
            user.tables = {};
          }
          user.tables[name] = [];
          updatedObject = { tables: user.tables };
          break;
        case 'calendar':
          if (!user.calendars) {
            user.calendars = {};
          }
          user.calendars[name] = [];
          updatedObject = { calendars: user.calendars };
          break;
        default:
          return res.status(400).json({ error: 'Invalid objectType' });
      }

      await collection.updateOne({ _id: new ObjectId(req.user._id) }, { $set: updatedObject });

      res.status(200).json({ message: 'Object created successfully.' });
    } else {
      res.status(404).json({ message: 'User not found.' });
    }
  } catch (error) {
    console.error('Error in /api/user/objects:', error);
    res.status(500).json({ error: 'An error occurred while creating the object.' });
  }
});




//====================================================================================//
//==============================VIEWING OBJECTS ROUTES==============================//
//====================================================================================//


// Get all objects
router.get('/api/user/objects', ensureAuthenticated, async (req, res) => {
  try {
    const database = client.db('users');
    const collection = database.collection('users');

    // Find the document for the current user
    const user = await collection.findOne({ _id: new ObjectId(req.user._id) });

    if (user) {
      // Extract all objects
      const objects = [];

      if (user.processes) {
        Object.keys(user.processes).forEach((processName) => {
          objects.push({ objectType: 'process', name: processName });
        });
      }

      if (user.lists) {
        Object.keys(user.lists).forEach((listName) => {
          objects.push({ objectType: 'list', name: listName });
        });
      }

      if (user.tables) {
        Object.keys(user.tables).forEach((tableName) => {
          objects.push({ objectType: 'table', name: tableName });
        });
      }

      if (user.calendars) {
        Object.keys(user.calendars).forEach((calendarName) => {
          objects.push({ objectType: 'calendar', name: calendarName });
        });
      }

      res.status(200).json({ objects });
    } else {
      res.status(404).json({ message: 'User not found.' });
    }
  } catch (error) {
    console.error('Error in /api/user/objects:', error);
    res.status(500).json({ error: 'An error occurred while fetching the objects.' });
  }
});


//====================================================================================//
//==============================DELETING OBJECTS ROUTES==============================//
//====================================================================================//


// Delete an object
router.delete('/api/user/objects/:objectName', ensureAuthenticated, async (req, res) => {
  const { objectName } = req.params;
  console.log(`Received DELETE request for object: ${objectName}`);

  try {
    const database = client.db('users');
    const collection = database.collection('users');

    // Find the document for the current user
    const user = await collection.findOne({ _id: new ObjectId(req.user._id) });
    console.log(`User found: ${user ? 'Yes' : 'No'}`);

    if (user) {
      let updatedObject;
      console.log(`ObjectType from request body: ${req.body.objectType}`);

      switch (req.body.objectType) {
        case 'process':
          if (user.processes && user.processes[objectName]) {
            delete user.processes[objectName];
            updatedObject = { processes: user.processes };
          }
          break;
        case 'list':
          if (user.lists && user.lists[objectName]) {
            delete user.lists[objectName];
            updatedObject = { lists: user.lists };
          }
          break;
        case 'table':
          if (user.tables && user.tables[objectName]) {
            delete user.tables[objectName];
            updatedObject = { tables: user.tables };
          }
          break;
        case 'calendar':
          if (user.calendars && user.calendars[objectName]) {
            delete user.calendars[objectName];
            updatedObject = { calendars: user.calendars };
          }
          break;
        default:
          console.log('Invalid objectType');
          return res.status(400).json({ error: 'Invalid objectType' });
      }

      if (updatedObject) {
        await collection.updateOne({ _id: new ObjectId(req.user._id) }, { $set: updatedObject });
        console.log(`Object ${objectName} deleted successfully`);
        res.status(200).json({ message: 'Object deleted successfully.' });
      } else {
        console.log(`Object ${objectName} not found.`);
        res.status(404).json({ message: 'Object not found.' });
      }
    } else {
      console.log('User not found');
      res.status(404).json({ message: 'User not found.' });
    }
  } catch (error) {
    console.error('Error in /api/user/objects/:objectName:', error);
    res.status(500).json({ error: 'An error occurred while deleting the object.' });
  }
});












//CREATING AND DELETING PROCESSES ROUTES
//Creating process
router.post('/api/user/processes/create', ensureAuthenticated, async (req, res) => {
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
router.get('/api/user/processes', ensureAuthenticated, async (req, res) => {
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
router.post('/api/user/process/append', ensureAuthenticated, async (req, res) => {
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
router.post('/api/user/process/replace', ensureAuthenticated, async (req, res) => {
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
router.get('/api/user/process', ensureAuthenticated, async (req, res) => {
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
router.delete('/api/user/processes/delete', ensureAuthenticated, async (req, res) => {
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




//STRIPE CHECKOUT

// Parsing for Stripe Integration
app.use(express.json({
  verify: function(req, res, buf) {
    if (req.originalUrl.startsWith('/webhook')) {
      req.rawBody = buf.toString();
    } else {
      req.body = JSON.parse(buf.toString());
    }
  }
}));



router.post('/api/checkout-session', ensureAuthenticated, async (req, res) => {
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
      customer_email: req.user.email, // Pass the user's email to Stripe
    });

    // Store the Stripe subscription ID in MongoDB
    const database = client.db('users');
    const collection = database.collection('users');
    await collection.updateOne({ _id: new ObjectId(req.user._id) }, { $set: { stripeSubscriptionId: session.subscription } });

    res.status(200).json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'An error occurred while creating the checkout session.' });
  }
});









// Get publishable key
app.get('/api/publishable-key', (req, res) => {
  // const publishableKey = process.env.TEST_PUBLISHABLE_KEY; // Replace with your actual publishable key
  const publishableKey = stripePublishableKey; // Replace with your actual publishable key


  if (publishableKey) {
    res.status(200).json({ publishableKey });
  } else {
    res.status(500).json({ error: 'Publishable key not found.' });
  }
});



app.use(router);

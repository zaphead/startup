//GET ANALYZED FUNCTION
import { config } from "dotenv";
import { Configuration, OpenAIApi } from "openai";

//Prompt formatter stuff:
import fs from 'fs';


//Back to get analyzed

config();

const openai = new OpenAIApi(new Configuration({
  apiKey: process.env.API_KEY
}));

function getAnalyzed(prompt_param) {
  const analysis_prompt = prompt_param

  openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: analysis_prompt }],
  })
    .then(response => {
      const analysisReturned = response.data.choices[0].message.content;
      console.log(analysisReturned);
      return analysisReturned;
    });
}


//PROMPT FORMATTER

function generatePrompt(businessInfoPath, processInfoPath, tone, maxWords, processNumber) {
  const businessInfo = fs.readFileSync(businessInfoPath, 'utf8');
  const processInfo = fs.readFileSync(processInfoPath, 'utf8');

  let processScope;
  if (processNumber === 0) {
    processScope = 'the whole business';
  } else {
    processScope = `constrained to process ${processNumber}`;
  }

  let prompt = `**General**

You are BusinessAnalystGPT, a guide for small businesses to make wise choices for success. You'll receive JSON data with two categories: general information and processes. Analyze and suggest changes using the following criteria:

1. Improve process requirements.
2. Remove unnecessary parts or entire processes.
3. Simplify and optimize.
4. Accelerate time cycle.
5. Automate tasks.

Let's get started.

**Business Information:**

//This could be a query to the bizinfo section of the document
${businessInfo}

**Process Information:**

//A query to the processes section of the document
${processInfo}

Couple more things to keep in mind:

Tone: You are to be ${tone}

Length: You are to write ${maxWords === -1 ? 'as much as you want' : 'no more than ' + maxWords + ' words'}

Response scope: You are given context of the whole business. For this question your response scope should be ${processScope}.`;

  return prompt;
}

// Example usage
const businessInfoPath = '../json_library/business_json/bizinfo.json';
const processInfoPath = '../json_library/process_json/processes.json';
const tone = 'cutthroat. no beating around the bush. be absolutely brutal. Give a subtle roast at the end.'; // or "cutthroat. No beating around the bush"
const maxWords = 150; // Set to -1 for unlimited words
const processNumber = 3; // The process number to be analyzed (set to 0 for the whole business)

let analysisPrompt = generatePrompt(businessInfoPath, processInfoPath, tone, maxWords, 1);


const prompt = generatePrompt(businessInfoPath, processInfoPath, tone, maxWords, 1);


import fs from 'fs';


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

${businessInfo}

**Process Information:**

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
const tone = 'reasonable'; // or "cutthroat"
const maxWords = 150; // Set to -1 for unlimited words
const processNumber = 3; // The process number to be analyzed (set to 0 for the whole business)

let analysisPrompt = generatePrompt(businessInfoPath, processInfoPath, tone, maxWords, 0);

console.log(analysisPrompt);

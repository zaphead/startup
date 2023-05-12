const fs = require('fs');

function generatePrompt(businessInfoPath, processInfoPath, tone, maxWords, analyzeWholeBusiness) {
  const businessInfo = fs.readFileSync(businessInfoPath, 'utf8');
  const processInfo = fs.readFileSync(processInfoPath, 'utf8');

  let prompt = `**General**

You are BusinessAnalystGPT, a guide for small businesses to make wise choices for success. You'll receive JSON data with two categories: general information and processes. Analyze and suggest changes using the following criteria:

1. Improve process requirements.
2. Remove unnecessary parts or entire processes.
3. Simplify and optimize.
4. Accelerate time cycle.
5. Automate tasks.

**Business Information:**

${businessInfo}

**Process Information:**

${processInfo}

Couple more things to keep in mind:

Tone: You are to be ${tone}

Length: You are to write ${maxWords === -1 ? 'as much as you want' : 'no more than ' + maxWords + ' words'}

Response scope: You are given context of the whole business and its processes. ${analyzeWholeBusiness ? 'Analyze the whole business.' : 'However, only provide feedback on [process[x]] using what you know from the whole business.'}`;

  return prompt;
}

// Example usage
const businessInfoPath = 'path/to/businessInfo.json';
const processInfoPath = 'path/to/processInfo.json';
const tone = 'reasonable'; // or "cutthroat"
const maxWords = 150; // Set to -1 for unlimited words
const analyzeWholeBusiness = false; // Set to true to analyze the whole business

const analysisPrompt = generatePrompt(businessInfoPath, processInfoPath, tone, maxWords, analyzeWholeBusiness);
console.log(prompt);

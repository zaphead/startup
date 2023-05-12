import { config } from "dotenv";
import { Configuration, OpenAIApi } from "openai";

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
    });
}

export function getAnalyzed()
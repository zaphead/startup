import { config } from "dotenv"
config()

import { Configuration, OpenAIApi } from "openai"

const openai = new OpenAIApi(new Configuration({

apiKey: process.env.API_KEY

}))

const analysis_prompt = "hello"

openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [{ role:"user", content: analysis_prompt}],
})

.then(response => {
    const analysisReturned = response.data.choices[0].message.content
    console.log(analysisReturned)
})



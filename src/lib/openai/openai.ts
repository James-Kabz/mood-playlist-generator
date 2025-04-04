import dotenv from "dotenv"
import OpenAI from "openai"

dotenv.config()
// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export default openai


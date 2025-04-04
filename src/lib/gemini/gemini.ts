import { GoogleGenerativeAI } from "@google/generative-ai"

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

export default genAI


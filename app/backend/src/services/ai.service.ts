import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface CompatibilityResponse {
  label: 'High Potential' | 'Good Fit' | 'Compatible' | 'Tentative';
  reasoning: string;
}

export interface EmailResponse {
  subject: string;
  body: string;
}

/**
 * Clean model response text to ensure it parses correctly as JSON
 */
function parseJsonResponse<T>(text: string): T {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?|```$/g, '').trim();
  }
  return JSON.parse(cleaned) as T;
}

/**
 * Score compatibility between two profiles using Gemini
 */
export async function getCompatibilityScoring(customer: any, candidate: any): Promise<CompatibilityResponse> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-3.1-flash-lite',
    generationConfig: {
      responseMimeType: 'application/json',
    },
    systemInstruction: `You are an expert matchmaking assistant for 'The Date Crew' (TDC), an elite Indian matrimonial service.
Analyze the two profiles provided (Customer and Candidate). Output a JSON block:
{
  "label": "High Potential" | "Good Fit" | "Compatible" | "Tentative",
  "reasoning": "A single-sentence, warm but objective explanation focusing on shared values, location, diet, or career compatibility."
}
Strictly output JSON only.`,
  });

  const prompt = JSON.stringify({ customer, candidate });
  const result = await model.generateContent(prompt);
  const responseText = result.response.text();
  return parseJsonResponse<CompatibilityResponse>(responseText);
}

/**
 * Generate a personalized outreach email draft using Gemini
 */
export async function generateIntroEmail(customer: any, candidate: any): Promise<EmailResponse> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-3.1-flash-lite',
    generationConfig: {
      responseMimeType: 'application/json',
    },
    systemInstruction: `You are an elite matchmaker writing an introduction email from 'The Date Crew'.
Compose an introduction email to the client, presenting the candidate.
Use details from both profiles (careers, values, locations) to make it highly personalized.
Tone: Warm, premium, professional, matches Indian matrimonial context.
Keep the length under 300 words. Return JSON containing "subject" and "body" keys.`,
  });

  const prompt = JSON.stringify({ customer, candidate });
  const result = await model.generateContent(prompt);
  const responseText = result.response.text();
  return parseJsonResponse<EmailResponse>(responseText);
}

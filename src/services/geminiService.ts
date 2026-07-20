import { GoogleGenerativeAI } from "@google/generative-ai";

export async function getEndocardResponse(prompt: string, location?: { lat: number; lng: number }) {
  try {
    const ai = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');
    const model = ai.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: `You are Endocard, a highly capable AI assistant for a luxury all-in-one social app. 
        Your primary tasks are to:
        1. Help users order food and recommend nearby restaurants.
        2. Create and manage appointments or schedules.
        3. Find local products and services (shops, malls, restaurants).
        4. Assist with social interactions and product descriptions in the Cascadea shop.
        
        Be proactive, polite, and efficient.`,
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return { text, grounding: [] };
  } catch (error) {
    console.error("Endocard API Error:", error);
    return { text: "I'm having a bit of trouble connecting to my systems. Please try again in a moment!", grounding: [] };
  }
}
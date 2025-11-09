
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const translateSrt = async (srtContent: string, targetLanguage: string): Promise<string> => {
  const systemInstruction = `You are an expert SRT file translator. Your sole purpose is to translate the text content of SRT files into a specified language while keeping the formatting (sequence numbers, timestamps) identical to the original.
  - DO NOT translate or alter sequence numbers.
  - DO NOT translate or alter timestamps.
  - ONLY translate the subtitle text.
  - DO NOT add any introductory text, concluding remarks, or explanations.
  - The output must be ONLY the translated SRT content, maintaining the exact original structure.`;

  const prompt = `Translate the following SRT subtitle content into ${targetLanguage}:\n\n${srtContent}`;

  try {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            systemInstruction: systemInstruction,
            temperature: 0.2,
        },
    });

    return response.text.trim();
  } catch (error) {
    console.error("Error translating SRT content:", error);
    throw new Error("Failed to translate subtitles. Please check the console for more details.");
  }
};

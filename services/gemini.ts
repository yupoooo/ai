import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { AspectRatio } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Constants
const MODEL_NAME = 'gemini-2.5-flash-image';

/**
 * Generates an image from a text prompt.
 */
export const generateImageFromText = async (
  prompt: string,
  aspectRatio: AspectRatio
): Promise<string> => {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio,
        },
      },
    });

    return extractImageFromResponse(response);
  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
};

/**
 * Edits an existing image based on a text prompt.
 */
export const editImageWithText = async (
  base64Image: string,
  prompt: string,
  aspectRatio: AspectRatio = "1:1" // Aspect ratio is usually preserved or set for the output
): Promise<string> => {
  try {
    // Remove header if present (e.g., "data:image/png;base64,")
    const cleanBase64 = base64Image.split(',')[1] || base64Image;
    
    // Attempt to extract mime type from data URI
    let mimeType = 'image/png';
    const mimeMatch = base64Image.match(/data:(.*?);base64/);
    if (mimeMatch) {
      mimeType = mimeMatch[1];
    }

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType, 
              data: cleanBase64,
            },
          },
          { text: prompt },
        ],
      },
      // Note: Image editing via gemini-2.5-flash-image follows generateContent patterns
      // We can specify output config similar to generation
      config: {
          imageConfig: {
              aspectRatio: aspectRatio
          }
      }
    });

    return extractImageFromResponse(response);
  } catch (error) {
    console.error("Error editing image:", error);
    throw error;
  }
};

/**
 * Helper to extract the image data from the Gemini response.
 */
const extractImageFromResponse = (response: GenerateContentResponse): string => {
  if (!response.candidates || response.candidates.length === 0) {
    throw new Error("No candidates returned from Gemini API");
  }

  const parts = response.candidates[0].content?.parts;
  
  if (!parts) {
      throw new Error("No content parts found in response");
  }
  
  for (const part of parts) {
    if (part.inlineData) {
      const base64String = part.inlineData.data;
      // Determine mime type if available, default to png for data URI
      const mimeType = part.inlineData.mimeType || 'image/png';
      return `data:${mimeType};base64,${base64String}`;
    }
  }

  // If we only got text back (sometimes models explain why they can't do it)
  for (const part of parts) {
    if (part.text) {
      throw new Error(`Model returned text instead of image: ${part.text}`);
    }
  }

  throw new Error("No image data found in response");
};

/**
 * Helper to convert a File object to a Base64 string.
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};
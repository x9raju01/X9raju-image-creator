import { GoogleGenAI } from "@google/genai";

export type ImageSize = "512px" | "1K" | "2K" | "4K";
export type AspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9";

export interface GenerateImageOptions {
  prompt: string;
  size: ImageSize;
  aspectRatio: AspectRatio;
}

export async function generateImage({ prompt, size, aspectRatio }: GenerateImageOptions) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  const response = await ai.models.generateContent({
    model: 'gemini-3.1-flash-image-preview',
    contents: {
      parts: [
        {
          text: prompt,
        },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: aspectRatio,
        imageSize: size
      },
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      const base64EncodeString = part.inlineData.data;
      return `data:image/png;base64,${base64EncodeString}`;
    }
  }
  
  throw new Error("No image data returned from the model.");
}

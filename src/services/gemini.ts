import ENV from '@/config/env';
import { AIRecipeExtraction } from '@/types';

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

export class GeminiService {
  private apiKey = ENV.GEMINI_API_KEY;
  private apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
  private visionApiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent';

  async extractRecipeFromUrl(url: string): Promise<AIRecipeExtraction> {
    try {
      const response = await fetch(url);
      const html = await response.text();
      
      const textContent = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 10000);

      const prompt = `Extract recipe information from this webpage content and return it as a JSON object.
      
Content:
${textContent}

Return a JSON object with this exact structure:
{
  "title": "recipe title",
  "description": "brief description",
  "prep_time": number (in minutes),
  "cook_time": number (in minutes),
  "servings": number,
  "difficulty": "easy" | "medium" | "hard",
  "category": "category name",
  "cuisine_type": "cuisine type",
  "dietary_labels": ["label1", "label2"],
  "ingredients": [
    {
      "name": "ingredient name",
      "quantity": number,
      "unit": "unit",
      "category": "Produce" | "Dairy" | "Meat" | "Pantry" | "Spices"
    }
  ],
  "instructions": [
    {
      "step_number": 1,
      "instruction_text": "instruction text",
      "duration_minutes": number (optional)
    }
  ],
  "nutrition_info": {
    "calories": number,
    "protein": number,
    "carbs": number,
    "fats": number
  }
}`;

      const apiResponse = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt,
            }],
          }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 2048,
          },
        }),
      });

      if (!apiResponse.ok) {
        throw new Error('Gemini API request failed');
      }

      const data: GeminiResponse = await apiResponse.json();
      const textResponse = data.candidates[0]?.content?.parts[0]?.text || '';
      
      const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const recipe: AIRecipeExtraction = JSON.parse(jsonMatch[0]);
      return recipe;
    } catch (error) {
      console.error('Extract from URL error:', error);
      throw error;
    }
  }

  async extractRecipeFromImage(imageBase64: string): Promise<AIRecipeExtraction> {
    try {
      const prompt = `Analyze this recipe image and extract all recipe information. Return it as a JSON object with this structure:
{
  "title": "recipe title",
  "description": "brief description",
  "prep_time": number (in minutes),
  "cook_time": number (in minutes),
  "servings": number,
  "difficulty": "easy" | "medium" | "hard",
  "category": "category name",
  "cuisine_type": "cuisine type",
  "dietary_labels": ["label1", "label2"],
  "ingredients": [
    {
      "name": "ingredient name",
      "quantity": number,
      "unit": "unit",
      "category": "Produce" | "Dairy" | "Meat" | "Pantry" | "Spices"
    }
  ],
  "instructions": [
    {
      "step_number": 1,
      "instruction_text": "instruction text",
      "duration_minutes": number (optional)
    }
  ],
  "nutrition_info": {
    "calories": number,
    "protein": number,
    "carbs": number,
    "fats": number
  }
}`;

      const apiResponse = await fetch(`${this.visionApiUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: 'image/jpeg',
                  data: imageBase64.split(',')[1] || imageBase64,
                },
              },
            ],
          }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 2048,
          },
        }),
      });

      if (!apiResponse.ok) {
        throw new Error('Gemini Vision API request failed');
      }

      const data: GeminiResponse = await apiResponse.json();
      const textResponse = data.candidates[0]?.content?.parts[0]?.text || '';
      
      const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const recipe: AIRecipeExtraction = JSON.parse(jsonMatch[0]);
      return recipe;
    } catch (error) {
      console.error('Extract from image error:', error);
      throw error;
    }
  }

  async identifyFoodFromImage(imageBase64: string): Promise<string[]> {
    try {
      const prompt = `Identify the food items in this image. Return only a JSON array of food names, like: ["pizza", "salad", "pasta"]`;

      const apiResponse = await fetch(`${this.visionApiUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: 'image/jpeg',
                  data: imageBase64.split(',')[1] || imageBase64,
                },
              },
            ],
          }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 256,
          },
        }),
      });

      if (!apiResponse.ok) {
        throw new Error('Gemini Vision API request failed');
      }

      const data: GeminiResponse = await apiResponse.json();
      const textResponse = data.candidates[0]?.content?.parts[0]?.text || '';
      
      const jsonMatch = textResponse.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        return [];
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Identify food error:', error);
      return [];
    }
  }
}

export const geminiService = new GeminiService();

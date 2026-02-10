
import { GoogleGenAI, Type } from "@google/genai";
import { User, Event } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface EventMatch {
  score: number;
  reasoning: string[];
  skillGains: string[];
  careerRelevance: string;
}

export interface PortfolioStrategy {
  detectedGaps: string[];
  careerRoadmap: string;
  recommendedEventIds: string[];
}

export const getEventMatchScore = async (user: User, event: Event): Promise<EventMatch> => {
  const prompt = `
    Analyze how well this event fits a photographer's career goals.
    
    PHOTOGRAPHER PROFILE:
    - Target Role: ${user.targetRole || 'General Photographer'}
    - Skills: ${user.skills.join(', ')}
    - Goals: ${user.careerGoals || 'Build professional portfolio'}
    
    EVENT DETAILS:
    - Title: ${event.title}
    - Description: ${event.description}
    - Roles: ${event.roles.map(r => r.title).join(', ')}
    - Tags: ${event.tags.join(', ')}

    Return a score (0-100) and specific reasons why this event is or isn't a good fit.
    Focus on: Portfolio Value, Skill Growth, and Career Alignment.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            reasoning: { type: Type.ARRAY, items: { type: Type.STRING } },
            skillGains: { type: Type.ARRAY, items: { type: Type.STRING } },
            careerRelevance: { type: Type.STRING }
          },
          required: ['score', 'reasoning', 'skillGains', 'careerRelevance']
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Match Error:", error);
    return { score: 0, reasoning: [], skillGains: [], careerRelevance: 'Error analyzing fit.' };
  }
};

export const getPortfolioGapAnalysis = async (user: User, events: Event[]): Promise<PortfolioStrategy> => {
  const prompt = `
    Act as a high-end photography career advisor. 
    Analyze the photographer's profile and recommend events from the marketplace that fill their portfolio gaps.
    
    PROFILE:
    - Target: ${user.targetRole || 'Commercial Photographer'}
    - Current Skills: ${user.skills.join(', ')}
    - Bio: ${user.bio}

    AVAILABLE MARKETPLACE EVENTS:
    ${events.map(e => `[ID: ${e.id}] ${e.title}: ${e.description}`).join('\n')}

    1. Identify 3 critical skills/experiences missing from their portfolio based on their Target Role.
    2. Select the top 3 IDs from the Marketplace that best fill these gaps.
    3. Provide a brief 2-sentence career roadmap summary.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detectedGaps: { type: Type.ARRAY, items: { type: Type.STRING } },
            careerRoadmap: { type: Type.STRING },
            recommendedEventIds: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ['detectedGaps', 'careerRoadmap', 'recommendedEventIds']
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Strategy Error:", error);
    throw error;
  }
};


import { GoogleGenAI } from "@google/genai";
import { Event, PhotoPackageType } from "../types";

/**
 * Ingests a single major UPCOMING USA government or community event using Gemini 3 Pro + Search Grounding.
 * Constrained to events occurring in the FUTURE (next 30-60 days).
 */
export const ingestGovernmentEvents = async (
  state: string, 
  onProgress: (msg: string) => void,
  excludedTitles: string[] = []
): Promise<Partial<Event>[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  onProgress(`[SYSTEM] Initializing Ingestor for: ${state}`);

  const exclusionList = excludedTitles.length > 0 
    ? `\nCRITICAL: DO NOT search for or return any of the following events as they are already in the system: ${excludedTitles.join(', ')}.`
    : '';

  const prompt = `
    Search for ONE major UPCOMING public event in the state of ${state}, USA that will occur in the FUTURE (next 30-60 days).
    The goal is to find high-profile upcoming festivals, fairs, government-sponsored community events, or large public gatherings that photographers can plan to attend.
    ${exclusionList}
    
    You MUST return a JSON array containing EXACTLY ONE object. 
    
    The object MUST have:
    - title: String (Official name of the event)
    - description: String (minimum 3 sentences focusing on visual appeal for photographers)
    - date: String (ISO YYYY-MM-DD for the start date)
    - endDate: String or null (ISO YYYY-MM-DD if it's a multi-day event, otherwise null)
    - isMultiDay: Boolean (true if endDate is provided and different from date)
    - isAllDay: Boolean (true if the event doesn't have a specific start hour)
    - location: String (Specific City, State)
    - tags: Array of Strings (min 3)
    - image_url: A direct link to a verified high-res official image IF AND ONLY IF it is a verifiable high-res public image from a news site or government domain (.gov, .org, .edu).
    - visual_prompt: A 1-sentence highly descriptive visual prompt for an image generator fallback.
    
    IMPORTANT: 
    - The date MUST be in the FUTURE (today or later).
    - Preference for events in the next 30-45 days.
    - Return ONLY raw JSON. No markdown, no conversational text.
  `;

  try {
    onProgress("[ANALYSIS] Deploying Gemini 3 Pro Search Grounding...");
    
    const result = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = result.text || "";
    const jsonStart = text.indexOf('[');
    const jsonEnd = text.lastIndexOf(']') + 1;
    
    if (jsonStart === -1 || jsonEnd <= jsonStart) {
      onProgress("[CRITICAL] Failed to extract valid JSON structure from AI response.");
      throw new Error("Invalid AI Response Format");
    }

    const jsonStr = text.substring(jsonStart, jsonEnd);
    const rawData = JSON.parse(jsonStr);
    
    onProgress(`[DATA] Successfully parsed ${rawData.length} candidate(s).`);

    const groundingUrls: string[] = [];
    const chunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    chunks.forEach((chunk: any) => {
      if (chunk.web?.uri) groundingUrls.push(chunk.web.uri);
    });

    const processedEvents: Partial<Event>[] = [];
    
    if (rawData.length > 0) {
      const item = rawData[0];
      
      // Secondary safety check: check if the returned title matches excluded list
      if (excludedTitles.some(t => t.toLowerCase().trim() === item.title.toLowerCase().trim())) {
        onProgress(`[REDUNDANCY] AI returned an excluded event: ${item.title}. Aborting stage.`);
        return [];
      }

      onProgress(`[ASSETS] Verifying visuals for: ${item.title}...`);

      let finalImageUrl = item.image_url;

      // STAGE 1: Image Verification
      const isSuspectUrl = !finalImageUrl || 
                           !finalImageUrl.startsWith('http') || 
                           finalImageUrl.includes('placeholder') || 
                           finalImageUrl.includes('googleusercontent') ||
                           finalImageUrl.length > 800;

      if (isSuspectUrl) {
        try {
          onProgress(`[GENERATION] Verified search visual mismatch. Triggering 4K AI Generator...`);
          const imageGen = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
              parts: [{ text: `Professional wide-angle 4k photography of ${item.visual_prompt || item.title} in ${state}. Cinematic lighting, vibrant colors, shallow depth of field, sharp focus, world-class aesthetic, high-end event cover.` }]
            },
            config: { imageConfig: { aspectRatio: "16:9" } }
          });

          const imagePart = imageGen.candidates?.[0]?.content?.parts.find(p => p.inlineData);
          if (imagePart?.inlineData) {
            finalImageUrl = `data:image/png;base64,${imagePart.inlineData.data}`;
            onProgress(`[SUCCESS] Custom visual synthesized.`);
          } else {
            finalImageUrl = `https://picsum.photos/seed/${encodeURIComponent(item.title)}/1200/400`;
          }
        } catch (err) {
          onProgress(`[WARNING] Pipeline recovery: Using high-quality placeholder.`);
          finalImageUrl = `https://picsum.photos/seed/${encodeURIComponent(item.title)}/1200/400`;
        }
      }

      processedEvents.push({
        title: item.title,
        description: item.description,
        date: item.date,
        endDate: item.endDate || undefined,
        isAllDay: item.isAllDay ?? true,
        location: item.location,
        tags: item.tags || ['Community', 'Upcoming'],
        isOpenShoot: true,
        openShootApprovalRequired: false,
        status: 'POTENTIAL' as const,
        packageType: PhotoPackageType.BASIC,
        photoLimit: 200,
        sourceUrls: groundingUrls,
        imageUrl: finalImageUrl
      });

      onProgress(`[STAGED] Identity locked: ${item.title}`);
    }

    onProgress(`[COMPLETE] Pipeline finished. Candidates staged.`);
    return processedEvents;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'System Failure';
    onProgress(`[CRITICAL ERROR] ${errorMsg}`);
    console.error("Ingestion failed:", error);
    return [];
  }
};

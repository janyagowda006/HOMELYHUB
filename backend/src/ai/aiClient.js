import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();

// Initialize Groq client using API key from environment variables
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Primary and fallback models supported by Groq account
export const PRIMARY_MODEL = "openai/gpt-oss-120b";
export const FALLBACK_MODEL = "qwen/qwen3.8-27b";

/**
 * Generic chat completion helper with automatic fallback model support
 */
export const generateAICompletion = async ({
  messages,
  model = PRIMARY_MODEL,
  temperature = 0.7,
  max_tokens = 1024,
  response_format,
}) => {
  try {
    const params = {
      messages,
      model,
      temperature,
      max_tokens,
    };
    if (response_format) {
      params.response_format = response_format;
    }
    const response = await groq.chat.completions.create(params);
    return response.choices[0]?.message?.content?.trim() || "";
  } catch (error) {
    console.warn(`Groq primary model (${model}) failed:`, error.message);
    // If primary model failed, retry with fallback model
    if (model !== FALLBACK_MODEL) {
      try {
        const fallbackParams = {
          messages,
          model: FALLBACK_MODEL,
          temperature,
          max_tokens,
        };
        if (response_format) {
          fallbackParams.response_format = response_format;
        }
        const fallbackRes = await groq.chat.completions.create(fallbackParams);
        return fallbackRes.choices[0]?.message?.content?.trim() || "";
      } catch (fallbackError) {
        console.error("Groq fallback model also failed:", fallbackError.message);
        throw fallbackError;
      }
    }
    throw error;
  }
};

/**
 * Generates an engaging, professional listing description for a property
 */
export const generatePropertyDescriptionAI = async ({
  propertyName,
  extraInfo,
  propertyType = "Stay",
  roomType = "Entire Home",
  maximumGuest = 2,
  amenities = [],
  address = {},
  price,
  checkInTime,
  checkOutTime,
}) => {
  // Format location
  const locationParts = [];
  if (address?.area) locationParts.push(address.area.trim());
  if (address?.city) locationParts.push(address.city.trim());
  if (address?.state) locationParts.push(address.state.trim());
  const locationStr =
    locationParts.length > 0 ? locationParts.join(", ") : "a prime destination";

  // Format amenities cleanly
  const formattedAmenities = Array.isArray(amenities)
    ? amenities
        .map((a) => (typeof a === "object" && a !== null ? a.name || a.value : a))
        .filter(Boolean)
    : [];
  const amenitiesText =
    formattedAmenities.length > 0
      ? formattedAmenities.join(", ")
      : "Modern essentials";

  const systemPrompt = `You are an elite hospitality copywriter for HomelyHub, a luxury and boutique vacation rental platform in India.
Your task is to write a captivating, elegant, and vivid property description tailored strictly to the specific details provided by the host.

Guidelines:
1. Specifically incorporate the property type (${propertyType}) and room type (${roomType}).
2. Highlight the location (${locationStr}) and the guest experience in this neighborhood.
3. Feature the selected amenities explicitly (${amenitiesText}) and describe the comfort they offer.
4. Mention the maximum guest capacity (${maximumGuest} guests).
5. Seamlessly weave in the house rules or extra guidelines if provided.
6. If a price is provided, mention it as a great value for the experience.
7. Format the description into 2 to 3 engaging, beautifully flowing paragraphs (approx 130-190 words).
8. Tone: Warm, inviting, and professional. Do NOT include markdown headings (# or ##), quotes around the whole text, or placeholder brackets.`;

  const userPrompt = `Write an enticing listing description using these exact property details:
- Title / Property Name: ${propertyName || "Charming HomelyHub Stay"}
- Property Type: ${propertyType}
- Room Type: ${roomType}
- Location: ${locationStr}
- Max Guests: ${maximumGuest}
- Featured Amenities: ${amenitiesText}
- Additional Info / House Rules: ${extraInfo ? extraInfo.trim() : "Standard quiet hours and respectful stay"}
${price ? `- Nightly Price: ₹${price}` : ""}
${checkInTime ? `- Check-in Time: ${checkInTime}` : ""}
${checkOutTime ? `- Check-out Time: ${checkOutTime}` : ""}`;

  return await generateAICompletion({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 800,
  });
};

/**
 * Re-export planTrip for centralized trip planning
 */
export { planTrip } from "./tripPlanner.js";
export { planTrip as generateTripPlanAI } from "./tripPlanner.js";

export default groq;

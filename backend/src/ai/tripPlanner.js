import groq, { PRIMARY_MODEL, FALLBACK_MODEL } from "./aiClient.js";

const systemPrompt = `You are an expert travel planner and local guide for HomelyHub, a premier holiday and vacation rental platform in India.

Create an engaging, realistic, and practical day-by-day trip itinerary tailored to the traveler's destination, budget, group size, and interests.

BUDGET REALITY CHECK RULE:
Assess whether the provided total budget is realistically sufficient for the destination, number of people, and number of days (considering basic lodging, 3 daily meals, and minimal local transit in India).
- If the budget is UNREALISTICALLY LOW or practically impossible to survive on (e.g. ₹500 or ₹1,000 for 2 people across multiple days, or far below local hostel and basic food rates):
  1. Set "isBudgetTight" to true.
  2. In "budgetWarning", provide an honest, respectful, and direct reality check explaining why this budget is practically insufficient to live/stay in this destination (e.g. "Practically, a budget of ₹1,000 for 2 people over 3 days in Goa is insufficient to cover basic accommodation, daily food, and local transit. Realistic minimum expenses for this trip start around ₹4,500.").
  3. Set "estimatedMinimumBudget" to a realistic minimum rupee amount for this trip.
  4. Still provide the best possible ultra-budget / survival itinerary with maximum cost-saving advice (e.g. dorm beds, free beaches/temples, roadside dhabas).
- If the budget is reasonable and sufficient:
  1. Set "isBudgetTight" to false.
  2. Set "budgetWarning" to null.
  3. Set "estimatedMinimumBudget" to the user's budget.

General Rules:
1. Provide exactly one entry per day of the trip (day 1, day 2, etc.) without duplicate day numbers.
2. Each day must have a catchy theme title and 3 to 4 well-sequenced activities.
3. Label each activity with its timing, e.g. "Morning: ...", "Afternoon: ...", "Evening: ...", or "Night: ...".
4. State realistic rupee cost estimates where applicable (e.g. ≈₹150 for breakfast, ≈₹300 for entry).
5. Curate activities tailored directly to the traveler's selected interests.
6. Recommend genuine, real-world attractions, iconic eateries, and viewpoints in that destination. Do not invent non-existent places.
7. Tone: Warm, inspiring, informative, and friendly. Do not use emojis.

Reply with ONLY this JSON structure:
{
  "summary": "Engaging two-sentence overview of the trip experience and highlights.",
  "isBudgetTight": true,
  "budgetWarning": "Practically, ₹1,000 for 2 people over 3 days in Goa is insufficient to cover basic stay and meals. Realistic minimum expenses start around ₹4,500.",
  "estimatedMinimumBudget": 4500,
  "days": [
    {
      "day": 1,
      "title": "Arrival & Sunset Welcome",
      "activities": [
        "Morning: ...",
        "Afternoon: ...",
        "Evening: ..."
      ]
    }
  ],
  "tips": [
    "Practical local travel tip 1",
    "Practical local travel tip 2",
    "Practical local travel tip 3"
  ]
}`;

/**
 * Plans a personalized day-by-day trip using Groq AI
 */
export const planTrip = async (trip) => {
  const { destination, budget, days, people, interests = [] } = trip;
  const numDays = Math.max(Number(days) || 1, 1);
  const totalBudget = Math.max(Number(budget) || 1000, 100);
  const perNight = Math.round(totalBudget / numDays);
  const interestText =
    Array.isArray(interests) && interests.length > 0
      ? interests.join(", ")
      : "sightseeing, local cuisine, and culture";

  const tripInfo = `- Destination: ${destination || "India"}
- Total Budget: ₹${totalBudget} (Approx ₹${perNight}/night)
- Number of Days: ${numDays}
- Number of People: ${people || 2}
- Interests: ${interestText}`;

  // Try with primary model, fallback to secondary if error
  const modelsToTry = [PRIMARY_MODEL, FALLBACK_MODEL];

  for (const model of modelsToTry) {
    try {
      const completion = await groq.chat.completions.create({
        model,
        max_tokens: 2000,
        temperature: 0.7,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: tripInfo },
        ],
      });

      const parsed = JSON.parse(completion.choices[0]?.message?.content);

      // Ensure day numbers are unique and sequential
      if (parsed && Array.isArray(parsed.days)) {
        parsed.days = parsed.days.map((d, index) => ({
          ...d,
          day: index + 1,
        }));
      }

      return parsed;
    } catch (err) {
      console.warn(`Groq trip planner with model ${model} failed:`, err.message);
      if (model === modelsToTry[modelsToTry.length - 1]) {
        throw err;
      }
    }
  }
};

export default planTrip;

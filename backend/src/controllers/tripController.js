import Property from "../Models/propertyModel.js";
import { planTrip } from "../ai/tripPlanner.js";

// ============================================================
// ERROR RESPONSE HELPER
// ============================================================
const sendErrorResponse = (res, error, defaultStatusCode = 400) => {
  const statusCode =
    typeof error.statusCode === "number" ? error.statusCode : defaultStatusCode;

  return res.status(statusCode).json({
    status: statusCode >= 500 ? "error" : "fail",
    message: error.message || "An unexpected error occurred while planning your trip.",
  });
};

// ============================================================
// GENERATE TRIP PLAN CONTROLLER
// Uses Groq AI to generate a day-by-day itinerary and matches
// real accommodation listings from the database.
// ============================================================
export const generateTripPlan = async (req, res) => {
  try {
    const { destination, budget, days, people, interests = [] } = req.body;

    if (!destination || !destination.trim()) {
      return res.status(400).json({
        status: "fail",
        message: "Please provide a valid destination.",
      });
    }

    const numDays = Math.max(Number(days) || 1, 1);
    const totalBudget = Math.max(Number(budget) || 1000, 100);
    const perNight = Math.round(totalBudget / numDays);
    const destName = destination.trim();

    // 1. Find matching stays in MongoDB
    let matchingProperties = [];
    try {
      const destRegex = new RegExp(destName, "i");

      matchingProperties = await Property.find({
        $or: [
          { "address.city": destRegex },
          { "address.state": destRegex },
          { "address.area": destRegex },
          { propertyName: destRegex },
        ],
      }).limit(6);

      // If no stays found directly for destination, find stays within reasonable budget
      if (matchingProperties.length === 0) {
        matchingProperties = await Property.find({
          price: { $lte: perNight * 1.5 },
        }).limit(4);

        if (matchingProperties.length === 0) {
          matchingProperties = await Property.find().limit(4);
        }
      }
    } catch (dbErr) {
      console.warn("Matching properties lookup failed:", dbErr.message);
    }

    // 2. Deduplicate matching properties by _id to prevent duplicate React keys/IDs
    const seenPropIds = new Set();
    const uniqueProperties = matchingProperties.filter((prop) => {
      const idStr = prop._id ? prop._id.toString() : "";
      if (!idStr || seenPropIds.has(idStr)) return false;
      seenPropIds.add(idStr);
      return true;
    });

    // 3. Generate dynamic itinerary using Groq AI
    let plan = null;
    try {
      plan = await planTrip({
        destination: destName,
        budget: totalBudget,
        days: numDays,
        people: Number(people) || 2,
        interests,
      });
    } catch (aiErr) {
      console.warn("Groq AI trip planner failed, falling back to structured itinerary:", aiErr.message);
    }

    // 4. Fallback structured itinerary if AI is unavailable or fails
    if (!plan || !Array.isArray(plan.days) || plan.days.length === 0) {
      const interestList =
        Array.isArray(interests) && interests.length > 0
          ? interests.join(", ")
          : "sightseeing, local cuisine, and culture";

      const sampleThemes = [
        {
          title: `Arrival & Exploring ${destName}`,
          activities: [
            `Morning: Arrive in ${destName}, check into your stay and unpack`,
            "Afternoon: Stroll through the local neighborhood and savor authentic street food",
            "Evening: Catch the sunset viewpoint and enjoy a relaxing welcome dinner",
          ],
        },
        {
          title: "Highlights & Cultural Wonders",
          activities: [
            "Morning: Visit iconic landmarks and heritage sites",
            "Afternoon: Enjoy lunch at a traditional highly rated local spot",
            "Evening: Explore bustling markets and artisanal craft shops",
          ],
        },
        {
          title: "Adventure & Hidden Trails",
          activities: [
            "Morning: Outdoor nature walk or scenic trail excursion",
            "Afternoon: Photo-walk and sampling regional specialties",
            "Evening: Cafe hopping with live acoustic ambience",
          ],
        },
        {
          title: "Leisure & Local Vibes",
          activities: [
            "Morning: Relaxed breakfast and visit to local gardens or viewpoints",
            "Afternoon: Souvenir shopping and cultural immersion",
            "Evening: Fine dining experience featuring regional delicacies",
          ],
        },
        {
          title: "Farewell & Departure",
          activities: [
            "Morning: Sunrise coffee and final scenic walk",
            "Afternoon: Check out from your stay and pack up memories",
            "Evening: Head to the station or airport for departure",
          ],
        },
      ];

      const daysPlan = [];
      for (let i = 1; i <= numDays; i++) {
        const themeIndex = (i - 1) % sampleThemes.length;
        const theme = sampleThemes[themeIndex];
        daysPlan.push({
          day: i,
          title: theme.title,
          activities: theme.activities,
        });
      }

      const minEstimated = Math.max(900 * Number(people || 2) * numDays, 2500);
      const isTight = totalBudget < minEstimated;
      const budgetWarning = isTight
        ? `Practically, a budget of ₹${totalBudget} for ${people || 2} people across ${numDays} days in ${destName} is extremely tight and realistically insufficient to cover basic accommodation, daily meals, and local transit. We recommend a minimum budget of approximately ₹${minEstimated} for a comfortable stay.`
        : null;

      plan = {
        summary: `A curated ${numDays}-day journey to ${destName} tailored for ${
          people || 2
        } travelers, focusing on ${interestList} with an average stay budget of ₹${perNight}/night.`,
        isBudgetTight: isTight,
        budgetWarning,
        estimatedMinimumBudget: isTight ? minEstimated : totalBudget,
        days: daysPlan,
        tips: [
          "Book stays and local transport in advance during peak travel seasons.",
          "Carry comfortable walking footwear and keep local cash handy.",
          "Check opening hours of popular spots and sample regional street delicacies.",
        ],
      };
    }

    // 5. Ensure sequential, unique day numbers in plan
    if (plan && Array.isArray(plan.days)) {
      plan.days = plan.days.map((day, idx) => ({
        ...day,
        day: idx + 1,
      }));
    }

    res.status(200).json({
      status: "success",
      data: {
        plan,
        perNight,
        properties: uniqueProperties,
      },
    });
  } catch (error) {
    sendErrorResponse(res, error, 500);
  }
};

// Aliases
export const planTripController = generateTripPlan;

export default {
  generateTripPlan,
  planTripController,
};

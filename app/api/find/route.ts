import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: Request) {
  const { location, transport, travelTime, timeUnit, activities, previousSuggestions } = await request.json();

  const prompt = `You are a travel assistant helping find vacation destinations near ${location} that are accessible by ${transport} within approximately ${travelTime} ${timeUnit} of travel time. The user is interested in activities like ${activities}.

${previousSuggestions && previousSuggestions.length > 0 ? `You have already suggested these destinations, do NOT suggest them again: ${previousSuggestions.join(", ")}` : ""}

Please provide exactly ONE vacation destination recommendation in the following JSON format:
{
  "destination": "City, State, Country (e.g., Charleston, South Carolina, USA)",
  "description": "A detailed description of this destination including why it's perfect for their interests, what activities are available, best time to visit, and any special features or highlights. Make this 3-4 sentences."
}

Respond ONLY with the JSON object, no additional text.`;

  try {
    const response = await client.chat.completions.create({
      model: "gpt-5-nano",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      reasoning_effort: "low",
      // max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content || "";
    console.log("API Response:", content);

    // Parse the JSON string from OpenAI and return it as JSON
    try {
      const parsedContent = JSON.parse(content);
      return Response.json(parsedContent);
    } catch (parseError) {
      console.error("Failed to parse OpenAI response:", parseError);
      return Response.json({ error: "Invalid response format" }, { status: 500 });
    }
  } catch (error) {
    console.error("OpenAI API error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

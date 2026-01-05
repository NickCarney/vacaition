export const runtime = "edge";
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: Request) {
  const {
    location,
    transport,
    travelTime,
    timeUnit,
    activities,
    previousSuggestions,
  } = await request.json();

  const prompt = `You are a travel assistant helping find vacation destinations near ${location} that are accessible by ${transport} within approximately ${travelTime} ${timeUnit} of travel time. The user is interested in activities like ${activities}.

${
  previousSuggestions && previousSuggestions.length > 0
    ? `You have already suggested these destinations, do NOT suggest them again: ${previousSuggestions.join(
        ", "
      )}`
    : ""
}

Please provide exactly ONE vacation destination recommendation in the following JSON format:
{
  "destination": "City, State, Country (e.g., Charleston, South Carolina, USA)",
  "description": "A detailed description of this destination including why it's perfect for their interests, best time to visit, and any special features or highlights. Make this 2-3 sentences.",
  "activities": [
    {
      "name": "Specific activity or attraction name",
      "location": "Full address or location (e.g., '1234 Main St, City, State' or 'National Park Name, City, State')",
      "description": "Brief 1-2 sentence description of what makes this activity/location special"
    }
  ]
}

Include 3-5 specific activities or attractions that match the user's interests. Each activity should have a distinct location that can be used for directions.

Respond ONLY with the JSON object, no additional text.`;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const streamResponse = await client.chat.completions.create({
          model: "gpt-5-nano",
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          reasoning_effort: "low",
          stream: true,
        });

        for await (const chunk of streamResponse) {
          const content = chunk.choices[0]?.delta?.content || "";
          if (content) {
            controller.enqueue(encoder.encode(content));
          }
        }
      } catch (error) {
        console.error("OpenAI API error:", error);
        controller.enqueue(
          encoder.encode(JSON.stringify({ error: "Internal Server Error" }))
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

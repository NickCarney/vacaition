export const runtime = "edge";
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: Request) {
  const { destination, activities, travelDistance, distanceUnit } =
    await request.json();

  const prompt = `You are a travel assistant helping someone located in ${destination} who wants to find things to do within ${travelDistance} ${distanceUnit} of their location. They are interested in ${activities}.

Please provide 3-5 specific recommendations in the following JSON format:
[
  {
    "name": "Specific name of the place/business/location",
    "description": "What they should do there, what activities are available, and why it's a great choice for their interests. Include practical details like best times to visit, costs if relevant, or any special features.",
    "website": "https://actual-website-url.com (only if you know a real website)",
    "location": "Specific address or area with approximate distance from their location"
  }
]

For example:
- If someone in Washington DC wants camping within 100 miles, suggest specific campgrounds in nearby areas like Shenandoah National Park or Catoctin Mountain Park
- If someone wants swimming within 50 miles of their location, suggest specific lakes, rivers, pools, or beaches with their names and exact locations
- If someone wants restaurants, suggest specific restaurant names with their websites and what makes them special
- If someone wants hiking, suggest specific trail names, difficulty levels, and trailhead locations within their travel distance

Make sure all recommendations are actually within the specified distance from their location. Only include real, specific places. Do not make up websites. If you don't know a website, omit the website field.
Respond ONLY with the JSON array, no additional text.`;

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

import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: Request) {
  const { destination, activities } = await request.json();

  const prompt = `You are a travel assistant helping find specific activity recommendations for ${destination} related to ${activities}.

Please provide 3-5 specific recommendations in the following JSON format:
[
  {
    "name": "Specific name of the place/business/location",
    "description": "Brief description of what they offer and why it's good for the requested activity",
    "website": "https://actual-website-url.com (only if you know a real website)",
    "location": "Specific address or area within the destination"
  }
]

For example:
- If someone asks for camping in Yellowstone, suggest specific campgrounds like "Madison Campground" with its reservation website
- If someone asks for swimming, suggest specific lakes, rivers, or pools with their names and locations  
- If someone asks for restaurants, suggest specific restaurant names with their websites
- If someone asks for hiking, suggest specific trail names and trailhead locations

Only include real, specific places. Do not make up websites. If you don't know a website, omit the website field.
Respond ONLY with the JSON array, no additional text.`;

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4.1-nano",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 1500,
    });

    const content = response.choices[0]?.message?.content || "";
    console.log("API Response:", content);

    return Response.json(content);
  } catch (error) {
    console.error("OpenAI API error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

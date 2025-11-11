import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: Request) {
  const { prompt } = await request.json();

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
    console.log(content);

    return Response.json(content);
  } catch (error) {
    console.error("OpenAI API error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

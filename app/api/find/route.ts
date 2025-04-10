import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: Request) {
  const { prompt } = await request.json();

  try {
    const response = await client.responses.create({
      model: "gpt-4o-mini",
      input: prompt,
    });

    console.log(response.output_text);

    return Response.json(response.output_text);
  } catch (error) {
    console.error("Resend error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

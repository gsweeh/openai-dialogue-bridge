
import { OpenAIMessage, GenerateStreamParams } from "@/lib/openai";
import { OpenAI } from "openai";

// Create a server-side OpenAI client
export const createServerOpenAIClient = (apiKey: string, baseUrl: string) => {
  return new OpenAI({
    apiKey,
    baseURL: baseUrl.trim().endsWith("/") ? baseUrl.trim() : `${baseUrl.trim()}/`,
  });
};

// Server-side function to fetch OpenAI models
export const fetchModels = async (apiKey: string, baseUrl: string) => {
  try {
    const client = createServerOpenAIClient(apiKey, baseUrl);
    const response = await client.models.list();
    return response.data || [];
  } catch (error) {
    console.error("Error fetching models:", error);
    throw error;
  }
};

// Server-side function to generate stream
export const generateStream = async (
  apiKey: string,
  baseUrl: string,
  params: GenerateStreamParams
) => {
  try {
    const client = createServerOpenAIClient(apiKey, baseUrl);
    const stream = await client.chat.completions.create({
      model: params.model,
      messages: params.messages,
      temperature: params.temperature ?? 0.7,
      max_tokens: params.max_tokens,
      top_p: params.top_p ?? 1,
      frequency_penalty: params.frequency_penalty ?? 0,
      presence_penalty: params.presence_penalty ?? 0,
      stream: true,
    });
    
    return stream;
  } catch (error) {
    console.error("Stream error:", error);
    throw error;
  }
};

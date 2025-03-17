
import { OpenAI } from "openai";
import { toast } from "sonner";

export interface OpenAIConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export interface OpenAIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OpenAIModel {
  id: string;
  name?: string;
  description?: string;
  created?: number;
  owned_by?: string;
}

export interface GenerateStreamParams {
  messages: OpenAIMessage[];
  model: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

export class OpenAIClient {
  private client: OpenAI;

  constructor(config: { apiKey: string; baseUrl: string }) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl.trim().endsWith("/")
        ? config.baseUrl.trim()
        : `${config.baseUrl.trim()}/`,
      dangerouslyAllowBrowser: true,
    });
  }

  async getModels(): Promise<OpenAIModel[]> {
    try {
      const response = await this.client.models.list();
      return response.data || [];
    } catch (error) {
      console.error("Error fetching models:", error);
      
      // Check if it's a CORS-related error
      if (error instanceof Error && error.message.includes('NetworkError') || 
          error instanceof Error && error.message.includes('Failed to fetch')) {
        toast.error(
          "CORS error: The API server doesn't allow requests from your browser. Make sure your API endpoint supports CORS or use a compatible endpoint."
        );
      } else {
        toast.error("Failed to fetch models. Please check your API settings.");
      }
      
      return [];
    }
  }

  async generateStream(
    params: GenerateStreamParams,
    onChunk: (chunk: string) => void,
    onDone: () => void,
    onError: (error: Error) => void
  ): Promise<void> {
    try {
      const stream = await this.client.chat.completions.create({
        model: params.model,
        messages: params.messages,
        temperature: params.temperature ?? 0.7,
        max_tokens: params.max_tokens,
        top_p: params.top_p ?? 1,
        frequency_penalty: params.frequency_penalty ?? 0,
        presence_penalty: params.presence_penalty ?? 0,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          onChunk(content);
        }
      }
      
      onDone();
    } catch (error) {
      console.error("Stream error:", error);
      
      // Provide more specific error messages for common issues
      if (error instanceof Error) {
        if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
          onError(new Error("CORS error: The API server doesn't allow requests from your browser. Make sure your API endpoint supports CORS or use a compatible endpoint."));
        } else if (error.message.includes('401')) {
          onError(new Error("Authentication error: Your API key may be invalid or expired."));
        } else if (error.message.includes('429')) {
          onError(new Error("Rate limit exceeded: Too many requests. Try again later."));
        } else {
          onError(error);
        }
      } else {
        onError(new Error(String(error)));
      }
    }
  }
}

const DEFAULT_CONFIG: OpenAIConfig = {
  apiKey: localStorage.getItem("openai-api-key") || "",
  baseUrl: localStorage.getItem("openai-base-url") || "https://api.openai.com/v1/",
  model: localStorage.getItem("openai-model") || "gpt-4o-mini",
};

// Singleton instance
let openaiClient: OpenAIClient | null = null;

export function getOpenAIClient(): OpenAIClient {
  if (!openaiClient) {
    openaiClient = new OpenAIClient({
      apiKey: DEFAULT_CONFIG.apiKey,
      baseUrl: DEFAULT_CONFIG.baseUrl,
    });
  }
  return openaiClient;
}

export function updateOpenAIClient(config: Partial<OpenAIConfig>): void {
  const newConfig = {
    apiKey: config.apiKey ?? DEFAULT_CONFIG.apiKey,
    baseUrl: config.baseUrl ?? DEFAULT_CONFIG.baseUrl,
  };
  
  openaiClient = new OpenAIClient(newConfig);
  
  // Save to localStorage
  if (config.apiKey) localStorage.setItem("openai-api-key", config.apiKey);
  if (config.baseUrl) localStorage.setItem("openai-base-url", config.baseUrl);
  if (config.model) localStorage.setItem("openai-model", config.model);
}

export function getOpenAIConfig(): OpenAIConfig {
  return {
    apiKey: localStorage.getItem("openai-api-key") || "",
    baseUrl: localStorage.getItem("openai-base-url") || "https://api.openai.com/v1/",
    model: localStorage.getItem("openai-model") || "gpt-4o-mini",
  };
}


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
  private apiKey: string;
  private baseUrl: string;
  private apiBaseUrl: string = '/api'; // URL to our proxy server

  constructor(config: { apiKey: string; baseUrl: string }) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl.trim().endsWith("/")
      ? config.baseUrl.trim()
      : `${config.baseUrl.trim()}/`;
  }

  async getModels(): Promise<OpenAIModel[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/models`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: this.apiKey,
          baseUrl: this.baseUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch models');
      }

      const data = await response.json();
      return data.models || [];
    } catch (error) {
      console.error("Error fetching models:", error);
      
      if (error instanceof Error) {
        toast.error(error.message);
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
      const response = await fetch(`${this.apiBaseUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: this.apiKey,
          baseUrl: this.baseUrl,
          params,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Stream error');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      // Process the stream
      const decoder = new TextDecoder();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n\n').filter(line => line.trim().startsWith('data: '));
        
        for (const line of lines) {
          try {
            const jsonStr = line.replace('data: ', '');
            const data = JSON.parse(jsonStr);
            
            if (data.done) {
              onDone();
              break;
            }
            
            if (data.content) {
              onChunk(data.content);
            }
          } catch (e) {
            console.error('Error parsing SSE data:', e);
          }
        }
      }
      
      onDone();
    } catch (error) {
      console.error("Stream error:", error);
      
      if (error instanceof Error) {
        onError(error);
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

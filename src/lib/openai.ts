
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

  constructor(config: { apiKey: string; baseUrl: string }) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl.trim().endsWith("/")
      ? config.baseUrl.trim()
      : `${config.baseUrl.trim()}/`;
  }

  async getModels(): Promise<OpenAIModel[]> {
    try {
      const response = await fetch(`${this.baseUrl}models`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch models: ${errorText}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error("Error fetching models:", error);
      toast.error("Failed to fetch models. Please check your API settings.");
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
      const response = await fetch(`${this.baseUrl}chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: params.model,
          messages: params.messages,
          temperature: params.temperature ?? 0.7,
          max_tokens: params.max_tokens,
          top_p: params.top_p ?? 1,
          frequency_penalty: params.frequency_penalty ?? 0,
          presence_penalty: params.presence_penalty ?? 0,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error: ${errorText}`);
      }

      if (!response.body) {
        throw new Error("Response body is null");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let isDone = false;

      while (!isDone) {
        const { value, done } = await reader.read();
        isDone = done;

        if (done) {
          onDone();
          break;
        }

        const chunk = decoder.decode(value);
        const lines = chunk
          .split("\n")
          .filter((line) => line.trim() !== "" && line.trim() !== "data: [DONE]");

        for (const line of lines) {
          try {
            const cleanedLine = line.replace(/^data: /, "").trim();
            if (!cleanedLine || cleanedLine === "[DONE]") continue;

            const json = JSON.parse(cleanedLine);
            const content = json.choices[0]?.delta?.content || "";
            if (content) {
              onChunk(content);
            }
          } catch (err) {
            console.warn("Error parsing SSE line:", line, err);
          }
        }
      }
    } catch (error) {
      console.error("Stream error:", error);
      onError(error instanceof Error ? error : new Error(String(error)));
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


import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { OpenAIMessage, OpenAIModel, getOpenAIClient, getOpenAIConfig, updateOpenAIClient } from "@/lib/openai";
import { toast } from "sonner";

interface ChatState {
  messages: OpenAIMessage[];
  inputValue: string;
  isGenerating: boolean;
  availableModels: OpenAIModel[];
  selectedModel: string;
  apiKey: string;
  baseUrl: string;
  isLoading: boolean;
}

interface ChatContextType extends ChatState {
  sendMessage: (content: string) => Promise<void>;
  updateInput: (value: string) => void;
  clearMessages: () => void;
  updateConfig: (config: { apiKey?: string; baseUrl?: string; model?: string }) => Promise<void>;
  refreshModels: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};

interface ChatProviderProps {
  children: React.ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const config = getOpenAIConfig();
  const [state, setState] = useState<ChatState>({
    messages: [],
    inputValue: "",
    isGenerating: false,
    availableModels: [],
    selectedModel: config.model,
    apiKey: config.apiKey,
    baseUrl: config.baseUrl,
    isLoading: false,
  });

  const refreshModels = useCallback(async () => {
    if (!state.apiKey) return;
    
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const client = getOpenAIClient();
      const models = await client.getModels();
      
      // Sort models by ID
      const sortedModels = models.sort((a, b) => a.id.localeCompare(b.id));
      
      setState((prev) => ({ 
        ...prev, 
        availableModels: sortedModels,
        isLoading: false 
      }));
    } catch (error) {
      console.error("Failed to fetch models:", error);
      toast.error("Failed to fetch models. Please check your API settings.");
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [state.apiKey, state.baseUrl]);

  useEffect(() => {
    if (state.apiKey && state.baseUrl) {
      refreshModels();
    }
  }, [state.apiKey, state.baseUrl]);

  const updateConfig = useCallback(async (newConfig: { apiKey?: string; baseUrl?: string; model?: string }) => {
    const updatedConfig = {
      apiKey: newConfig.apiKey ?? state.apiKey,
      baseUrl: newConfig.baseUrl ?? state.baseUrl,
      model: newConfig.model ?? state.selectedModel,
    };
    
    updateOpenAIClient(updatedConfig);
    
    setState((prev) => ({ 
      ...prev, 
      apiKey: updatedConfig.apiKey,
      baseUrl: updatedConfig.baseUrl,
      selectedModel: updatedConfig.model,
    }));

    if (newConfig.apiKey || newConfig.baseUrl) {
      await refreshModels();
    }

    toast.success("Settings updated successfully");
  }, [state.apiKey, state.baseUrl, state.selectedModel, refreshModels]);

  const updateInput = useCallback((value: string) => {
    setState((prev) => ({ ...prev, inputValue: value }));
  }, []);

  const clearMessages = useCallback(() => {
    setState((prev) => ({ ...prev, messages: [] }));
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || state.isGenerating) return;
    
    if (!state.apiKey) {
      toast.error("Please set your OpenAI API key in settings");
      return;
    }

    const userMessage: OpenAIMessage = { role: "user", content };
    
    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      inputValue: "",
      isGenerating: true,
    }));
    
    const client = getOpenAIClient();
    let assistantMessage = "";
    
    try {
      await client.generateStream(
        {
          messages: [...state.messages, userMessage],
          model: state.selectedModel,
        },
        (chunk) => {
          assistantMessage += chunk;
          setState((prev) => {
            const updatedMessages = [...prev.messages];
            if (updatedMessages[updatedMessages.length - 1]?.role === "assistant") {
              updatedMessages[updatedMessages.length - 1].content = assistantMessage;
            } else {
              updatedMessages.push({ role: "assistant", content: assistantMessage });
            }
            return { ...prev, messages: updatedMessages };
          });
        },
        () => {
          setState((prev) => ({ ...prev, isGenerating: false }));
        },
        (error) => {
          console.error("Stream error:", error);
          toast.error(`Error: ${error.message}`);
          setState((prev) => ({ ...prev, isGenerating: false }));
        }
      );
    } catch (error) {
      console.error("Message error:", error);
      toast.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
      setState((prev) => ({ ...prev, isGenerating: false }));
    }
  }, [state.messages, state.isGenerating, state.selectedModel, state.apiKey]);

  const value = {
    ...state,
    sendMessage,
    updateInput,
    clearMessages,
    updateConfig,
    refreshModels,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

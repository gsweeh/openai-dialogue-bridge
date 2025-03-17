
import React, { useState, useRef, useEffect } from "react";
import { ChatProvider, useChat } from "@/context/ChatContext";
import Header from "@/components/Header";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import SettingsDialog from "@/components/SettingsDialog";
import { ScrollArea } from "@/components/ui/scroll-area";

const Chat: React.FC = () => {
  const {
    messages,
    inputValue,
    isGenerating,
    sendMessage,
    updateInput,
    clearMessages,
    updateConfig,
    refreshModels,
    selectedModel,
    apiKey,
    baseUrl,
    availableModels,
    isLoading,
  } = useChat();
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Show settings dialog on first load if API key is not set
  useEffect(() => {
    if (!apiKey) {
      setIsSettingsOpen(true);
    }
  }, [apiKey]);

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      sendMessage(inputValue);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <Header 
        onOpenSettings={() => setIsSettingsOpen(true)} 
        onClearChat={clearMessages}
        hasMessages={messages.length > 0}
      />
      
      <div className="flex-1 overflow-hidden">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-4 md:p-8">
            <div className="max-w-md text-center space-y-4">
              <h2 className="text-2xl font-medium tracking-tight">Welcome to ChatGPT Clone</h2>
              <p className="text-muted-foreground">
                Send a message to start a conversation with the AI assistant.
              </p>
              {!apiKey && (
                <button 
                  onClick={() => setIsSettingsOpen(true)}
                  className="text-primary hover:underline"
                >
                  Set up your OpenAI API key to begin
                </button>
              )}
            </div>
          </div>
        ) : (
          <ScrollArea className="h-full thin-scrollbar">
            <div ref={chatContainerRef}>
              {messages.map((message, index) => (
                <ChatMessage
                  key={index}
                  message={message}
                  isLatest={index === messages.length - 1}
                  isGenerating={isGenerating && index === messages.length - 1}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
      
      <ChatInput
        value={inputValue}
        onChange={updateInput}
        onSend={handleSendMessage}
        disabled={isGenerating || !apiKey}
        placeholder={
          !apiKey 
            ? "Please set your API key in settings" 
            : isGenerating 
              ? "AI is generating a response..." 
              : "Type a message..."
        }
      />
      
      <SettingsDialog
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        apiKey={apiKey}
        baseUrl={baseUrl}
        selectedModel={selectedModel}
        availableModels={availableModels}
        isLoading={isLoading}
        onSubmit={updateConfig}
        onRefreshModels={refreshModels}
      />
    </div>
  );
};

const Index: React.FC = () => {
  return (
    <ChatProvider>
      <Chat />
    </ChatProvider>
  );
};

export default Index;

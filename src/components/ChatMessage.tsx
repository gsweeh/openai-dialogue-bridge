
import React, { useEffect, useRef } from "react";
import { OpenAIMessage } from "@/lib/openai";
import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";

interface ChatMessageProps {
  message: OpenAIMessage;
  isLatest: boolean;
  isGenerating: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isLatest, isGenerating }) => {
  const isUser = message.role === "user";
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom for new messages
  useEffect(() => {
    if (isLatest && containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [isLatest, message.content]);

  return (
    <div 
      ref={containerRef}
      className={cn(
        "py-6 flex items-start gap-4 px-4 md:px-6 lg:px-8 animate-fade-in",
        isUser ? "bg-transparent" : "bg-muted/30"
      )}
    >
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
        isUser ? "bg-primary text-primary-foreground" : "bg-muted-foreground/20 text-foreground"
      )}>
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>
      
      <div className="flex-1 space-y-2 overflow-hidden">
        <div className="font-medium text-sm">
          {isUser ? "You" : "Assistant"}
        </div>
        
        <div className={cn(
          "prose prose-slate dark:prose-invert max-w-none",
          isGenerating && isLatest && !isUser && "typewriter",
          !isGenerating && isLatest && !isUser && "typewriter done"
        )}>
          {message.content}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;

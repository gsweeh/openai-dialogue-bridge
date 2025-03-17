
import React from "react";
import { Button } from "@/components/ui/button";
import { Settings, RotateCcw } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface HeaderProps {
  onOpenSettings: () => void;
  onClearChat: () => void;
  hasMessages: boolean;
}

const Header: React.FC<HeaderProps> = ({ onOpenSettings, onClearChat, hasMessages }) => {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between h-16 px-4 border-b bg-background/80 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-semibold tracking-tight">ChatGPT Clone</h1>
      </div>
      
      <div className="flex items-center gap-2">
        {hasMessages && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onClearChat} aria-label="Clear chat">
                <RotateCcw size={18} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Clear chat</TooltipContent>
          </Tooltip>
        )}
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onOpenSettings} aria-label="Settings">
              <Settings size={18} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Settings</TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
};

export default Header;

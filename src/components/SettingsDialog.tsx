
import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ModelSelector from "./ModelSelector";
import { OpenAIModel } from "@/lib/openai";
import { toast } from "sonner";

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  baseUrl: string;
  selectedModel: string;
  availableModels: OpenAIModel[];
  isLoading: boolean;
  onSubmit: (config: { apiKey: string; baseUrl: string; model: string }) => Promise<void>;
  onRefreshModels: () => Promise<void>;
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({
  isOpen,
  onClose,
  apiKey,
  baseUrl,
  selectedModel,
  availableModels,
  isLoading,
  onSubmit,
  onRefreshModels,
}) => {
  const [formState, setFormState] = useState({
    apiKey,
    baseUrl,
    model: selectedModel,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      setFormState({
        apiKey,
        baseUrl,
        model: selectedModel,
      });
    }
  }, [isOpen, apiKey, baseUrl, selectedModel]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleModelChange = (model: string) => {
    setFormState((prev) => ({ ...prev, model }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit(formState);
      onClose();
    } catch (error) {
      console.error("Settings update error:", error);
      toast.error("Failed to update settings");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRefreshModels = async () => {
    if (!formState.apiKey || !formState.baseUrl) {
      toast.error("Please provide API key and base URL first");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onSubmit(formState);
      await onRefreshModels();
    } catch (error) {
      console.error("Refresh models error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] gap-6">
        <DialogHeader>
          <DialogTitle>API Settings</DialogTitle>
          <DialogDescription>
            Configure your OpenAI API settings
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              name="apiKey"
              type="password"
              value={formState.apiKey}
              onChange={handleChange}
              placeholder="sk-..."
              autoComplete="off"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="baseUrl">Base URL</Label>
            <Input
              id="baseUrl"
              name="baseUrl"
              value={formState.baseUrl}
              onChange={handleChange}
              placeholder="https://api.openai.com/v1/"
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="model">Model</Label>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={handleRefreshModels}
                disabled={isLoading || isSubmitting}
              >
                Refresh Models
              </Button>
            </div>
            <ModelSelector
              models={availableModels}
              selectedModel={formState.model}
              onSelect={handleModelChange}
              isLoading={isLoading}
            />
          </div>
          
          <DialogFooter className="mt-6">
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;

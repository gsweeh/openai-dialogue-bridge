
import { OpenAIModel } from "@/lib/openai";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

interface ModelSelectorProps {
  models: OpenAIModel[];
  selectedModel: string;
  onSelect: (model: string) => void;
  isLoading: boolean;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({
  models,
  selectedModel,
  onSelect,
  isLoading,
}) => {
  if (isLoading) {
    return <Skeleton className="h-10 w-full" />;
  }

  return (
    <Select value={selectedModel} onValueChange={onSelect}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select a model" />
      </SelectTrigger>
      <SelectContent>
        {models.length === 0 ? (
          <SelectItem value="no-models" disabled>
            No models available
          </SelectItem>
        ) : (
          models.map((model) => (
            <SelectItem key={model.id} value={model.id}>
              {model.id}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
};

export default ModelSelector;

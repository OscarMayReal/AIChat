import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ToolCall } from "@/components/tools/ToolCall";
import { useToolCalls } from "@/hooks/useToolCalls";
import { Loader2, Code, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToolCallPanelProps {
  messageId: string;
  threadId: string;
  onToolCallComplete?: (result: any) => void;
  className?: string;
}

export function ToolCallPanel({
  messageId,
  threadId,
  onToolCallComplete,
  className,
}: ToolCallPanelProps) {
  const { toolCalls, isExecuting, executeTool, retryToolCall } = useToolCalls(messageId);
  const [isOpen, setIsOpen] = useState(false);
  const [availableTools, setAvailableTools] = useState<Array<{
    id: string;
    name: string;
    description: string;
  }>>([]);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [inputJson, setInputJson] = useState("{}\n");
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load available tools
  useEffect(() => {
    const fetchTools = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/tools');
        if (response.ok) {
          const tools = await response.json();
          setAvailableTools(tools);
        }
      } catch (error) {
        console.error('Failed to load tools:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTools();
  }, []);

  const handleExecute = async () => {
    if (!selectedTool) return;

    try {
      const tool = availableTools.find(t => t.id === selectedTool);
      if (!tool) return;

      let input;
      try {
        input = JSON.parse(inputJson);
      } catch (e) {
        console.error('Invalid JSON input:', e);
        return;
      }

      const result = await executeTool(tool.id, tool.name, input);
      
      if (result && onToolCallComplete) {
        onToolCallComplete(result);
      }
      
      // Close the popover after successful execution
      setIsOpen(false);
    } catch (error) {
      console.error('Error executing tool:', error);
    }
  };

  const selectedToolData = availableTools.find(tool => tool.id === selectedTool);

  return (
    <div className={className}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2"
            disabled={isLoading || availableTools.length === 0}
          >
            <Code className="h-4 w-4" />
            {isLoading ? 'Loading tools...' : 'Call Tool'}
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-96 p-0" align="end">
          <div className="p-4 border-b">
            <h3 className="font-medium">Call a Tool</h3>
            <p className="text-sm text-muted-foreground">
              Execute a tool with custom input
            </p>
          </div>

          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Select Tool
              </label>
              <select
                className="w-full p-2 border rounded-md text-sm"
                value={selectedTool || ''}
                onChange={(e) => setSelectedTool(e.target.value || null)}
                disabled={isLoading}
              >
                <option value="">Select a tool...</option>
                {availableTools.map((tool) => (
                  <option key={tool.id} value={tool.id}>
                    {tool.name}
                  </option>
                ))}
              </select>
              {selectedToolData?.description && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {selectedToolData.description}
                </p>
              )}
            </div>

            {selectedTool && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  Input (JSON)
                </label>
                <textarea
                  ref={inputRef}
                  className="w-full p-2 border rounded-md font-mono text-sm h-32"
                  value={inputJson}
                  onChange={(e) => setInputJson(e.target.value)}
                  spellCheck={false}
                />
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(false)}
                disabled={isExecuting}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleExecute}
                disabled={!selectedTool || isExecuting}
              >
                {isExecuting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Executing...
                  </>
                ) : (
                  'Execute'
                )}
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Display tool calls */}
      {toolCalls.length > 0 && (
        <div className="mt-4 space-y-3">
          {toolCalls.map((toolCall) => (
            <ToolCall
              key={toolCall.id}
              toolCall={toolCall}
              onRetry={retryToolCall}
              className="border"
            />
          ))}
        </div>
      )}
    </div>
  );
}

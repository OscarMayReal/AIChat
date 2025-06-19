import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X, Loader2, Code, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToolCallProps {
  toolCall: {
    id: string;
    toolId: string;
    toolName: string;
    input: any;
    output?: any;
    status: 'pending' | 'completed' | 'failed';
    errorMessage?: string;
    createdAt: string;
  };
  onRetry?: (toolCallId: string) => void;
  className?: string;
}

export function ToolCall({ toolCall, onRetry, className }: ToolCallProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRetry = async () => {
    if (!onRetry) return;
    
    try {
      setIsLoading(true);
      setError(null);
      await onRetry(toolCall.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retry tool call');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = () => {
    switch (toolCall.status) {
      case 'completed':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
    }
  };

  const getStatusText = () => {
    switch (toolCall.status) {
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      default:
        return 'In Progress...';
    }
  };

  const formatJson = (data: any) => {
    try {
      if (typeof data === 'string') {
        return data;
      }
      return JSON.stringify(data, null, 2);
    } catch (e) {
      return String(data);
    }
  };

  return (
    <Card className={cn("w-full overflow-hidden", className)}>
      <CardHeader 
        className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Code className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">
              {toolCall.toolName}
            </CardTitle>
            <div className="flex items-center text-xs text-muted-foreground">
              {getStatusIcon()}
              <span className="ml-1">{getStatusText()}</span>
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="p-4 pt-0 border-t">
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-1">Input</h4>
              <pre className="bg-muted p-3 rounded-md text-sm overflow-auto max-h-40">
                {formatJson(toolCall.input)}
              </pre>
            </div>

            {toolCall.output !== undefined && (
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-1">
                  {toolCall.status === 'failed' ? 'Error' : 'Output'}
                </h4>
                <pre className={cn(
                  "p-3 rounded-md text-sm overflow-auto max-h-60",
                  toolCall.status === 'failed' 
                    ? "bg-destructive/10 text-destructive"
                    : "bg-muted"
                )}>
                  {toolCall.status === 'failed' 
                    ? toolCall.errorMessage || 'An error occurred'
                    : formatJson(toolCall.output)}
                </pre>
              </div>
            )}

            {toolCall.status === 'failed' && onRetry && (
              <div className="flex justify-end pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRetry}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Retrying...
                    </>
                  ) : (
                    'Retry'
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export default ToolCall;

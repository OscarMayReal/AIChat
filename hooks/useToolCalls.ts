import { useState, useCallback } from 'react';
import { useToast } from "@/components/ui/use-toast";

export interface ToolCall {
  id: string;
  toolId: string;
  toolName: string;
  input: any;
  output?: any;
  status: 'pending' | 'completed' | 'failed';
  errorMessage?: string;
  messageId?: string;
  createdAt: string;
}

export function useToolCalls(messageId?: string) {
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const { toast } = useToast();

  // Execute a tool
  const executeTool = useCallback(async (toolId: string, toolName: string, input: any) => {
    const callId = `call_${Date.now()}`;
    const newCall: ToolCall = {
      id: callId,
      toolId,
      toolName,
      input,
      status: 'pending',
      createdAt: new Date().toISOString(),
      messageId,
    };

    setToolCalls(prev => [...prev, newCall]);
    setIsExecuting(true);

    try {
      const response = await fetch('/api/tools/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolId,
          threadId: 'current-thread', // This should be replaced with actual thread ID
          input,
          messageId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to execute tool');
      }

      const { id: executionId } = await response.json();

      // Poll for execution status
      let execution;
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds max wait time
      
      while (attempts < maxAttempts) {
        const statusResponse = await fetch(`/api/tools/execute?executionId=${executionId}&threadId=current-thread`);
        
        if (statusResponse.ok) {
          execution = await statusResponse.json();
          
          if (execution.status !== 'pending') {
            break;
          }
        }
        
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between polls
      }

      if (!execution || execution.status === 'pending') {
        throw new Error('Tool execution timed out');
      }

      const updatedCall: ToolCall = {
        ...newCall,
        id: execution.id,
        output: execution.output ? JSON.parse(execution.output) : undefined,
        status: execution.status,
        errorMessage: execution.errorMessage,
      };

      setToolCalls(prev => 
        prev.map(call => call.id === callId ? updatedCall : call)
      );

      return execution.output ? JSON.parse(execution.output) : undefined;
    } catch (error) {
      console.error('Error executing tool:', error);
      
      const errorCall: ToolCall = {
        ...newCall,
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Failed to execute tool',
      };

      setToolCalls(prev => 
        prev.map(call => call.id === callId ? errorCall : call)
      );

      toast({
        title: 'Tool Execution Failed',
        description: error instanceof Error ? error.message : 'Failed to execute tool',
        variant: 'destructive',
      });

      return null;
    } finally {
      setIsExecuting(false);
    }
  }, [messageId, toast]);

  // Retry a failed tool call
  const retryToolCall = useCallback(async (toolCallId: string) => {
    const toolCall = toolCalls.find(call => call.id === toolCallId);
    if (!toolCall) return;

    return executeTool(toolCall.toolId, toolCall.toolName, toolCall.input);
  }, [executeTool, toolCalls]);

  // Clear all tool calls
  const clearToolCalls = useCallback(() => {
    setToolCalls([]);
  }, []);

  return {
    toolCalls,
    isExecuting,
    executeTool,
    retryToolCall,
    clearToolCalls,
  };
}

export default useToolCalls;

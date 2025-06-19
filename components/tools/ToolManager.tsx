import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Code, Save, Play } from "lucide-react";

export interface Tool {
  id: string;
  name: string;
  description: string;
  code: string;
  parameters: any;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  organizationId: string | null;
  projectId: string | null;
  organizationPublic: boolean;
}

interface ToolManagerProps {
  projectId?: string;
  onToolSelect?: (tool: Tool) => void;
  onToolExecute?: (tool: Tool, input: any) => Promise<any>;
}

export function ToolManager({ projectId, onToolSelect, onToolExecute }: ToolManagerProps) {
  const [tools, setTools] = useState<Tool[]>([]);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionInput, setExecutionInput] = useState("{}");
  const [executionOutput, setExecutionOutput] = useState<any>(null);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState<Partial<Tool>>({
    name: '',
    description: '',
    code: 'async function execute(input) {\n  // Your tool code here\n  // Return the result\n  return { result: "Success!" };\n}',
    parameters: {},
    projectId: projectId || null,
  });

  // Fetch tools
  useEffect(() => {
    const fetchTools = async () => {
      try {
        setIsLoading(true);
        const query = projectId ? `?projectId=${projectId}` : '';
        const response = await fetch(`/api/tools${query}`);
        if (!response.ok) throw new Error('Failed to fetch tools');
        const data = await response.json();
        setTools(data);
      } catch (error) {
        console.error('Error fetching tools:', error);
        toast({
          title: 'Error',
          description: 'Failed to load tools',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTools();
  }, [projectId, toast]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Save or update tool
  const handleSaveTool = async () => {
    try {
      setIsSaving(true);
      const url = selectedTool ? `/api/tools/${selectedTool.id}` : '/api/tools';
      const method = selectedTool ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error(selectedTool ? 'Failed to update tool' : 'Failed to create tool');

      const savedTool = await response.json();
      
      if (selectedTool) {
        setTools(tools.map(t => t.id === savedTool.id ? savedTool : t));
      } else {
        setTools([savedTool, ...tools]);
        setFormData({
          name: '',
          description: '',
          code: 'async function execute(input) {\n  // Your tool code here\n  // Return the result\n  return { result: "Success!" };\n}',
          parameters: {},
          projectId: projectId || null,
        });
      }

      toast({
        title: 'Success',
        description: selectedTool ? 'Tool updated successfully' : 'Tool created successfully',
      });

      if (!selectedTool) {
        setSelectedTool(savedTool);
      }
    } catch (error) {
      console.error('Error saving tool:', error);
      toast({
        title: 'Error',
        description: selectedTool ? 'Failed to update tool' : 'Failed to create tool',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Delete tool
  const handleDeleteTool = async (toolId: string) => {
    if (!confirm('Are you sure you want to delete this tool? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/tools/${toolId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete tool');

      setTools(tools.filter(tool => tool.id !== toolId));
      
      if (selectedTool?.id === toolId) {
        setSelectedTool(null);
        setFormData({
          name: '',
          description: '',
          code: 'async function execute(input) {\n  // Your tool code here\n  // Return the result\n  return { result: "Success!" };\n}',
          parameters: {},
          projectId: projectId || null,
        });
      }

      toast({
        title: 'Success',
        description: 'Tool deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting tool:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete tool',
        variant: 'destructive',
      });
    }
  };

  // Execute tool
  const handleExecuteTool = async () => {
    if (!selectedTool || !onToolExecute) return;
    
    try {
      setIsExecuting(true);
      setExecutionOutput(null);
      
      let input;
      try {
        input = JSON.parse(executionInput);
      } catch (e) {
        throw new Error('Invalid JSON input');
      }
      
      const result = await onToolExecute(selectedTool, input);
      setExecutionOutput(result);
      
      toast({
        title: 'Success',
        description: 'Tool executed successfully',
      });
    } catch (error) {
      console.error('Error executing tool:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to execute tool',
        variant: 'destructive',
      });
    } finally {
      setIsExecuting(false);
    }
  };

  // Select a tool to edit
  const selectTool = (tool: Tool) => {
    setSelectedTool(tool);
    setFormData({
      name: tool.name,
      description: tool.description,
      code: tool.code,
      parameters: tool.parameters || {},
      projectId: tool.projectId || projectId || null,
    });
  };

  // Create a new tool
  const createNewTool = () => {
    setSelectedTool(null);
    setFormData({
      name: '',
      description: '',
      code: 'async function execute(input) {\n  // Your tool code here\n  // Return the result\n  return { result: "Success!" };\n}',
      parameters: {},
      projectId: projectId || null,
    });
  };

  return (
    <div className="flex h-full">
      {/* Tool list */}
      <div className="w-64 border-r p-4 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Tools</h2>
          <Button size="sm" onClick={createNewTool}>
            <Plus className="h-4 w-4 mr-2" />
            New
          </Button>
        </div>
        
        {isLoading ? (
          <div className="text-center py-4">Loading tools...</div>
        ) : tools.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">No tools found</div>
        ) : (
          <div className="space-y-2">
            {tools.map(tool => (
              <div 
                key={tool.id}
                className={`p-3 rounded-md cursor-pointer hover:bg-accent ${selectedTool?.id === tool.id ? 'bg-accent' : ''}`}
                onClick={() => selectTool(tool)}
              >
                <div className="font-medium">{tool.name}</div>
                {tool.description && (
                  <div className="text-sm text-muted-foreground truncate">{tool.description}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tool editor */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">
              {selectedTool ? 'Edit Tool' : 'Create New Tool'}
            </h2>
            {selectedTool && (
              <Button variant="destructive" size="sm" onClick={() => handleDeleteTool(selectedTool.id)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name || ''}
                onChange={handleInputChange}
                placeholder="My Tool"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                name="description"
                value={formData.description || ''}
                onChange={handleInputChange}
                placeholder="What does this tool do?"
                className="mt-1"
              />
            </div>

            <div>
              <div className="flex justify-between items-center">
                <Label htmlFor="code">Code</Label>
                <div className="text-sm text-muted-foreground">
                  Must export an async function named 'execute' that takes an input object
                </div>
              </div>
              <Textarea
                id="code"
                name="code"
                value={formData.code || ''}
                onChange={handleInputChange}
                className="mt-1 font-mono h-64"
                spellCheck={false}
              />
            </div>

            {onToolExecute && selectedTool && (
              <div className="space-y-4">
                <div>
                  <Label>Test Tool</Label>
                  <div className="mt-1 space-y-2">
                    <div className="text-sm text-muted-foreground mb-1">
                      Input (JSON):
                    </div>
                    <Textarea
                      value={executionInput}
                      onChange={(e) => setExecutionInput(e.target.value)}
                      className="font-mono h-32"
                      placeholder="{\n  \"example\": \"value\"\n}"
                    />
                    <div className="flex justify-end">
                      <Button 
                        onClick={handleExecuteTool} 
                        disabled={isExecuting}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        {isExecuting ? 'Executing...' : 'Execute'}
                      </Button>
                    </div>
                  </div>
                </div>

                {executionOutput !== null && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">
                      Output:
                    </div>
                    <pre className="bg-muted p-4 rounded-md overflow-auto text-sm">
                      {typeof executionOutput === 'string' 
                        ? executionOutput 
                        : JSON.stringify(executionOutput, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end pt-4 border-t">
              <Button onClick={handleSaveTool} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Tool'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

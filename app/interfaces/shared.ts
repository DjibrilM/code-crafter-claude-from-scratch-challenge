export type Tool = {
  name: string;
  description: string;
  function: (...args: any[]) => any;
};

export interface ToolCallMessageHistory {
  role: "tool";
  tool_call_id: string;
  content: string;
}

export type ToolFunctions = Record<string, Tool>;

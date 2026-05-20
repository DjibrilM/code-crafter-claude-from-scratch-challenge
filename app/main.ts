import OpenAI from "openai";
import type {
  ToolCallMessageHistory,
  ToolFunctions,
} from "./interfaces/shared";
import { readFile, runBashCommand, writeFile } from "./functions";

const tools: ToolFunctions = {
  readFile: {
    name: "Read",
    description: "Read and returns file's contents",
    function: readFile,
  },
  writeFile: {
    name: "Write",
    description: "Writes content to a file",
    function: writeFile,
  },
  runShellCommand: {
    name: "Bash",
    description: "Execute bash command",
    function: runBashCommand,
  },
};

const messages: any[] = [];

async function main() {
  /* 
     For local testing I decide to use Ollama with a small model that I run on my machine,
     But feel free to use any solution you like,

     You can replace the environment variables with your own values, 
     or use a different approach, as long as the interface remains the same.
    Either way the logic of the code should run the same.
  */

  const [, , flag, prompt] = process.argv;
  const apiKey = process.env.OPENROUTER_API_KEY || "ollama";

  const baseURL =
    process.env.OPENROUTER_BASE_URL || "http://localhost:11434/v1";

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set");
  }

  if (flag !== "-p" || !prompt) {
    throw new Error("error: -p flag is required");
  }

  const client = new OpenAI({
    apiKey: apiKey,
    baseURL: baseURL,
  });

  let KeepLooping = true;

  messages.push({ role: "user", content: prompt });

  while (KeepLooping) {
    const response = await client.chat.completions.create({
      model: process.env.OPENROUTER_BASE_URL
        ? "anthropic/claude-haiku-4.5"
        : "gemma-4-custom",
      messages: messages,
      tools: [
        {
          type: "function",
          function: {
            name: "Read",
            description: "Read and returns file's contents",
            parameters: {
              type: "object",
              properties: {
                file_path: {
                  type: "string",
                  description: "Path to the file to read",
                },
              },
              required: ["file_path"],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "Write",
            description: "Writes content to a file",
            parameters: {
              type: "object",
              properties: {
                file_path: {
                  type: "string",
                  description: "Path to the file to write",
                },
                content: {
                  type: "string",
                  description: "Content to write to the file",
                },
              },
              required: ["file_path", "content"],
            },
          },
        },

        {
          type: "function",
          function: {
            name: "Bash",
            description: "Execute bash command",
            parameters: {
              require: ["command"],
              type: "object",
              properties: {
                command: {
                  type: "string",
                  description: "The bash command to execute",
                },
              },
            },
          },
        },
      ],
    });

    if (!response.choices || response.choices.length === 0) {
      throw new Error("no choices in response");
    }

    if ((response.choices[0].message.tool_calls?.length || 0) > 0) {
      const toolCalls = response.choices[0].message.tool_calls || [];

      messages.push({
        role: "assistant",
        content: response.choices[0].message.content,
        tool_calls: response.choices[0].message.tool_calls,
      });

      toolCalls.forEach((call) => {
        for (const tool of Object.values(tools)) {
          if (call.type === "function" && tool.name === call.function.name) {
            const exec = tool.function?.(JSON.parse(call.function.arguments));

            messages.push({
              role: "tool",
              content: exec,
              tool_call_id: call.id,
            } as ToolCallMessageHistory);
          }
        }
      });
    } else {
      KeepLooping = false;
      console.log(response.choices[0].message.content);
    }
  }
  return 0;
}

main();

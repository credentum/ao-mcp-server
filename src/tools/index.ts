/**
 * AO MCP Server Tool Registry
 *
 * CRITICAL_LLM_CONTEXT:
 *   - PURPOSE: Central registry of all MCP tools
 *   - WHY: Clean separation between tool definitions and implementations
 *   - EVIDENCE: Follows ao-lens MCP server pattern
 */

import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import type { ToolResult } from "../config";
import { AO_CONFIG } from "../config";
import { executeQueryProcess, type QueryProcessArgs } from "./query-process";
import { executeSendMessage, type SendMessageArgs } from "./send-message";
import { executeSpawnProcess, type SpawnProcessArgs } from "./spawn-process";
import { executeEvalLua, type EvalLuaArgs } from "./eval-lua";
import { executeListResults, type ListResultsArgs } from "./list-results";

/**
 * Tool Definitions for MCP Protocol
 */
export const TOOLS: Tool[] = [
  {
    name: "ao_query_process",
    description: `Query an AO process state using dryrun (read-only, no wallet needed). Use this to read process state, check balances, or call query handlers.

Example actions:
- "Info" - Get basic process info
- "GetState" - Get current state
- "GetBalance" - Get token balance
- "GetGenesisStatus" - Forge Chamber genesis status

Default Chamber PID for testing: ${AO_CONFIG.CHAMBER_PID}`,
    inputSchema: {
      type: "object",
      properties: {
        process_id: {
          type: "string",
          description: "The AO process ID (43-character Arweave transaction ID)",
        },
        action: {
          type: "string",
          description: "The action tag to send (e.g., 'Info', 'GetState'). Defaults to 'Info'",
        },
        data: {
          type: "string",
          description: "Optional JSON data to send with the query",
        },
        tags: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              value: { type: "string" },
            },
            required: ["name", "value"],
          },
          description: "Additional tags to include with the message",
        },
      },
      required: ["process_id"],
    },
  },
  {
    name: "ao_send_message",
    description: `Send a message to an AO process (state-changing, requires wallet). Use this to trigger actions that modify process state.

Example actions:
- "Transfer" - Transfer tokens
- "Breathe" - Trigger Forge breathing loop
- "RegisterMyth" - Register a myth in Forge Chamber

IMPORTANT: Requires wallet_json parameter with your Arweave JWK wallet.`,
    inputSchema: {
      type: "object",
      properties: {
        process_id: {
          type: "string",
          description: "The AO process ID (43-character Arweave transaction ID)",
        },
        action: {
          type: "string",
          description: "The action to perform (e.g., 'Transfer', 'Breathe')",
        },
        data: {
          type: "string",
          description: "JSON data to send with the message",
        },
        tags: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              value: { type: "string" },
            },
            required: ["name", "value"],
          },
          description: "Additional tags to include with the message",
        },
        wallet_json: {
          type: "string",
          description: "The JSON content of your Arweave JWK wallet (required for signing)",
        },
      },
      required: ["process_id", "action", "wallet_json"],
    },
  },
  {
    name: "ao_spawn_process",
    description: `Spawn a new AO process on the network. Creates a new persistent Lua process.

Defaults:
- Module: ${AO_CONFIG.AOS_MODULE} (aos Lua 5.3)
- Scheduler: ${AO_CONFIG.SCHEDULER} (AO mainnet)

IMPORTANT: Requires wallet_json parameter with your Arweave JWK wallet.`,
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Optional name for the process (stored as Name tag)",
        },
        module: {
          type: "string",
          description: `Module ID to use. Defaults to aos (${AO_CONFIG.AOS_MODULE})`,
        },
        scheduler: {
          type: "string",
          description: `Scheduler ID to use. Defaults to AO mainnet (${AO_CONFIG.SCHEDULER})`,
        },
        tags: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              value: { type: "string" },
            },
            required: ["name", "value"],
          },
          description: "Additional tags for the process",
        },
        wallet_json: {
          type: "string",
          description: "The JSON content of your Arweave JWK wallet (required for signing)",
        },
      },
      required: ["wallet_json"],
    },
  },
  {
    name: "ao_eval_lua",
    description: `Execute Lua code in an AO process. Use this to run Lua scripts, define handlers, or interact with process state.

Example usage:
- Define handlers: "Handlers.add(...)"
- Query state: "return State"
- Run calculations: "return 1 + 1"

IMPORTANT: Requires wallet_json parameter with your Arweave JWK wallet.`,
    inputSchema: {
      type: "object",
      properties: {
        process_id: {
          type: "string",
          description: "The AO process ID (43-character Arweave transaction ID)",
        },
        code: {
          type: "string",
          description: "Lua code to execute in the process",
        },
        wallet_json: {
          type: "string",
          description: "The JSON content of your Arweave JWK wallet (required for signing)",
        },
      },
      required: ["process_id", "code", "wallet_json"],
    },
  },
  {
    name: "ao_list_results",
    description: "List message results/history from an AO process. Use this to see recent messages and their responses.",
    inputSchema: {
      type: "object",
      properties: {
        process_id: {
          type: "string",
          description: "The AO process ID (43-character Arweave transaction ID)",
        },
        limit: {
          type: "number",
          description: "Maximum number of results to return (default: 10)",
        },
        from: {
          type: "string",
          description: "Cursor to start from (for pagination)",
        },
        sort: {
          type: "string",
          enum: ["ASC", "DESC"],
          description: "Sort order (default: DESC for newest first)",
        },
      },
      required: ["process_id"],
    },
  },
];

/**
 * Handle tool calls by routing to appropriate implementation
 */
export async function handleToolCall(
  name: string,
  args: Record<string, unknown>
): Promise<ToolResult> {
  switch (name) {
    case "ao_query_process":
      return executeQueryProcess(args as unknown as QueryProcessArgs);

    case "ao_send_message":
      return executeSendMessage(args as unknown as SendMessageArgs);

    case "ao_spawn_process":
      return executeSpawnProcess(args as unknown as SpawnProcessArgs);

    case "ao_eval_lua":
      return executeEvalLua(args as unknown as EvalLuaArgs);

    case "ao_list_results":
      return executeListResults(args as unknown as ListResultsArgs);

    default:
      return {
        content: [{ type: "text", text: `Unknown tool: ${name}` }],
        isError: true,
      };
  }
}

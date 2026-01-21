/**
 * AO MCP Server
 *
 * CRITICAL_LLM_CONTEXT:
 *   - PURPOSE: MCP server exposing AO operations as tools
 *   - WHY MCP: Standardized protocol for AI-to-data connections
 *   - EVIDENCE: Market discovery - 696 HN hits for Claude MCP
 *   - TRANSPORT: stdio for Claude Desktop compatibility
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { SERVER_INFO } from "./config";
import { TOOLS, handleToolCall } from "./tools/index";

/**
 * AO MCP Server Class
 *
 * Exposes AO operations as MCP tools:
 * - ao_query_process: Read-only queries via dryrun
 * - ao_send_message: State-changing messages
 * - ao_spawn_process: Create new processes
 * - ao_eval_lua: Execute Lua code
 * - ao_list_results: View message history
 */
export class AOMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: SERVER_INFO.name,
        version: SERVER_INFO.version,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  /**
   * Setup MCP request handlers
   */
  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: TOOLS,
    }));

    // Handle tool calls
    // Note: Type cast needed due to MCP SDK 1.25.x type changes
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        const result = await handleToolCall(name, args ?? {});
        return result as any;
      } catch (error) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
          isError: true,
        } as any;
      }
    });
  }

  /**
   * Start the MCP server on stdio transport
   */
  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error(`${SERVER_INFO.name} v${SERVER_INFO.version} running on stdio`);
  }
}

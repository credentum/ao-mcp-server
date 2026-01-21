#!/usr/bin/env node
/**
 * AO MCP Server - Entry Point
 *
 * MCP server for AO/Arweave that lets Claude Desktop, Cursor, and other
 * MCP clients interact with AO processes.
 *
 * Usage:
 *   npx ao-mcp-server
 *   node dist/index.js
 *
 * Configure in Claude Desktop:
 *   {
 *     "mcpServers": {
 *       "ao": {
 *         "command": "npx",
 *         "args": ["@anthropic-community/ao-mcp-server"]
 *       }
 *     }
 *   }
 */

import { AOMCPServer } from "./server";

// Start server
const server = new AOMCPServer();
server.run().catch((error) => {
  console.error("Failed to start AO MCP server:", error);
  process.exit(1);
});

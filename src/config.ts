/**
 * AO Configuration Constants
 *
 * CRITICAL_LLM_CONTEXT:
 *   - PURPOSE: Central configuration for AO network parameters
 *   - WHY: Avoid hardcoding network constants across tools
 *   - EVIDENCE: Values from AO mainnet documentation and forge tests
 */

/**
 * AO Network Configuration
 */
export const AO_CONFIG = {
  /**
   * AOS Module ID - the WASM module for aos processes
   * This is the standard Lua 5.3 runtime on AO
   */
  AOS_MODULE: "Do_Uc2Sju_ffp6Ev0AnLVdPtot15rvMjP-a9VVaA5fM",

  /**
   * Default Scheduler ID for AO mainnet
   * Handles message ordering and epoch management
   */
  SCHEDULER: "_GQ33BkPtZrqxA84vM8Zk-N2aO0toNNu_C-l-rawrBA",

  /**
   * Forge Chamber Process ID (example for testing)
   * The Eden Chamber - first breath completed 2026-01-20
   */
  CHAMBER_PID: "4Kg8kj1SZPPMNOskIY0TlCfhJri8XEHsSAE8j-k0FOA",
} as const;

/**
 * MCP Server Metadata
 */
export const SERVER_INFO = {
  name: "ao-mcp-server",
  version: "1.0.0",
  description: "MCP server for AO/Arweave - query processes, send messages, spawn processes, execute Lua",
} as const;

/**
 * Tool Result Types
 */
export interface ToolResult {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
}

/**
 * Common error messages
 */
export const ERROR_MESSAGES = {
  INVALID_PROCESS_ID: "Invalid process ID. Must be a 43-character Arweave transaction ID.",
  NO_WALLET: "No wallet configured. Send-message, spawn, and eval operations require a wallet.",
  PROCESS_NOT_FOUND: "Process not found or not responding.",
  MESSAGE_FAILED: "Failed to send message to process.",
  SPAWN_FAILED: "Failed to spawn new process.",
} as const;

/**
 * ao_spawn_process Tool
 *
 * CRITICAL_LLM_CONTEXT:
 *   - PURPOSE: Spawn a new AO process
 *   - WHY: Creates new persistent process on AO network
 *   - REQUIRES: Wallet for signing
 *   - EVIDENCE: Forge first-breath ceremony uses spawn() for Chamber creation
 */

import { spawn, createDataItemSigner } from "@permaweb/aoconnect";
import { AO_CONFIG, type ToolResult } from "../config";

export interface SpawnProcessArgs {
  name?: string;
  module?: string;
  scheduler?: string;
  tags?: Array<{ name: string; value: string }>;
  wallet_json: string;
}

/**
 * Spawn a new AO process
 *
 * @param args - Spawn arguments including wallet
 * @returns Tool result with new process ID
 */
export async function executeSpawnProcess(args: SpawnProcessArgs): Promise<ToolResult> {
  try {
    // Validate wallet
    if (!args.wallet_json) {
      return {
        content: [{
          type: "text",
          text: "Error: wallet_json is required for spawning processes. Provide the JSON content of your Arweave wallet.",
        }],
        isError: true,
      };
    }

    // Parse wallet
    let jwk;
    try {
      jwk = JSON.parse(args.wallet_json);
    } catch {
      return {
        content: [{
          type: "text",
          text: "Error: Invalid wallet JSON. Ensure it is a valid Arweave JWK.",
        }],
        isError: true,
      };
    }

    const signer = createDataItemSigner(jwk);

    // Build tags array
    const tags: Array<{ name: string; value: string }> = [];

    // Add name tag if provided
    if (args.name) {
      tags.push({ name: "Name", value: args.name });
    }

    // Add custom tags if provided
    if (args.tags) {
      tags.push(...args.tags);
    }

    // Spawn process
    const pid = await spawn({
      module: args.module || AO_CONFIG.AOS_MODULE,
      scheduler: args.scheduler || AO_CONFIG.SCHEDULER,
      signer,
      tags,
    });

    return {
      content: [{
        type: "text",
        text: `Process spawned successfully!\n\nProcess ID: ${pid}\nModule: ${args.module || AO_CONFIG.AOS_MODULE}\nScheduler: ${args.scheduler || AO_CONFIG.SCHEDULER}${args.name ? `\nName: ${args.name}` : ""}\n\nYou can now send messages to this process using the ao_send_message tool.`,
      }],
    };
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `Error spawning process: ${error instanceof Error ? error.message : "Unknown error"}`,
      }],
      isError: true,
    };
  }
}

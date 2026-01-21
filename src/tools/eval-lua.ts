/**
 * ao_eval_lua Tool
 *
 * CRITICAL_LLM_CONTEXT:
 *   - PURPOSE: Execute Lua code in an AO process
 *   - WHY: Allows dynamic code execution and process setup
 *   - REQUIRES: Wallet for signing
 *   - EVIDENCE: Forge first-breath ceremony uses Eval to load handlers
 */

import { message, result, createDataItemSigner } from "@permaweb/aoconnect";
import type { ToolResult } from "../config";

export interface EvalLuaArgs {
  process_id: string;
  code: string;
  wallet_json: string;
}

/**
 * Execute Lua code in an AO process
 *
 * @param args - Eval arguments including wallet and code
 * @returns Tool result with execution output
 */
export async function executeEvalLua(args: EvalLuaArgs): Promise<ToolResult> {
  try {
    // Validate process ID format
    if (!args.process_id || args.process_id.length !== 43) {
      return {
        content: [{
          type: "text",
          text: `Error: Invalid process ID "${args.process_id}". Must be a 43-character Arweave transaction ID.`,
        }],
        isError: true,
      };
    }

    // Validate code
    if (!args.code || args.code.trim().length === 0) {
      return {
        content: [{
          type: "text",
          text: "Error: code is required. Provide Lua code to execute.",
        }],
        isError: true,
      };
    }

    // Validate wallet
    if (!args.wallet_json) {
      return {
        content: [{
          type: "text",
          text: "Error: wallet_json is required for executing Lua code. Provide the JSON content of your Arweave wallet.",
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

    // Send Eval message
    const msgId = await message({
      process: args.process_id,
      signer,
      tags: [{ name: "Action", value: "Eval" }],
      data: args.code,
    });

    // Get result
    const res = await result({
      process: args.process_id,
      message: msgId,
    });

    // Process response
    if (res?.Error) {
      return {
        content: [{
          type: "text",
          text: `Lua execution error:\n${res.Error}`,
        }],
        isError: true,
      };
    }

    // Check for output
    const output = res?.Output?.data || "";

    // Check for messages (some handlers respond via messages)
    if (res?.Messages && res.Messages.length > 0) {
      const msg = res.Messages[0];
      const actionTag = msg.Tags?.find((t: { name: string; value: string }) => t.name === "Action");

      if (actionTag?.value === "Error") {
        return {
          content: [{
            type: "text",
            text: `Lua execution error:\n${msg.Data}`,
          }],
          isError: true,
        };
      }

      return {
        content: [{
          type: "text",
          text: `Lua code executed successfully!\nMessage ID: ${msgId}\n\nOutput:\n${output || "(no output)"}\n\nResponse (Action: ${actionTag?.value || "unknown"}):\n${msg.Data || "(no data)"}`,
        }],
      };
    }

    return {
      content: [{
        type: "text",
        text: `Lua code executed successfully!\nMessage ID: ${msgId}\n\nOutput:\n${output || "(no output)"}`,
      }],
    };
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `Error executing Lua code: ${error instanceof Error ? error.message : "Unknown error"}`,
      }],
      isError: true,
    };
  }
}

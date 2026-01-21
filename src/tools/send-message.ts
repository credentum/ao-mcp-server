/**
 * ao_send_message Tool
 *
 * CRITICAL_LLM_CONTEXT:
 *   - PURPOSE: Send a message to an AO process (state-changing)
 *   - WHY: message() sends transactions that can modify process state
 *   - REQUIRES: Wallet for signing
 *   - EVIDENCE: Forge first-breath ceremony uses message() for state changes
 */

import { message, result, createDataItemSigner } from "@permaweb/aoconnect";
import type { ToolResult } from "../config";

export interface SendMessageArgs {
  process_id: string;
  action: string;
  data?: string;
  tags?: Array<{ name: string; value: string }>;
  wallet_json?: string;
}

/**
 * Send a message to an AO process (requires wallet for signing)
 *
 * @param args - Message arguments including wallet
 * @returns Tool result with message response
 */
export async function executeSendMessage(args: SendMessageArgs): Promise<ToolResult> {
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

    // Validate wallet
    if (!args.wallet_json) {
      return {
        content: [{
          type: "text",
          text: "Error: wallet_json is required for sending messages. Provide the JSON content of your Arweave wallet.",
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
    const tags: Array<{ name: string; value: string }> = [
      { name: "Action", value: args.action },
    ];

    // Add custom tags if provided
    if (args.tags) {
      tags.push(...args.tags);
    }

    // Send message
    const msgId = await message({
      process: args.process_id,
      signer,
      tags,
      data: args.data || "{}",
    });

    // Get result
    const res = await result({
      process: args.process_id,
      message: msgId,
    });

    // Process response
    if (res?.Messages && res.Messages.length > 0) {
      const msg = res.Messages[0];
      const actionTag = msg.Tags?.find((t: { name: string; value: string }) => t.name === "Action");
      const responseData = msg.Data;

      // Check for error response
      if (actionTag?.value === "Error") {
        return {
          content: [{
            type: "text",
            text: `Message sent (ID: ${msgId}) but process returned error:\n${responseData}`,
          }],
          isError: true,
        };
      }

      // Try to parse as JSON
      try {
        const parsed = JSON.parse(responseData);
        return {
          content: [{
            type: "text",
            text: `Message sent successfully!\nMessage ID: ${msgId}\nAction: ${actionTag?.value || "unknown"}\nResponse:\n${JSON.stringify(parsed, null, 2)}`,
          }],
        };
      } catch {
        return {
          content: [{
            type: "text",
            text: `Message sent successfully!\nMessage ID: ${msgId}\nAction: ${actionTag?.value || "unknown"}\nResponse:\n${responseData}`,
          }],
        };
      }
    }

    // Check for errors
    if (res?.Error) {
      return {
        content: [{
          type: "text",
          text: `Message sent (ID: ${msgId}) but process error: ${res.Error}`,
        }],
        isError: true,
      };
    }

    // Check for output
    if (res?.Output?.data) {
      return {
        content: [{
          type: "text",
          text: `Message sent successfully!\nMessage ID: ${msgId}\nOutput:\n${res.Output.data}`,
        }],
      };
    }

    return {
      content: [{
        type: "text",
        text: `Message sent successfully!\nMessage ID: ${msgId}\nNo response data returned.`,
      }],
    };
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `Error sending message: ${error instanceof Error ? error.message : "Unknown error"}`,
      }],
      isError: true,
    };
  }
}

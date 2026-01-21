/**
 * ao_query_process Tool
 *
 * CRITICAL_LLM_CONTEXT:
 *   - PURPOSE: Query AO process state via dryrun (read-only)
 *   - WHY: dryrun is read-only, no state change, no wallet needed
 *   - RETURNS: Process state or action result as JSON
 *   - EVIDENCE: Forge centering script uses dryrun for state queries
 */

import { dryrun } from "@permaweb/aoconnect";
import type { ToolResult } from "../config";

export interface QueryProcessArgs {
  process_id: string;
  action?: string;
  data?: string;
  tags?: Array<{ name: string; value: string }>;
}

/**
 * Query an AO process using dryrun (read-only operation)
 *
 * @param args - Query arguments
 * @returns Tool result with process response
 */
export async function executeQueryProcess(args: QueryProcessArgs): Promise<ToolResult> {
  try {
    // Validate process ID format (43-character Arweave TX ID)
    if (!args.process_id || args.process_id.length !== 43) {
      return {
        content: [{
          type: "text",
          text: `Error: Invalid process ID "${args.process_id}". Must be a 43-character Arweave transaction ID.`,
        }],
        isError: true,
      };
    }

    // Build tags array
    const tags: Array<{ name: string; value: string }> = [
      { name: "Action", value: args.action || "Info" },
    ];

    // Add custom tags if provided
    if (args.tags) {
      tags.push(...args.tags);
    }

    // Execute dryrun (read-only, no wallet needed)
    const response = await dryrun({
      process: args.process_id,
      tags,
      data: args.data || "{}",
    });

    // Extract result from Messages
    if (response.Messages && response.Messages.length > 0) {
      const message = response.Messages[0];
      const actionTag = message.Tags?.find((t: { name: string; value: string }) => t.name === "Action");
      const responseData = message.Data;

      // Check for error response
      if (actionTag?.value === "Error") {
        return {
          content: [{
            type: "text",
            text: `Process returned error: ${responseData}`,
          }],
          isError: true,
        };
      }

      // Try to parse as JSON for pretty output
      try {
        const parsed = JSON.parse(responseData);
        return {
          content: [{
            type: "text",
            text: `Process response (Action: ${actionTag?.value || "unknown"}):\n${JSON.stringify(parsed, null, 2)}`,
          }],
        };
      } catch {
        // Return raw data if not JSON
        return {
          content: [{
            type: "text",
            text: `Process response (Action: ${actionTag?.value || "unknown"}):\n${responseData}`,
          }],
        };
      }
    }

    // Check for direct output
    if (response.Output?.data) {
      return {
        content: [{
          type: "text",
          text: `Process output:\n${response.Output.data}`,
        }],
      };
    }

    // Check for errors
    if (response.Error) {
      return {
        content: [{
          type: "text",
          text: `Process error: ${response.Error}`,
        }],
        isError: true,
      };
    }

    return {
      content: [{
        type: "text",
        text: "No response from process. The process may not have a handler for this action.",
      }],
    };
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `Error querying process: ${error instanceof Error ? error.message : "Unknown error"}`,
      }],
      isError: true,
    };
  }
}

/**
 * ao_list_results Tool
 *
 * CRITICAL_LLM_CONTEXT:
 *   - PURPOSE: Get message history/results from a process
 *   - WHY: Allows reviewing past messages and their results
 *   - EVIDENCE: AO processes maintain message history accessible via results()
 */

import { results } from "@permaweb/aoconnect";
import type { ToolResult } from "../config";

export interface ListResultsArgs {
  process_id: string;
  limit?: number;
  from?: string;
  sort?: "ASC" | "DESC";
}

/**
 * List results/message history from an AO process
 *
 * @param args - Query arguments
 * @returns Tool result with message history
 */
export async function executeListResults(args: ListResultsArgs): Promise<ToolResult> {
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

    // Query results
    const res = await results({
      process: args.process_id,
      limit: args.limit || 10,
      from: args.from,
      sort: args.sort || "DESC",
    });

    if (!res?.edges || res.edges.length === 0) {
      return {
        content: [{
          type: "text",
          text: `No results found for process ${args.process_id}`,
        }],
      };
    }

    // Format results
    const formattedResults = res.edges.map((edge: {
      cursor: string;
      node: {
        Output?: { data?: string };
        Messages?: Array<{
          Tags?: Array<{ name: string; value: string }>;
          Data?: string;
        }>;
        Error?: string;
      };
    }, index: number) => {
      const node = edge.node;
      const output = node.Output?.data || "";
      const messages = node.Messages || [];
      const error = node.Error;

      let result = `--- Result ${index + 1} (cursor: ${edge.cursor}) ---\n`;

      if (error) {
        result += `Error: ${error}\n`;
      }

      if (output) {
        result += `Output: ${output.substring(0, 200)}${output.length > 200 ? "..." : ""}\n`;
      }

      if (messages.length > 0) {
        const msg = messages[0];
        const actionTag = msg.Tags?.find(t => t.name === "Action");
        result += `Message Action: ${actionTag?.value || "unknown"}\n`;
        if (msg.Data) {
          const dataPreview = msg.Data.substring(0, 200);
          result += `Message Data: ${dataPreview}${msg.Data.length > 200 ? "..." : ""}\n`;
        }
      }

      return result;
    });

    return {
      content: [{
        type: "text",
        text: `Results for process ${args.process_id}:\n\n${formattedResults.join("\n")}`,
      }],
    };
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `Error listing results: ${error instanceof Error ? error.message : "Unknown error"}`,
      }],
      isError: true,
    };
  }
}

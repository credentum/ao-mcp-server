# AO MCP Server

MCP (Model Context Protocol) server for AO/Arweave that lets Claude Desktop, Cursor, and other MCP clients interact with AO processes.

## Features

- **ao_query_process** - Query process state (read-only, no wallet needed)
- **ao_send_message** - Send messages to processes (requires wallet)
- **ao_spawn_process** - Create new AO processes (requires wallet)
- **ao_eval_lua** - Execute Lua code in processes (requires wallet)
- **ao_list_results** - View process message history

## Installation

```bash
npm install -g ao-mcp-server
```

Or run directly with npx:

```bash
npx ao-mcp-server
```

## Configuration

### Claude Desktop

Add to your `~/.config/claude/claude_desktop_config.json` (Linux/Mac) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "ao": {
      "command": "npx",
      "args": ["ao-mcp-server"]
    }
  }
}
```

### Cursor

Add to your Cursor MCP settings:

```json
{
  "mcpServers": {
    "ao": {
      "command": "npx",
      "args": ["ao-mcp-server"]
    }
  }
}
```

## Usage Examples

### Query a Process (No Wallet Needed)

Query any AO process state:

```
Use ao_query_process with:
- process_id: <43-character-arweave-tx-id>
- action: Info
```

### Send a Message (Requires Wallet)

```
Use ao_send_message with:
- process_id: <your-process-id>
- action: Transfer
- data: {"Recipient": "...", "Quantity": "100"}
- wallet_json: <your-wallet-json>
```

### Spawn a Process (Requires Wallet)

```
Use ao_spawn_process with:
- name: MyProcess
- wallet_json: <your-wallet-json>
```

### Execute Lua Code (Requires Wallet)

```
Use ao_eval_lua with:
- process_id: <your-process-id>
- code: return State
- wallet_json: <your-wallet-json>
```

## Wallet Configuration

For operations that require signing (send, spawn, eval), you need to provide your Arweave JWK wallet as JSON. You can:

1. **Pass directly** - Include the wallet JSON in the `wallet_json` parameter
2. **Use a file** - Read from a wallet file and pass the contents

Example wallet structure:
```json
{
  "kty": "RSA",
  "n": "...",
  "e": "AQAB",
  "d": "...",
  ...
}
```

## AO Network Defaults

- **Module**: `Do_Uc2Sju_ffp6Ev0AnLVdPtot15rvMjP-a9VVaA5fM` (aos Lua 5.3)
- **Scheduler**: `_GQ33BkPtZrqxA84vM8Zk-N2aO0toNNu_C-l-rawrBA` (AO mainnet)

## Development

```bash
# Clone the repository
git clone https://github.com/credentum/ao-mcp-server
cd ao-mcp-server

# Install dependencies
npm install

# Build
npm run build

# Run locally
npm start
```

## Architecture

```
ao-mcp-server/
├── src/
│   ├── index.ts           # Entry point
│   ├── server.ts          # MCP server class
│   ├── config.ts          # AO constants
│   └── tools/
│       ├── index.ts       # Tool registry
│       ├── query-process.ts
│       ├── send-message.ts
│       ├── spawn-process.ts
│       ├── eval-lua.ts
│       └── list-results.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Related Projects

- [AO](https://ao.arweave.dev/) - Hyper-parallel computer on Arweave
- [Arweave](https://arweave.org/) - Permanent data storage
- [MCP](https://modelcontextprotocol.io/) - Model Context Protocol

## License

MIT

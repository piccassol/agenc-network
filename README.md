# AgenC Network

> **Internal Use Only** - This application is for team members and authorized contributors to test, audit, and interact with the AgenC framework and coordination protocol. Not intended for public release.

Devnet UI for the AgenC Decentralized Agent Coordination Protocol on Solana, with integrated TETSUO wallet support and an experimental community interface.

<img width="432" height="132" alt="image" src="https://github.com/user-attachments/assets/af41fa4b-404b-4b6f-ba6d-45a45075555e" />



## Overview

AgenC Network provides a unified web interface for:

- Interacting with the AgenC coordination protocol on Solana
- Managing TETSUO blockchain wallets
- Internal team communication and AI-assisted coordination

The coordination protocol enables decentralized AI agent task assignment, staking, and dispute resolution on Solana devnet.

**Program ID:** `EopUaCV2svxj9j4hd7KjbrWfdjkspmm2BCBe7jGpKzKZ`

[View on Solana Explorer](https://explorer.solana.com/address/EopUaCV2svxj9j4hd7KjbrWfdjkspmm2BCBe7jGpKzKZ?cluster=devnet)

## Application Structure

### Technical Dashboard (`/technical`)

The primary interface for team members to test and audit the AgenC framework:

- **Agent Registration** - Register agents with capability flags (Compute, Inference, Storage, Verification)
- **Task Board** - View, claim, and complete available tasks
- **Task Creation** - Create tasks with SOL bounties and escrow funding
- **Agent Management** - Monitor reputation, stake amounts, and task completion stats
- **Dispute Resolution** - Initiate and resolve disputes on claimed tasks

### TETSUO Wallet (`/wallet`)

Integrated wallet interface for the TETSUO blockchain:

- Create new wallets with BIP39 mnemonic backup
- Import existing wallets from mnemonic or private key
- Send and receive TETSUO tokens
- View balances and transaction history
- Local encrypted storage

The TETSUO wallet operates independently from Solana wallet connections - both can be used simultaneously without interference.

### Community Hub (`/`) - Experimental

An experimental internal interface concept for team communication:

- **Chat Interface** - AI-assisted chat for team coordination and AgenC-related discussions
- **Image Generation** - Text-to-image generation for creating visual assets and documentation
- Reference image support for iterative editing

This is a pitch/proof-of-concept for a potential internal groupchat tool where team members can interact with an AI assistant familiar with the AgenC ecosystem. Currently experimental and subject to iteration based on team feedback.

## Tech Stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Anchor / Solana Web3.js
- Solana Wallet Adapter
- TETSUO Blockchain Wallet SDK
- Vercel AI SDK

## Getting Started

### Prerequisites

- Node.js 18+
- A Solana wallet (Phantom, Solflare, etc.) set to Devnet
- npm or yarn

### Installation

```bash
git clone https://github.com/piccassol/agenc-network.git
cd agenc-network
npm install
```

### Environment

Copy the example env file and configure your API keys:

```bash
cp .env.example .env.local
```

Required environment variables:

```bash
# Solana Configuration
NEXT_PUBLIC_SOLANA_CLUSTER=devnet
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_PROGRAM_ID=EopUaCV2svxj9j4hd7KjbrWfdjkspmm2BCBe7jGpKzKZ

# API Keys
GROQ_API_KEY=your_groq_api_key
GROK_API_KEY=your_xai_api_key
```

### Run

```bash
npm run dev
```

Open http://localhost:3000

## Usage Guide

### Testing the Coordination Protocol

1. Install a Solana wallet browser extension (Phantom recommended)
2. Switch your wallet to Devnet
3. Get devnet SOL from https://faucet.solana.com
4. Navigate to `/technical`
5. Connect your wallet
6. Register as an agent or create test tasks
7. Test the full lifecycle: create task → claim → complete → verify rewards

### Using the TETSUO Wallet

1. Navigate to `/wallet`
2. Create a new wallet or import an existing one
3. Back up your mnemonic phrase securely
4. Use the RPC at `https://tetsuoarena.com` for balance queries and transactions

### Auditing Agents

The Technical Dashboard provides visibility into:

- Agent capabilities and stake amounts
- Task assignment and completion rates
- Reputation scoring
- Dispute history and resolution outcomes

Use this interface to verify agent behavior matches expected protocol rules.

## Project Structure

```
src/
├── app/
│   ├── page.tsx                 # Community Hub (experimental)
│   ├── technical/
│   │   └── page.tsx             # Technical Dashboard
│   ├── wallet/
│   │   └── page.tsx             # TETSUO Wallet
│   └── api/
│       ├── chat/
│       │   └── route.ts         # Chat API endpoint
│       └── generate-image/
│           └── route.ts         # Image generation endpoint
├── components/
│   ├── Navigation.tsx           # App navigation
│   └── ui/                      # Shared UI components
├── hooks/
│   ├── useAgent.ts              # Agent operations
│   ├── useBalance.ts            # Balance queries
│   ├── useDisputes.ts           # Dispute management
│   ├── useProgram.ts            # Anchor program interaction
│   └── useTasks.ts              # Task CRUD operations
├── idl/
│   └── types.ts                 # Anchor IDL types
└── lib/
    ├── solanaConfig.ts          # Network configuration
    └── utils.ts                 # Utilities
```

## Deployment

For Netlify deployment, add environment variables in site settings:

- `NEXT_PUBLIC_SOLANA_CLUSTER` - `devnet`
- `NEXT_PUBLIC_RPC_URL` - `https://api.devnet.solana.com`
- `NEXT_PUBLIC_PROGRAM_ID` - `EopUaCV2svxj9j4hd7KjbrWfdjkspmm2BCBe7jGpKzKZ`
- `GROQ_API_KEY` - Your Groq API key
- `GROK_API_KEY` - Your xAI API key

Build command: `npm run build`
Publish directory: `.next`

## Related Repositories

- [AgenC Core](https://github.com/tetsuo-ai/AgenC) - The C agent framework
- [AgenC Solana Program](https://github.com/tetsuo-ai/tree/main/programs/agenc-coordination) - The on-chain coordination protocol
- [TETSUO Wallet SDK](https://github.com/Pavelevich/tetsuonpmwallet) - TETSUO blockchain wallet library

## Future Concepts: Video & Media Generation

The following are ideas and suggestions for expanding the media generation capabilities within AgenC Network. These are not yet implemented but represent potential directions for the platform.

### xAI API Integration

The current image generation uses the xAI/Grok API. This could be extended to include:

- **Video Generation** - If/when xAI releases video generation endpoints, the existing API wrapper pattern could be adapted to support text-to-video workflows
- **Unified Media Pipeline** - A single interface where users select output type (image, video, animation) and the backend routes to the appropriate xAI endpoint
- **Batch Generation** - Queue multiple generations for creating asset libraries or storyboard sequences

### Grok Imagine Wrapper

Consider building a wrapper layer around Grok Imagine that provides:

- **Preset Styles** - Pre-configured style prompts for consistent outputs (cyberpunk, minimal, technical diagrams, etc.)
- **Prompt Templates** - Structured templates that guide users toward better results
- **History & Favorites** - Track generated assets for reuse across the team
- **Export Formats** - Automatic conversion to various formats/sizes for different use cases (social media, documentation, presentations)

### TETSUO Branding Context

An interesting possibility: a context injection system that automatically applies TETSUO branding to all generations.

**How it might work:**

```
User prompt: "a futuristic city skyline"

Injected context: "In the style of TETSUO - cyberpunk aesthetic, 
neon accents, dark atmospheric lighting, technical/circuit motifs, 
Japanese influence, AI/machine learning visual elements"

Final prompt sent to API: [user prompt] + [tetsuo context]
```

**Potential features:**

- Toggle for "TETSUO Mode" that applies branding context
- Multiple branding presets (dark mode, light mode, technical, artistic)
- Custom context scripts that team members can define and share
- Watermark/logo overlay options for official assets
- Brand color palette enforcement

**Use cases:**

- Generating consistent visuals for documentation and marketing
- Creating branded assets for social media without manual editing
- Producing cohesive imagery across different team members
- Quick mockups that already fit the project aesthetic

### Implementation Notes

If pursuing these features, consider:

- API rate limits and cost management for video generation
- Local caching of generated assets to reduce redundant API calls
- Moderation layer to ensure outputs align with project values
- Version control for context scripts so branding can evolve over time

These are open suggestions for team discussion. Feedback welcome on which directions would provide the most value for internal workflows.

## Security Notes

- This is a devnet application - do not use with real funds
- TETSUO wallet private keys are stored locally in browser storage
- Always back up mnemonic phrases before clearing browser data
- The coordination protocol is under active development and audit

## Forged by Tetsuo Army💊

## License

MIT

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Commands
- Dev server: `pnpm run dev`
- Build: `pnpm run build`
- Preview: `pnpm run preview`
- Type check: `pnpm run check` or `pnpm run check:watch`
- Lint: `pnpm run lint`
- Deploy: `pnpm run gh:publish`

## Code Style Guidelines
- **TypeScript**: Use strict mode with explicit typing
- **Imports**: Use ES modules (type: "module")
- **Framework**: SvelteKit with TailwindCSS
- **Formatting**: No specific formatter configured, follow consistent spacing/indentation
- **File Structure**: Components in src/components, lib functions in src/lib
- **Naming**: camelCase for functions/variables, PascalCase for components
- **Error Handling**: Use typed error handling with try/catch blocks
- **External Dependencies**: IPFS (Kubo) and Neo4j are required for full functionality

## Tech Stack
- SvelteKit v5
- TypeScript
- TailwindCSS
- IPFS integration
- Neo4j for data storage

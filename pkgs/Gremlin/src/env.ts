import { defineEnvVars } from '@sveltejs/kit/env'
import * as v from 'valibot'

export const variables = defineEnvVars({
  PUBLIC_APPKIT_PROJECT_ID: {
    schema: v.string(),
    description: 'APPKit API Key',
    public: true,
    static: true,
  },
  SESSION_SECRET: {
    schema: v.string(),
    description: 'Secret Key',
    public: false,
  },
  PUBLIC_EDITOR_URL: {
    schema: v.optional(v.string()),
    description: 'Base URL for embedded VS Code',
    public: true,
  },
  PUBLIC_IPFS_URL_PATTERN: {
    schema: v.optional(v.string()),
    public: true,
  },
  PUBLIC_IPFS_API: {
    schema: v.optional(v.string()),
    public: true,
  },
  PUBLIC_IPFS_TIMEOUT: {
    schema: v.optional(v.string()),
    public: true,
  },
  PUBLIC_NEO4J_URI: {
    schema: v.optional(v.string()),
    public: true,
  },
  PUBLIC_NEO4J_USER: {
    schema: v.optional(v.string()),
    public: true,
  },
  PUBLIC_NEO4J_PASS: {
    schema: v.optional(v.string()),
    public: true,
  },
  PUBLIC_LIMIT: {
    schema: v.optional(v.string()),
    public: true,
  },
  PUBLIC_DEBUGGING: {
    schema: v.optional(v.string()),
    public: true,
  },
  PUBLIC_USE_KUBO: {
    schema: v.optional(v.string()),
    public: true,
  },
  PUBLIC_USE_STORACHA: {
    schema: v.optional(v.string()),
    public: true,
  },
  PUBLIC_DETAILS_ZOOM: {
    schema: v.optional(v.string()),
    public: true,
  },
  PUBLIC_JANUSGRAPH_URL: {
    schema: v.optional(v.string()),
    public: true,
  },
  PUBLIC_JANUSGRAPH_USERNAME: {
    schema: v.optional(v.string()),
    public: true,
  },
  PUBLIC_JANUSGRAPH_PASSWORD: {
    schema: v.optional(v.string()),
    public: true,
  },
  PUBLIC_PUBLIC_JANUSGRAPH_URL: {
    schema: v.optional(v.string()),
    public: true,
  },
})

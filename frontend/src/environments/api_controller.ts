import { environment } from './environment';

/**
 * Centralized API Endpoints Controller
 * All API endpoints are defined here for easy management and type safety
 */

const BASE_URL = environment.apiUrl;

export const API_ENDPOINTS = {
    // Authentication Endpoints
    AUTH: {
        LOGIN: `${BASE_URL}/api/auth/login`,
        SIGNUP: `${BASE_URL}/api/auth/signup`,
        CHECK_EMAIL: `${BASE_URL}/api/auth/check-access`,
        COMPLETE_LOGIN: `${BASE_URL}/api/auth/complete-login`,
        SIGNUP_CONFIG: `${BASE_URL}/api/auth/config/signup`,
        SWITCH_DOMAIN: `${BASE_URL}/api/auth/switch-domain`,
    },

    // User Management Endpoints - UIController
    USERS: {
        BASE: `${BASE_URL}/api/ui/users`,
        BY_ID: (id: number) => `${BASE_URL}/api/ui/users/${id}`,
    },

    // Role Management Endpoints - UIController
    ROLES: {
        BASE: `${BASE_URL}/api/ui/roles`,
        BY_ID: (id: number) => `${BASE_URL}/api/ui/roles/${id}`,
        ASSIGN: `${BASE_URL}/api/ui/roles/assign`,
    },

    // Component Management Endpoints - UIController
    COMPONENTS: {
        BASE: `${BASE_URL}/api/ui/components`,
        BY_ID: (id: number) => `${BASE_URL}/api/ui/components/${id}`,
        NAVIGATION: `${BASE_URL}/api/ui/components/navigation`,
        ASSIGN_USER: `${BASE_URL}/api/ui/components/assign/user`,
    },

    // Domain Management Endpoints - UIController
    DOMAINS: {
        BASE: `${BASE_URL}/api/ui/domains`,
        LIST: `${BASE_URL}/api/ui/domains`,
        CREATE: `${BASE_URL}/api/ui/domains`,
        BY_ID: (id: number) => `${BASE_URL}/api/ui/domains/${id}`,
        USERS: `${BASE_URL}/api/ui/domain/users`,
        SIGNUP_ENABLED: `${BASE_URL}/api/ui/domains/signup-enabled`,
    },

    // RAG (Agentic Chat) Endpoints - AgenticController
    RAG: {
        UPLOAD: `${BASE_URL}/api/ai/rag/upload`,
        CHAT: `${BASE_URL}/api/ai/rag/chat`,
        DOCUMENTS: `${BASE_URL}/api/ai/rag/documents`,
        DOCUMENT_BY_ID: (id: number) => `${BASE_URL}/api/ai/rag/documents/${id}`,
    },

    // Tool Chat Endpoints - AgenticController
    CHAT: {
        TOOL_CALLING: `${BASE_URL}/api/ai/chat/tool-calling`,
        HISTORY: `${BASE_URL}/api/ai/chat/history`,
    },

    // Guard rails Endpoints - GuardrailsController
    GUARDRAILS: {
        BASE: `${BASE_URL}/api/guardrails/config`,
        CONFIG: `${BASE_URL}/api/guardrails/config`,
        CONFIG_BY_ID: (id: number) => `${BASE_URL}/api/guardrails/config/${id}`,
        LOGS: `${BASE_URL}/api/guardrails/logs`,
    },

    // System Logs - UIController
    LOGS: {
        BASE: `${BASE_URL}/api/ui/logs`,
    },
} as const;

/**
 * Helper function to build query parameters
 */
export function buildQueryParams(params: Record<string, any>): string {
    const queryString = Object.entries(params)
        .filter(([_, value]) => value !== null && value !== undefined)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');
    return queryString ? `?${queryString}` : '';
}

/**
 * Type-safe API endpoint getter
 */
export type ApiEndpoint = typeof API_ENDPOINTS;

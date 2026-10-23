import { AgentDefinition, AgentContext, AgentExecutionResult, AgentRegistry, AgentType, AgentRole } from "./schema";
import { AGENT_DEFINITIONS, AGENT_TOOL_ALLOWLISTS, AGENT_FORBIDDEN_TOOLS } from "./definitions";
import { mcpRegistry } from "../mcp/registry";
import { executeMCPTool, authorizeMCPTool, createAuditEvent } from "../mcp/context";

class AgentRegistryImpl implements AgentRegistry {
  agents = new Map<string, AgentDefinition>();

  constructor() {
    this.registerBuiltInAgents();
  }

  private registerBuiltInAgents(): void {
    for (const [id, definition] of Object.entries(AGENT_DEFINITIONS)) {
      this.agents.set(id, definition as AgentDefinition);
    }
  }

  register(agent: AgentDefinition): void {
    if (this.agents.has(agent.id)) {
      throw new Error(`Agent already registered: ${agent.id}`);
    }
    this.agents.set(agent.id, agent);
  }

  getAgent(id: string): AgentDefinition | undefined {
    return this.agents.get(id);
  }

  getAgentsByType(type: string): AgentDefinition[] {
    return Array.from(this.agents.values()).filter((agent) => agent.type === type);
  }

  getAgentsByRole(role: string): AgentDefinition[] {
    return Array.from(this.agents.values()).filter((agent) => agent.role === role);
  }

  getAllAgents(): AgentDefinition[] {
    return Array.from(this.agents.values());
  }

  getAllowedTools(agentId: string): string[] {
    return AGENT_TOOL_ALLOWLISTS[agentId] ?? [];
  }

  getForbiddenTools(agentId: string): string[] {
    return AGENT_FORBIDDEN_TOOLS[agentId] ?? [];
  }

  isToolAllowed(agentId: string, toolName: string): boolean {
    const allowed = this.getAllowedTools(agentId);
    const forbidden = this.getForbiddenTools(agentId);
    return allowed.includes(toolName) && !forbidden.includes(toolName);
  }

  getAgentDefinition(agentId: string): AgentDefinition | undefined {
    return this.agents.get(agentId);
  }
}

export const agentRegistry = new AgentRegistryImpl();

export async function executeAgentTool<Input, Output>(
  agentId: string,
  toolName: string,
  input: any,
  context: {
    tenantId: string;
    agentId: string;
    actorId?: string;
    actorType: "user" | "agent" | "system";
    requestId: string;
    timestamp: string;
    permissions: string[];
    dataAccess: string[];
  }
): Promise<{
  success: boolean;
  data?: any;
  error?: { code: string; message: string; safe: boolean };
  auditEvent?: any;
}> {
  const { agentRegistry: registryInstance } = await import("./index");
  const { authorizeMCPTool: authTool, executeMCPTool: execTool, createAuditEvent: auditFn } = await import("../mcp/context");

  if (!registryInstance.isToolAllowed(agentId, toolName)) {
    return {
      success: false,
      error: { code: "TOOL_NOT_ALLOWED", message: `Tool ${toolName} not allowed for agent ${agentId}`, safe: true },
    };
  }

  const mcpContext = {
    tenantId: context.tenantId,
    actorId: context.actorId || context.agentId,
    actorType: context.actorType,
    roles: context.permissions,
    requestId: context.requestId,
    timestamp: context.timestamp,
  };

  const auth = await authTool(toolName, mcpContext);
  if (!auth.authorized) {
    return { success: false, error: { code: "UNAUTHORIZED", message: auth.reason!, safe: true } };
  }

  const result = await execTool(toolName, input, {
    tenantId: context.tenantId,
    actorId: context.actorId || context.agentId,
    actorType: context.actorType,
    roles: context.permissions,
    requestId: context.requestId,
    timestamp: context.timestamp,
  });

  const auditEvent = {
    timestamp: new Date().toISOString(),
    agentId: context.agentId,
    tenantId: context.tenantId,
    toolName,
    operationType: "agent-tool-execution",
    success: result.success,
    errorCode: result.error?.code,
  };

  return { ...result, auditEvent };
}

export function createAgentContext(
  agentId: string,
  tenantId: string,
  overrides: Partial<{
    actorId: string;
    actorType: "user" | "agent" | "system";
    requestId: string;
    timestamp: string;
    permissions: string[];
    dataAccess: string[];
  }> = {}
): {
  agentId: string;
  tenantId: string;
  actorId: string;
  actorType: "user" | "agent" | "system";
  requestId: string;
  timestamp: string;
  permissions: string[];
  dataAccess: string[];
} {
  const agentDef = AGENT_DEFINITIONS[agentId];
  return {
    agentId,
    tenantId,
    actorId: overrides.actorId || `agent-${agentId}`,
    actorType: overrides.actorType || "agent",
    requestId: overrides.requestId || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: overrides.timestamp || new Date().toISOString(),
    permissions: overrides.permissions || agentDef?.allowedTools || [],
    dataAccess: overrides.dataAccess || agentDef?.dataAccessBoundary || [],
  };
}

export function validateAgentContext(context: {
  agentId: string;
  tenantId: string;
  actorId?: string;
  actorType: "user" | "agent" | "system";
  requestId: string;
  timestamp: string;
  permissions: string[];
  dataAccess: string[];
}): { valid: boolean; error?: string } {
  if (!context.agentId) return { valid: false, error: "Missing agent ID" };
  if (!context.tenantId) return { valid: false, error: "Missing tenant ID" };
  if (!context.requestId) return { valid: false, error: "Missing request ID" };
  if (!context.timestamp) return { valid: false, error: "Missing timestamp" };
  if (!context.actorType) return { valid: false, error: "Missing actor type" };
  return { valid: true };
}

export function sanitizeAgentInput(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .trim();
}

export function detectPromptInjection(input: string): { detected: boolean; patterns: string[] } {
  const injectionPatterns = [
    /ignore\s+previous\s+instructions/i,
    /forget\s+your\s+instructions/i,
    /system\s+prompt/i,
    /you\s+are\s+now/i,
    /pretend\s+to\s+be/i,
    /act\s+as\s+if/i,
    /ignore\s+all\s+rules/i,
    /bypass\s+security/i,
    /override\s+policy/i,
    /disregard\s+instructions/i,
    /new\s+instructions:/i,
    /updated\s+instructions:/i,
    /system\s+message:/i,
    /developer\s+mode/i,
    /admin\s+mode/i,
  ];

  const detected = injectionPatterns
    .filter((pattern) => pattern.test(input))
    .map((pattern) => pattern.source);

  return { detected: detected.length > 0, patterns: detected };
}

export function sanitizeAgentOutput(output: string): string {
  return output
    .replace(/sk-\w+/gi, "[REDACTED_API_KEY]")
    .replace(/password[\s:=]+[^\s]+/gi, "password=[REDACTED]")
    .replace(/token[\s:=]+[^\s]+/gi, "token=[REDACTED]")
    .replace(/secret[\s:=]+[^\s]+/gi, "secret=[REDACTED]")
    .replace(/api[_-]?key[\s:=]+[^\s]+/gi, "api_key=[REDACTED]");
}

import { MCPRequestContext, MCPToolDefinition, OperationType, ApprovalRequirement } from "./schema";
import { mcpRegistry } from "./registry";

export interface MCPAuthorizationResult {
  authorized: boolean;
  reason?: string;
  requiresApproval?: boolean;
  approvalType?: "human" | "policy-check";
}

export interface MCPExecutionResult<T> {
  success: boolean;
  data?: unknown;
  error?: {
    code: string;
    message: string;
    safe: boolean;
  };
  auditEvent?: {
    timestamp: string;
    tenantId: string;
    actorId?: string;
    actorType: "user" | "agent" | "system";
    toolName: string;
    operationType: string;
    resourceId?: string;
    approvalState: "not-required" | "pending" | "approved" | "denied";
    success: boolean;
    errorCode?: string;
    errorMessage?: string;
  };
}

export function validateMCPContext(context: MCPRequestContext): { valid: boolean; error?: string } {
  if (!context.tenantId) {
    return { valid: false, error: "Missing tenant context" };
  }
  if (!context.requestId) {
    return { valid: false, error: "Missing request ID" };
  }
  if (!context.timestamp) {
    return { valid: false, error: "Missing timestamp" };
  }
  if (!context.actorType) {
    return { valid: false, error: "Missing actor type" };
  }
  if (!context.roles || context.roles.length === 0) {
    return { valid: false, error: "Missing roles" };
  }
  return { valid: true };
}

export function authorizeMCPTool(
  toolName: string,
  context: MCPRequestContext
): MCPAuthorizationResult {
  const toolDef = mcpRegistry.getToolDefinition(toolName);
  if (!toolDef) {
    return { authorized: false, reason: `Tool not found: ${toolName}` };
  }

  if (toolDef.tenantScope && !context.tenantId) {
    return { authorized: false, reason: "Tool requires tenant context" };
  }

  const hasRole = context.roles.some((role) => toolDef.requiredRole.includes(role));
  if (!hasRole) {
    return { 
      authorized: false, 
      reason: `Insufficient permissions. Required roles: ${toolDef.requiredRole.join(", ")}` 
    };
  }

  const requiresApproval = toolDef.approvalRequirement !== "none";
  
  return { 
    authorized: true, 
    requiresApproval,
    approvalType: requiresApproval ? toolDef.approvalRequirement as "human" | "policy-check" : undefined,
  };
}

export async function executeMCPTool<Input, Output>(
  toolName: string,
  input: Input,
  context: MCPRequestContext
): Promise<{ success: boolean; data?: Output; error?: { code: string; message: string; safe: boolean } }> {
  const validation = validateMCPContext(context);
  if (!validation.valid) {
    return { success: false, error: { code: "INVALID_CONTEXT", message: validation.error!, safe: true } };
  }

  const auth = authorizeMCPTool(toolName, context);
  if (!auth.authorized) {
    return { success: false, error: { code: "UNAUTHORIZED", message: auth.reason!, safe: true } };
  }

  const handler = mcpRegistry.getTool(toolName);
  if (!handler) {
    return { success: false, error: { code: "TOOL_NOT_FOUND", message: `Tool not found: ${toolName}`, safe: true } };
  }

  try {
    const result = await handler.execute(input, context);
    return { success: true, data: result };
  } catch (error) {
    return { 
      success: false, 
      error: { 
        code: "EXECUTION_ERROR", 
        message: error instanceof Error ? error.message : "Unknown execution error", 
        safe: true 
      } 
    };
  }
}

export function createAuditEvent(
  context: MCPRequestContext,
  toolName: string,
  operationType: string,
  resourceId: string | undefined,
  approvalState: "not-required" | "pending" | "approved" | "denied",
  success: boolean,
  errorCode?: string,
  errorMessage?: string
): {
  timestamp: string;
  tenantId: string;
  actorId?: string;
  actorType: "user" | "agent" | "system";
  toolName: string;
  operationType: string;
  resourceId?: string;
  approvalState: "not-required" | "pending" | "approved" | "denied";
  success: boolean;
  errorCode?: string;
  errorMessage?: string;
} {
  return {
    timestamp: new Date().toISOString(),
    tenantId: context.tenantId,
    actorId: context.actorId,
    actorType: context.actorType,
    toolName,
    operationType,
    resourceId,
    approvalState,
    success,
    errorCode,
    errorMessage,
  };
}

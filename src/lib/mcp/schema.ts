export type OperationType = "read" | "write" | "sensitive-write" | "destructive";
export type ApprovalRequirement = "none" | "human" | "policy-check";
export type AuditRequirement = "none" | "basic" | "full";

export interface MCPToolInput {
  [key: string]: unknown;
}

export interface MCPToolOutput {
  success: boolean;
  data?: unknown;
  error?: {
    code: string;
    message: string;
    safe: boolean;
  };
}

export interface MCPToolDefinition {
  name: string;
  purpose: string;
  inputSchema: Record<string, unknown> | object;
  tenantScope: boolean;
  requiredRole: string[];
  operationType: OperationType;
  approvalRequirement: ApprovalRequirement;
  auditRequirement: AuditRequirement;
  providerImplemented: boolean;
}

export interface MCPRequestContext {
  tenantId: string;
  actorId?: string;
  actorType: "user" | "agent" | "system";
  roles: string[];
  requestId: string;
  timestamp: string;
}

export interface MCPAuditEvent {
  timestamp: string;
  tenantId: string;
  actorId?: string;
  actorType: "user" | "agent" | "system";
  toolName: string;
  operationType: OperationType;
  resourceId?: string;
  approvalState: "not-required" | "pending" | "approved" | "denied";
  success: boolean;
  errorCode?: string;
  errorMessage?: string;
}

export interface MCPToolHandler<Input extends MCPToolInput, Output extends MCPToolOutput> {
  definition: MCPToolDefinition;
  execute(input: Input, context: MCPRequestContext): Promise<Output>;
}

export interface MCPRegistry {
  tools: Map<string, MCPToolHandler<any, any>>;
  register<Input extends MCPToolInput, Output extends MCPToolOutput>(
    handler: MCPToolHandler<Input, Output>
  ): void;
  getTool(name: string): MCPToolHandler<any, any> | undefined;
  getToolsByOperationType(type: OperationType): MCPToolHandler<any, any>[];
  getToolsByTenantScope(tenantScope: boolean): MCPToolHandler<any, any>[];
}
export type AgentType = 
  | "travel-research"
  | "itinerary"
  | "customer-concierge"
  | "booking"
  | "agency-operations"
  | "orchestrator";

export type AgentRole = 
  | "travel-research"
  | "itinerary-design"
  | "customer-support"
  | "booking-management"
  | "agency-operations"
  | "supervisor";

export interface AgentToolPermission {
  toolName: string;
  allowed: boolean;
  conditions?: string[];
}

export interface AgentDefinition {
  id: string;
  type: AgentType;
  role: AgentRole;
  purpose: string;
  allowedTools: string[];
  forbiddenTools: string[];
  tenantScope: boolean;
  dataAccessBoundary: string[];
  maxAuthority: "read" | "write" | "sensitive-write" | "destructive";
  approvalRequirements: {
    requiresHumanApproval: boolean;
    approvalTypes: string[];
  };
  failureBehavior: "retry" | "escalate" | "fail-safe";
  auditBehavior: "basic" | "full";
  promptInjectionDefenses: string[];
}

export interface AgentContext {
  agentId: string;
  tenantId: string;
  actorId?: string;
  actorType: "user" | "agent" | "system";
  requestId: string;
  timestamp: string;
  permissions: string[];
  dataAccess: string[];
}

export interface AgentExecutionResult<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    safe: boolean;
  };
  auditEvent?: {
    timestamp: string;
    agentId: string;
    tenantId: string;
    toolName: string;
    operationType: string;
    success: boolean;
    errorCode?: string;
  };
}

export interface AgentRegistry {
  agents: Map<string, AgentDefinition>;
  register(agent: AgentDefinition): void;
  getAgent(id: string): AgentDefinition | undefined;
  getAgentsByType(type: string): AgentDefinition[];
  getAgentsByRole(role: string): AgentDefinition[];
}
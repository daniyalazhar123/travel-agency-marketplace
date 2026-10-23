import { MCPToolHandler, MCPRequestContext, MCPToolDefinition, MCPRegistry } from "./schema";
import { MCP_TOOL_DEFINITIONS } from "./tools";

class MCPRegistryImpl implements MCPRegistry {
  tools = new Map<string, MCPToolHandler<any, any>>();

  constructor() {
    this.registerBuiltInTools();
  }

  private registerBuiltInTools(): void {
    for (const [name, definition] of Object.entries(MCP_TOOL_DEFINITIONS)) {
      const handler: MCPToolHandler<any, any> = {
        definition,
        execute: async (input: any, context: MCPRequestContext) => {
          throw new Error(`Provider not implemented for tool: ${name}`);
        },
      };
      this.tools.set(name, handler);
    }
  }

  register(handler: MCPToolHandler<any, any>): void {
    if (this.tools.has(handler.definition.name)) {
      throw new Error(`Tool already registered: ${handler.definition.name}`);
    }
    this.tools.set(handler.definition.name, handler);
  }

  getTool(name: string): MCPToolHandler<any, any> | undefined {
    return this.tools.get(name);
  }

  getToolsByOperationType(type: string): MCPToolHandler<any, any>[] {
    return Array.from(this.tools.values()).filter(
      (tool) => tool.definition.operationType === type
    );
  }

  getToolsByTenantScope(tenantScope: boolean): MCPToolHandler<any, any>[] {
    return Array.from(this.tools.values()).filter(
      (tool) => tool.definition.tenantScope === tenantScope
    );
  }

  getAllTools(): MCPToolHandler<any, any>[] {
    return Array.from(this.tools.values());
  }

  getToolDefinition(name: string): MCPToolDefinition | undefined {
    return this.tools.get(name)?.definition;
  }

  getAllDefinitions(): MCPToolDefinition[] {
    return Array.from(this.tools.values()).map((t) => t.definition);
  }
}

export const mcpRegistry = new MCPRegistryImpl();

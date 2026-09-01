# AI Agent Architecture

## Overview

The agent system provides specialized AI assistants for different aspects of the travel marketplace. Agents are designed with strict security boundaries, explicit tool allowlists, and comprehensive audit logging.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Supervisor Agent (Orchestrator)               │
│  - Intent Classification                                        │
│  - Agent Routing                                                │
│  - Security Policy Enforcement                                  │
│  - Cross-Agent Coordination                                     │
└──────────────────────────┬──────────────────────────────────────┘
                           │
         ┌─────────────────┼──────────────────────────────────────┐
         │                 │                                      │
         ▼                 ▼                                      ▼
┌──────────────────┐ ┌──────────────┐ ┌──────────────────────────┐
│  Travel Research │ │   Itinerary  │ │  Customer Concierge      │
│  Agent           │ │   Agent      │ │  Agent                   │
│                  │ │              │ │                          │
│ - Destination    │ │ - Itinerary  │ │ - Customer Support       │
│   Discovery      │ │   Design     │ │ - Booking Assistance     │
│ - Search         │ │ - Scheduling │ │ - FAQ & Policy Lookup    │
│ - Comparison     │ │ - Budgeting  │ │ - Booking Status         │
└──────────────────┘ └──────────────┘ └──────────────────────────┘
                           │
                           ▼
                 ┌──────────────────┐
                 │   Booking Agent  │
                 │                  │
                 │ - Booking Create │
                 │ - Booking Cancel │
                 │ - Payment Coord  │
                 └──────────────────┘
```

## Agent Definitions

### 1. Travel Research Agent

**Purpose**: Assist with destination discovery, travel research, and information gathering

| Property | Value |
|----------|-------|
| ID | `travel-research` |
| Type | `travel-research` |
| Role | `travel-research` |
| Max Authority | `read` |
| Tenant Scoped | Yes |

**Allowed Tools**:
- `travel.search`
- `hotel.search`
- `flight.search`
- `experience.search`

**Forbidden Tools**:
- `booking.create`, `booking.cancel`, `booking.get`
- `customer.get`, `customer.message`
- `itinerary.create`, `itinerary.get`

**Data Access Boundary**:
- Public destinations, experiences, hotels, flights
- Travel guides, destination content
- No tenant-private data

**Security**:
- Max authority: read-only
- No human approval required
- Basic audit logging
- Prompt injection defenses active

### 2. Itinerary Agent

**Purpose**: Design and create travel itineraries based on traveler preferences

| Property | Value |
|----------|-------|
| ID | `itinerary` |
| Type | `itinerary` |
| Role | `itinerary-design` |
| Max Authority | `write` |
| Tenant Scoped | Yes |

**Allowed Tools**:
- `travel.search`, `hotel.search`, `flight.search`, `experience.search`
- `itinerary.create`, `itinerary.get`

**Forbidden Tools**:
- `booking.create`, `booking.cancel`, `booking.get`
- `customer.get`, `customer.message`

**Data Access Boundary**:
- Tenant destinations, experiences, hotels, flights
- Itinerary templates, traveler preferences

**Security**:
- Max authority: write (itinerary creation)
- Policy-check approval required
- Full audit logging
- Prompt injection defenses active

### 3. Customer Concierge Agent

**Purpose**: Provide customer support, answer questions, and assist with travel inquiries

| Property | Value |
|----------|-------|
| ID | `customer-concierge` |
| Type | `customer-concierge` |
| Role | `customer-support` |
| Max Authority | `sensitive-write` |
| Tenant Scoped | Yes |

**Allowed Tools**:
- Search tools: `travel.search`, `hotel.search`, `flight.search`, `experience.search`
- Lookup tools: `customer.get`, `booking.get`, `itinerary.get`
- Communication: `customer.message`

**Forbidden Tools**:
- `booking.create`, `booking.cancel`, `itinerary.create`

**Data Access Boundary**:
- Tenant customers, bookings, itineraries
- Destinations, experiences
- FAQ knowledge base, policy documents

**Security**:
- Max authority: sensitive-write (customer messaging)
- Human + policy-check approval required
- Full audit logging
- Strong prompt injection defenses

### 4. Booking Agent

**Purpose**: Manage booking workflows, create bookings, handle cancellations

| Property | Value |
|----------|-------|
| ID | `booking` |
| Type | `booking` |
| Role | `booking-management` |
| Max Authority | `destructive` |
| Tenant Scoped | Yes |

**Allowed Tools**:
- `booking.get`, `booking.create`, `booking.cancel`
- `customer.get`, `itinerary.get`, `customer.message`

**Forbidden Tools**:
- Search tools (`travel.search`, `hotel.search`, etc.)
- `itinerary.create`

**Data Access Boundary**:
- Tenant bookings, customers, itineraries
- Payment records, booking policies

**Security**:
- Max authority: destructive (booking cancellation)
- Human approval + policy-check required
- Full audit logging
- Strongest prompt injection defenses
- Never fabricates booking confirmations

### 5. Agency Operations Agent

**Purpose**: Assist with agency operations, reporting, and administrative tasks

| Property | Value |
|----------|-------|
| ID | `agency-operations` |
| Type | `agency-operations` |
| Role | `agency-operations` |
| Max Authority | `read` |
| Tenant Scoped | Yes |

**Allowed Tools**:
- Lookup tools: `customer.get`, `booking.get`, `itinerary.get`
- Search tools: `travel.search`, `hotel.search`, `experience.search`

**Forbidden Tools**:
- `booking.create`, `booking.cancel`, `customer.message`, `itinerary.create`

**Security**:
- Max authority: read-only
- No approval required
- Basic audit logging

### 6. Supervisor Agent (Orchestrator)

**Purpose**: Route requests to appropriate specialized agents and enforce security boundaries

| Property | Value |
|----------|-------|
| ID | `orchestrator` |
| Type | `orchestrator` |
| Role | `supervisor` |
| Max Authority | `read` |
| Tenant Scoped | Yes |

**Allowed Tools**: None (routes to sub-agents only)

**Forbidden Tools**: All operational tools

**Data Access Boundary**:
- Agent routing rules, security policies
- Approval policies, tenant configuration

**Security**:
- Max authority: read-only (policy data)
- Human + policy-check approval
- Full audit logging
- Never executes tools directly

## Tool Allowlists & Forbidden Tools

| Agent | Allowed Tools | Forbidden Tools |
|-------|--------------|-----------------|
| Travel Research | search tools | booking, customer, itinerary tools |
| Itinerary | search + itinerary tools | booking, customer tools |
| Customer Concierge | search + lookup + messaging | booking create/cancel, itinerary create |
| Booking | booking + lookup + messaging | search, itinerary create |
| Agency Operations | lookup + search | booking, messaging, itinerary create |
| Orchestrator | none | all operational tools |

## Security Model

### Agent Security Boundaries

Each agent has:
- **Explicit tool allowlist** - Only listed tools can be invoked
- **Explicit forbidden list** - Defense in depth
- **Tenant scope enforcement** - All operations tenant-scoped
- **Max authority level** - Caps operation types
- **Explicit approval requirements** - Human/policy-check as needed

### Prompt Injection Defenses

All agents implement:
1. **Input sanitization** - Strip scripts, event handlers, javascript: URLs
2. **Prompt injection detection** - Pattern matching for common injection attempts
3. **Output sanitization** - Redact secrets, tokens, PII from outputs
4. **External content isolation** - Provider responses treated as DATA only
5. **Tool argument validation** - Strict schema validation before execution
6. **System instruction isolation** - External content never modifies system prompts

### Booking Safety

Booking operations follow strict safety protocol:

| Operation | Authorization |
|-----------|---------------|
| Search | Automatic |
| Recommend | Automatic |
| Itinerary Draft | Automatic |
| Booking Preview | Automatic |
| **Booking Creation** | **Authorization + Policy Check** |
| Payment | **Real provider required** |
| **Booking Cancellation** | **Explicit Authorization + Approval** |

### Agent Tool Execution Flow

```
1. Agent requests tool execution
       │
       ▼
2. Validate agent context
   - Agent ID, tenant ID, request ID
       │
       ▼
3. Check tool allowlist
   - Tool in allowed list?
   - Tool NOT in forbidden list?
       │
       ▼
4. Authorize via MCP
   - Validate MCP context
   - Check tool permissions
   - Check approval requirements
       │
       ▼
6. Execute via MCP
   - Validate input schema
   - Execute provider (stub)
   - Return safe result/error
       │
       ▼
6. Audit Event
   - Agent ID, tenant, tool, operation
   - Success/failure, safe error
```

## Prompt Injection Defenses

### Defense Layers

1. **Input Validation** - All agent inputs validated against schema
2. **Content Sanitization** - Strip scripts, event handlers, javascript: URLs
3. **Injection Detection** - Pattern matching for common injection attempts
4. **External Content Isolation** - Provider responses = DATA only
5. **Tool Argument Validation** - Strict schema validation
6. **System Instruction Protection** - External content never modifies system prompts

### Detected Injection Patterns

- "ignore previous instructions"
- "forget your instructions"
- "system prompt"
- "you are now"
- "pretend to be"
- "act as if"
- "ignore all rules"
- "bypass security"
- "override policy"
- "disregard instructions"
- "new instructions:"
- "updated instructions:"
- "system message:"
- "developer mode"
- "admin mode"

### Response to Detection

1. Log injection attempt with context
2. Sanitize input (remove detected patterns)
3. Continue with sanitized input
4. Audit event for security review

## Trust Boundaries

```
┌────────────────────────────────────────────────────────────┐
│                    TRUSTED ZONE                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Orchestrator│  │   Agents    │  │   MCP Gateway       │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└────────────────────────────┬────────────────────────────────┘
                             │
           ┌─────────────────┼─────────────────┐
           ▼                 ▼                 ▼
    ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
    │   Search    │   │   Lookup    │   │   Write     │
    │   Tools     │   │   Tools     │   │   Tools     │
    └─────────────┘   └─────────────┘   └─────────────┘
                             │
                             ▼
              ┌─────────────────────────┐
              │      DATA LAYER         │
              │  (Tenant-Isolated)      │
              └─────────────────────────┘
```

### Data Flow Rules

1. **External → Agent**: Sanitized, validated, never trusted
2. **Agent → MCP**: Validated against schema, authorized
3. **MCP → Data**: Tenant-scoped, read-only by default
4. **Data → Agent**: Sanitized, no secrets, no PII in logs
5. **Agent → User**: Sanitized, no secrets, helpful errors

## Known Limitations

1. **No Real Authentication** - Context must be provided externally
2. **No Real Provider Integrations** - All tools return "not implemented"
3. **No Real-time Streaming** - Request/response only
4. **No Multi-agent Collaboration** - Sequential execution only
5. **No Long-term Memory** - Context per request only
6. **No Distributed Tracing** - Request IDs only

## Future Enhancements

1. Add real provider integrations
2. Implement OAuth/OIDC for agent authentication
3. Add distributed tracing (OpenTelemetry)
4. Implement agent memory/persistence
6. Add inter-agent communication protocol
7. Implement real-time streaming for long operations
7. Add circuit breakers for external calls
8. Implement agent performance metrics
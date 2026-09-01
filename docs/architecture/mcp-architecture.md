# MCP Architecture

## Overview

The Model Context Protocol (MCP) layer provides a secure, auditable interface for AI agents to interact with the travel marketplace's data and operations. It enforces strict authorization, tenant isolation, and audit logging.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      AI Agent Layer                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Travel Agent │  │ Itinerary    │  │ Customer Concierge   │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬────────────┘  │
└─────────┼──────────────────┼─────────────────────┼──────────────┘
          │                  │                     │
          ▼                  ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MCP Tool Gateway                              │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Authorization Engine                                       │ │
│  │  - Tenant Context Validation                               │ │
│  │  - Role-Based Access Control                               │ │
│  │  - Operation Type Classification                           │ │
│  │  - Approval Requirement Enforcement                        │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Tool Registry                                              │ │
│  │  - Tool Definitions (Schema, Permissions, Audit)          │ │
│  │  - Provider Adapters (Not Implemented - Interface Only)   │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
          │                  │                     │
          ▼                  ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Data Layer (Tenant-Scoped)                   │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌─────────────┐  │
│  │ Destinations│ │ Experiences │ │ Bookings   │ │ Customers   │  │
│  └────────────┘ └────────────┘ └────────────┘ └─────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Tool Registry

### Tool Categories

| Category | Tools | Operation Type | Approval |
|----------|-------|----------------|----------|
| **Search** | `travel.search`, `hotel.search`, `flight.search`, `experience.search` | read | none |
| **Lookup** | `customer.get`, `booking.get`, `itinerary.get` | read | none |
| **Write** | `itinerary.create` | write | policy-check |
| **Sensitive Write** | `booking.create`, `customer.message` | sensitive-write | human / policy-check |
| **Destructive** | `booking.cancel` | destructive | human |

### Tool Definition Schema

Each tool defines:
- **Input Schema**: Zod schema for validation
- **Tenant Scope**: Whether tool requires tenant context
- **Required Roles**: Minimum roles required
- **Operation Type**: read | write | sensitive-write | destructive
- **Approval Requirement**: none | human | policy-check
- **Audit Requirement**: basic | full
- **Provider Implemented**: Boolean flag (all currently false)

## Permission Model

### Role Hierarchy

| Role | Search | Lookup | Write | Sensitive Write | Destructive |
|------|--------|--------|-------|-----------------|-------------|
| travel-agent | ✓ | ✓ | ✓ | ✓ | ✗ |
| booking-agent | ✓ | ✓ | ✓ | ✓ | ✓ |
| customer-support | ✓ | ✓ | ✗ | ✓ | ✗ |
| content-manager | ✓ | ✓ | ✓ | ✗ | ✗ |
| itinerary-designer | ✓ | ✓ | ✓ | ✗ | ✗ |
| agency-admin | ✓ | ✓ | ✓ | ✓ | ✓ |

### Tenant Isolation

- All MCP operations require valid tenant context
- Tenant ID derived from authenticated context (never user-controlled)
- Cross-tenant access explicitly rejected
- Tool execution validates tenant ownership of resources

## Authorization Flow

```
1. Agent requests tool execution
       │
       ▼
2. Validate MCP Context
   - Tenant ID present
   - Request ID present
   - Actor type valid
   - Roles present
       │
       ▼
3. Authorize Tool
   - Tool exists in registry
   - Tenant scope validated
   - Role matches required roles
   - Approval requirement checked
       │
       ▼
4. Execute Tool
   - Validate input against schema
   - Execute provider adapter (stub)
   - Return result or safe error
       │
       ▼
5. Audit Event
   - Timestamp, tenant, actor, tool
   - Operation type, resource ID
   - Approval state, success/failure
   - Safe error classification
```

## Security Boundaries

### Prohibited Operations
- ❌ Arbitrary SQL execution
- ❌ Shell command execution
- ❌ Arbitrary HTTP requests
- ❌ Filesystem access
- ❌ Environment variable access
- ❌ Secret retrieval
- ❌ Database credential exposure

### Data Protection
- All external content treated as DATA, never instructions
- Input validation on all tool arguments
- Output sanitization (redact secrets, tokens, PII)
- External content never becomes agent instructions

## Audit Model

### Required Fields
- `timestamp`: ISO 8601 timestamp
- `tenantId`: Tenant identifier
- `actorId`: Actor identifier (if available)
- `actorType`: "user" | "agent" | "system"
- `toolName`: Name of executed tool
- `operationType`: read | write | sensitive-write | destructive
- `resourceId`: Affected resource (if applicable)
- `approvalState`: not-required | pending | approved | denied
- `success`: boolean
- `errorCode`: Safe error code (if failed)
- `errorMessage`: Safe error message (if failed)

### Never Logged
- Passwords
- API keys
- Access tokens
- Payment card data
- Secrets
- Raw credentials

## Provider Adapters (Interface Only)

All provider integrations are **NOT IMPLEMENTED**. The architecture defines interfaces only:

```typescript
interface TravelProvider {
  searchDestinations(input: SearchInput): Promise<Destination[]>;
  getDestination(id: string): Promise<Destination | null>;
}

interface HotelProvider {
  searchHotels(input: HotelSearchInput): Promise<Hotel[]>;
  getHotel(id: string): Promise<Hotel | null>;
}

interface FlightProvider {
  searchFlights(input: FlightSearchInput): Promise<Flight[]>;
}

interface BookingProvider {
  createBooking(input: BookingCreateInput): Promise<Booking>;
  getBooking(id: string): Promise<Booking | null>;
  cancelBooking(id: string, reason: string): Promise<CancellationResult>;
}

interface CustomerProvider {
  getCustomer(id: string): Promise<Customer | null>;
  sendMessage(input: CustomerMessageInput): Promise<MessageResult>;
}
```

## Known Limitations

1. **No Real Provider Integrations** - All provider adapters return "not implemented" errors
2. **No Authentication System** - Tenant context must be provided by external auth system
3. **No Real Payment Processing** - Payment flows are not implemented
4. **No Real-time Notifications** - Event streaming not implemented
4. **No Rate Limiting** - Should be implemented at gateway level
5. **No Distributed Tracing** - Request IDs only, no OpenTelemetry integration

## Future Enhancements

1. Implement provider adapters for real travel services
2. Add OAuth/OIDC authentication integration
3. Implement rate limiting and quotas
6. Add distributed tracing (OpenTelemetry)
7. Add circuit breakers for external calls
8. Implement webhook callbacks for async operations
9. Add caching layer for search results
10. Implement tenant provisioning API
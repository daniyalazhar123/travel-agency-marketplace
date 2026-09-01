# Security Boundaries

## Overview

This document defines the security boundaries and threat model for the Travel Agency Marketplace. It covers the trust boundaries, data flow rules, and security controls implemented across the system.

## Trust Boundaries

### Zone Classification

| Zone | Trust Level | Components | Access |
|------|-------------|------------|--------|
| **Trusted Internal** | High | Orchestrator, Agents, MCP Gateway, Registry | Full internal access |
| **Tenant Data** | Medium | Tenant-isolated databases, configs | Tenant-scoped only |
| **External APIs** | Low | Unsplash, future providers | Restricted, validated |
| **Public Web** | None | Browser clients, CDN | Public assets only |

### Boundary Enforcement

```
┌─────────────────────────────────────────────────────────────────┐
│                        TRUSTED ZONE                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ Orchestrator│  │   Agents    │  │      MCP Gateway        │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
┌───────────────┐    ┌───────────────┐   ┌───────────────┐
│  Search       │   │   Lookup      │   │   Write       │
│  Tools        │   │   Tools       │   │   Tools       │
└───────────────┘   └───────────────┘   └───────────────┘
         │                   │                   │
         └───────────────────┼───────────────────┘
                             │
                    ┌────────┴────────┐
                    │  TENANT DATA    │
                    │  (Isolated)     │
                    └─────────────────┘
```

## Data Flow Rules

### Rule 1: External → Internal
- All external input (user, webhooks, providers) **sanitized and validated**
- Never trusted as instructions
- Treated as **DATA only**

### Rule 2: Internal → MCP
- All tool calls **validated against schema**
- **Authorized** via MCP authorization engine
- Tenant context **required and validated**

### Rule 3: MCP → Data Layer
- **Tenant-scoped queries only**
- Read-only by default
- Write operations require explicit authorization

### Rule 4: Data → Agent
- **Sanitized output** (no secrets, tokens, PII in logs)
- Errors **sanitized** (no stack traces, internal paths)
- PII **masked** in logs

### Rule 5: Agent → User
- Helpful error messages (no stack traces)
- **No secrets** in responses
- Rate limiting on user-facing endpoints

## Security Controls by Layer

### Application Layer (Next.js)

| Control | Implementation |
|---------|----------------|
| CSP Headers | Via `next.config.ts` headers() |
| X-Frame-Options | DENY |
| X-Content-Type-Options | nosniff |
| Referrer-Policy | strict-origin-when-cross-origin |
| Permissions-Policy | Restricted |
| HSTS | Via Vercel/hosting |

### Middleware Layer

```typescript
// Tenant resolution middleware (planned)
export function middleware(request: NextRequest) {
  // Extract tenant from subdomain/path
  // Validate tenant exists
  // Attach tenant context to request
  // Reject invalid tenants
}
```

### MCP Layer

| Control | Implementation |
|---------|----------------|
| Context Validation | Required tenantId, requestId, roles |
| Tool Authorization | Role-based, operation-type aware |
| Tenant Isolation | Context-derived, never user-controlled |
| Approval Gates | Human/policy-check per operation type |
| Audit Logging | Structured, no secrets |

### Agent Layer

| Control | Implementation |
|---------|----------------|
| Tool Allowlists | Explicit per-agent allowlists |
| Forbidden Tools | Explicit deny lists (defense in depth) |
| Max Authority | Per-agent caps (read/write/sensitive/destructive) |
| Prompt Injection | Input sanitization, pattern detection, output redaction |

## Threat Model

### STRIDE Analysis

| Threat | Mitigation |
|--------|------------|
| **Spoofing** | Tenant context from auth, not user input; MCP context validation |
| **Tampering** | Input validation, schema enforcement, output sanitization |
| **Repudiation** | Structured audit logging with timestamps, actors |
| **Information Disclosure** | Output sanitization, no secrets in logs, PII masking |
| **Denial of Service** | Rate limiting (planned), circuit breakers (planned) |
| **Elevation of Privilege** | Role-based access, max authority caps, tool allowlists |

### Attack Vectors & Mitigations

| Vector | Risk | Mitigation |
|--------|------|------------|
| Prompt Injection | High | Input sanitization, pattern detection, external content isolation |
| Cross-Tenant Access | High | Tenant context from auth, not user input; explicit validation |
| XSS | Medium | React auto-escaping, CSP headers, output sanitization |
| CSRF | Low | SameSite cookies, SameSite=Lax default |
| SQL Injection | Low | No direct SQL, tenant-scoped ORM queries |
| Secret Exposure | High | Never logged, env vars only, .env.example only |
| Path Traversal | Low | No filesystem access in agents/MCP |

## Tenant Isolation

### Implementation

```typescript
// Tenant context NEVER from user input
interface MCPRequestContext {
  tenantId: string;        // From authenticated session
  actorId: string;         // From auth
  actorType: "user" | "agent" | "system";
  roles: string[];         // From auth
  requestId: string;       // Generated
  timestamp: string;       // Generated
}

// Validation
function validateMCPContext(context): { valid: boolean; error?: string } {
  if (!context.tenantId) return { valid: false, error: "Missing tenant context" };
  // ... additional validation
}
```

### Cross-Tenant Prevention

1. **Tenant ID never from user input** - Always from authenticated session
2. **Explicit tenant validation** on every MCP tool call
3. **Resource ownership validation** - Verify resource belongs to tenant
4. **Explicit cross-tenant rejection** - Clear error messages

## Secret Management

### Principles

1. **Never in source control** - `.env` in `.gitignore`
2. **Environment variables only** - `process.env` access only
3. **`.env.example` only** - Documents required variables
4. **No hardcoded secrets** - Ever
5. **Rotation documented** - In deployment docs

### .env.example Template

```bash
# Database
DATABASE_URL="postgresql://..."

# Authentication
NEXTAUTH_SECRET="generate-with-openssl"
NEXTAUTH_URL="https://your-domain.com"

# External Providers (when implemented)
# UNSLPASH_ACCESS_KEY=""
# AMADEUS_API_KEY=""
# BOOKING_COM_API_KEY=""

# MCP (future)
# MCP_SERVER_URL=""
# MCP_API_KEY=""

# Monitoring (optional)
# SENTRY_DSN=""
```

### Runtime Secret Access

```typescript
// Server-only access
const secret = process.env.SECRET_NAME;
// Client components NEVER access secrets
```

## Audit & Logging

### Log Structure

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "info",
  "message": "MCP tool executed",
  "audit": {
    "timestamp": "2024-01-15T10:30:00.000Z",
    "tenantId": "demo",
    "actorId": "user-123",
    "actorType": "user",
    "toolName": "booking.create",
    "operationType": "sensitive-write",
    "resourceId": "booking-456",
    "approvalState": "approved",
    "success": true
  }
}
```

### Never Logged

- ❌ Passwords
- ❌ API keys / tokens
- ❌ Payment card data
- ❌ Secrets
- ❌ Raw credentials
- ❌ Full stack traces (production)
- ❌ Internal file paths

### Log Levels

| Level | Use Case |
|-------|----------|
| `error` | Failures, security events |
| `warn` | Deprecations, near-misses |
| `info` | Audit events, state changes |
| `debug` | Development only |

## Compliance Considerations

### GDPR
- Data minimization (tenant-scoped)
- Right to erasure (tenant deletion)
- Data portability (export APIs)
- Privacy by design (tenant isolation)

### PCI DSS (Future)
- No payment processing in application
- Payment provider integration only
- Tokenization via provider

### SOC 2 (Future)
- Audit logging
- Access controls
- Encryption at rest/transit
- Incident response plan

## Security Checklist for Changes

- [ ] No new dependencies without review
- [ ] No `--legacy-peer-deps` or `--force`
- [ ] No hardcoded secrets
- [ ] All user input validated
- [ ] All outputs sanitized
- [ ] Tenant isolation maintained
- [ ] Audit events for sensitive operations
- [ ] No secrets in logs
- [ ] CSP headers not weakened
- [ ] Error messages user-safe
- [ ] Prompt injection defenses maintained
- [ ] Tool allowlists updated for new tools
- [ ] Agent security boundaries documented

## Incident Response

### Security Incident Classification

| Severity | Examples | Response Time |
|----------|----------|---------------|
| Critical | Active breach, secret exposure | < 1 hour |
| High | Vulnerability exploit attempt | < 4 hours |
| Medium | Failed auth spikes, suspicious activity | < 24 hours |
| Low | Policy violation, config drift | < 7 days |

### Response Steps

1. **Contain** - Isolate affected systems/tenants
2. **Assess** - Determine scope and impact
3. **Eradicate** - Remove threat, rotate credentials
4. **Recover** - Restore services, verify integrity
5. **Learn** - Post-incident review, update defenses

## Known Gaps (To Address)

1. [ ] No rate limiting implemented
2. [ ] No circuit breakers for external calls
3. [ ] No distributed tracing
4. [ ] No automated secret rotation
5. [ ] No WAF/CDN security rules
6. [ ] No automated dependency scanning in CI
7. [ ] No penetration testing schedule
8. [ ] No formal incident response team
9. [ ] No security training program
10. [ ] No bug bounty program
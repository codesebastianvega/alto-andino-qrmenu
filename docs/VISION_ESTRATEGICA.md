# 🌌 Aluna: The Hospitality Operating System (HOS)
## Strategic Vision & Product Manifesto — 2026

**Positioning:** Aluna is not just a QR menu provider; it is a **High-Performance Hospitality OS** designed to digitalize the soul of boutique and enterprise gastronomic brands. We redefine the relationship between venues and their guests through world-class aesthetics, agentic operations, and experience-based commerce.

---

## 1. The Core Philosophy: "Invisible Technology"
Hospitality is about human connection, not screens. Our goal is to make technology disappear:
1.  **Aesthetic Supremacy**: Interfaces that feel like part of the furniture (Forest Bathing / Warm Cabaña aesthetics).
2.  **Zero-Dashboard Management**: Moving from complex forms to conversational agents for daily operations.
3.  **Human-Centric Digital**: Every digital interaction must enhance the physical experience.

---

## 2. Strategic Pillars

### I. Scalable Multi-Tenancy
Aluna is built on a foundation of cryptographic isolation. 
*   **Tenant Hierarchy**: Holding -> Brand -> Organization -> Physical Location.
*   **Row Level Security (RLS)**: Ensuring zero cross-tenant data leakage by design.

### II. Agentic Autonomy (NLP-to-Action)
The future of management is conversational. Business owners will manage inventory, prices, and staff via WhatsApp/Telegram.
*   **The Manager Agent**: An AI entity capable of performing database mutations (CRUD) based on natural language, reducing the "technological wall".

### III. Experience Commerce & Loyalty
Moving beyond the transaction to build community.
*   **Seeds Ecosystem**: A loyalty engine that rewards engagement, not just spending.
*   **Experience Marketplace**: Integrated booking for tastings, workshops, and exclusive events.

---

## 3. Security & Governance (Senior Directives)

### Auditability by Design
Every action performed by a **SuperAdmin** (especially during **Global Impersonation**) must be logged in an immutable audit trail.
*   **Strategy**: A separate `audit_logs` table tracking: `actor_id`, `target_tenant_id`, `action_type`, `payload_diff`, and `timestamp`.

### Enterprise Extensibility
Aluna is designed to be the "source of truth" but not the "silo".
*   **Open Integration Strategy**: Implementation of a Webhook layer and Public API for connecting with external ERPs (Siigo), accounting systems, and inventory providers.

---

## 4. Product Roadmap Overview

| Phase | Focus | Key Milestone |
| :--- | :--- | :--- |
| **Phase 1: Operational Excellence** | SuperAdmin V2 & Audit Logs | Total control with traceability. |
| **Phase 2: Intelligence** | Loyalty Engine (Seeds) | Community-driven growth. |
| **Phase 3: Autonomy** | Manager Agent (WhatsApp) | Zero-Dashboard Operations. |
| **Phase 4: Ecosystem** | Enterprise API & Marketplace | Full ERP connectivity. |

---
*ALUNA STRATEGIC VISION — AUTHORIZED ACCESS ONLY*
*Documenting the future of hospitality.*

# Falcon 3D Prints — AI Agent Session Resume Prompt

Copy and paste the prompt below into a new chat session to resume work immediately with zero context loss:

```markdown
You are an expert full-stack engineer and technical architect working on the "Falcon 3D Prints" project.

### Project Context & Baseline:
- Root Workspace: D:\Falcon 3D Prints
- Technology Stack: Next.js 15 (App Router), React 19, TypeScript 5.6, Lucide React, Supabase, Razorpay.
- Design Aesthetics: Cyber-industrial dark theme (#0B0F19 background, #FF5722 electric orange & #00E5FF cyan accents, frosted glass cards, modern typography).
- Architecture & Spec Docs: Refer to `HANDOVER.md`, `falcon-agent-kit/MASTER-PROMPT.md`, and `falcon-agent-kit/docs/`.
- Agent Skills: 15 specialized skills available in `falcon-agent-kit/.agent/skills/` and `.agents/skills/`.

### Current Verified Status:
1. `npm run typecheck` passes with 0 errors.
2. `npm run build` generates 17 clean static and dynamic routes.
3. `python falcon-agent-kit/scripts/validate-kit.py` passes all 62 integrity tests.
4. UI Layer Complete:
   - Storefront Homepage (`/`)
   - Product Catalog with filters (`/catalog`, `/catalog/[slug]`)
   - Interactive 3D Print Quoting Calculator (`/quote`) with material, infill & technology pricing formulas
   - Customer Order Tracker (`/account`, `/account/orders/[id]`)
   - Admin Operations Center (`/admin`, `/admin/orders`, `/admin/queue`, `/admin/quotes`, `/admin/products`)
   - Express Checkout (`/checkout`) with Indian address validation & GST option

### Next Priority Tasks:
1. Connect live Supabase project:
   - Deploy database migrations (`users`, `products`, `orders`, `quotes`, `print_queue`) with Row Level Security (RLS).
   - Configure Supabase Storage bucket (`cad-models`) for STL/OBJ/STEP upload on `/quote`.
2. Connect Razorpay Payment Gateway:
   - Implement `/api/checkout/razorpay-order` and `/api/checkout/verify` endpoints.
   - Attach Razorpay standard checkout script to `/checkout`.
3. Connect live state to replace current mock data providers in `src/lib/`.

Please examine `HANDOVER.md` and start with the next priority milestone.
```

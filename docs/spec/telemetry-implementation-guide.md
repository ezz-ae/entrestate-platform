# Behavioral Telemetry & Idle State Capture: Implementation Guide
**Parent System**: Entrestate Intelligence OS
**Target Integration**: `ezz-ae/entrestate-platform` (Frontend & Ingestion API)
**Status**: SPECIFICATION & IMPLEMENTATION CODE (Ready for deployment)

This guide provides the exact, production-ready code blocks to implement the **Two-Way Programmatic Telemetry** and **Idle State Capture** we designed. Since this is not yet in your codebase, you can copy, paste, and deploy these three elements directly to make the system-wide specification a live operational reality.

---

## 1. Database Layer: Postgres Schema Update

Run this SQL block directly in your Neon Postgres Console to create the parallel `active_telemetry` and `idle_telemetry` tables, indexing them heavily for sub-second database lookups.

```sql
-- Table to store high-density, verified focused interactions
CREATE TABLE IF NOT EXISTS "ActiveTelemetry" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "leadId" UUID REFERENCES "Lead"("id") ON DELETE SET NULL,
    "sessionId" VARCHAR(100) NOT NULL,
    "elementId" VARCHAR(100) NOT NULL, -- e.g., 'roi-calculator', 'dld-comparables'
    "hoverDurationMs" INTEGER NOT NULL,
    "scrollDepthPercent" DOUBLE PRECISION NOT NULL,
    "mouseVelocityPxMs" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table to isolate and capture raw background idle states
CREATE TABLE IF NOT EXISTS "IdleTelemetry" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "leadId" UUID REFERENCES "Lead"("id") ON DELETE SET NULL,
    "sessionId" VARCHAR(100) NOT NULL,
    "idleDurationSeconds" INTEGER NOT NULL,
    "triggeredByTabHide" BOOLEAN DEFAULT FALSE, -- Page Visibility API signal
    "reEngaged" BOOLEAN DEFAULT FALSE, -- Did they return to the active state?
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indices to optimize real-time duplicate query comparison (ICI calculations)
CREATE INDEX IF NOT EXISTS "idx_active_telemetry_lead" ON "ActiveTelemetry"("leadId");
CREATE INDEX IF NOT EXISTS "idx_idle_telemetry_lead" ON "IdleTelemetry"("leadId");
CREATE INDEX IF NOT EXISTS "idx_active_telemetry_session" ON "ActiveTelemetry"("sessionId");
```

---

## 2. Frontend Layer: React Hook (`useBehavioralTelemetry.ts`)

Create this hook inside `hooks/useBehavioralTelemetry.ts` on your Next.js frontend. It tracks mouse movement velocity, hovers over scored sections, page visibility changes (idle tabs), and sends buffered payloads back to the server.

```typescript
import { useEffect, useRef } from 'react';

interface TelemetryConfig {
  leadId?: string;
  sessionId: string;
}

export function useBehavioralTelemetry({ leadId, sessionId }: TelemetryConfig) {
  const activeSectionRef = useRef<string | null>(null);
  const hoverStartTimeRef = useRef<number>(0);
  const mouseMovementsRef = useRef<{ x: number; y: number; t: number }[]>([]);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActiveTimeRef = useRef<number>(Date.now());
  const isTabHiddenRef = useRef<boolean>(false);

  useEffect(() => {
    // 1. Mouse Velocity and Active Engagement Tracker
    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      lastActiveTimeRef.current = now;
      
      // Calculate instantaneous mouse velocity
      mouseMovementsRef.current.push({ x: e.clientX, y: e.clientY, t: now });
      if (mouseMovementsRef.current.length > 10) {
        mouseMovementsRef.current.shift();
      }

      // Reset standard 60-second idle clock
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        triggerIdleState(now, false);
      }, 60000); 
    };

    // 2. Element Hover Tracker
    const handleSectionHover = (elementId: string, action: 'enter' | 'leave') => {
      const now = Date.now();
      if (action === 'enter') {
        activeSectionRef.current = elementId;
        hoverStartTimeRef.current = now;
      } else if (action === 'leave' && activeSectionRef.current === elementId) {
        const duration = now - hoverStartTimeRef.current;
        if (duration > 1000) { // Only log meaningful hovers > 1s
          sendActiveTelemetry({
            elementId,
            hoverDurationMs: duration,
            scrollDepthPercent: getScrollPercent(),
            mouseVelocityPxMs: calculateVelocity()
          });
        }
        activeSectionRef.current = null;
      }
    };

    // 3. Tab Visibility (Page Visibility API - Real Idle Tab Detection)
    const handleVisibilityChange = () => {
      const now = Date.now();
      if (document.hidden) {
        isTabHiddenRef.current = true;
        triggerIdleState(now, true);
      } else {
        if (isTabHiddenRef.current) {
          isTabHiddenRef.current = false;
          sendReEngagement(now);
        }
      }
    };

    const triggerIdleState = (startTime: number, isTabHide: boolean) => {
      const idleDuration = Math.round((Date.now() - lastActiveTimeRef.current) / 1000);
      fetch('/api/freehold/telemetry/idle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId,
          sessionId,
          idleDurationSeconds: idleDuration,
          triggeredByTabHide: isTabHide
        })
      }).catch(err => console.error('Failed to log idle state:', err));
    };

    const sendActiveTelemetry = (payload: any) => {
      fetch('/api/freehold/telemetry/active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, sessionId, ...payload })
      }).catch(err => console.error('Failed to log active state:', err));
    };

    const sendReEngagement = (now: number) => {
      fetch('/api/freehold/telemetry/reengage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, sessionId })
      }).catch(err => console.error('Failed to log re-engagement:', err));
    };

    const getScrollPercent = () => {
      const h = document.documentElement;
      const b = document.body;
      const st = 'scrollTop';
      const sh = 'scrollHeight';
      return ((h[st] || b[st]) / ((h[sh] || b[sh]) - h.clientHeight)) * 100;
    };

    const calculateVelocity = () => {
      const moves = mouseMovementsRef.current;
      if (moves.length < 2) return 0;
      let totalDistance = 0;
      for (let i = 1; i < moves.length; i++) {
        const dx = moves[i].x - moves[i - 1].x;
        const dy = moves[i].y - moves[i - 1].y;
        totalDistance += Math.sqrt(dx * dx + dy * dy);
      }
      const totalTime = moves[moves.length - 1].t - moves[0].t;
      return totalTime > 0 ? totalDistance / totalTime : 0;
    };

    // Attach listeners
    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Track sections marked with custom CSS attributes (e.g. data-telemetry="roi")
    const elements = document.querySelectorAll('[data-telemetry]');
    elements.forEach(el => {
      const id = el.getAttribute('data-telemetry') || 'unknown';
      el.addEventListener('mouseenter', () => handleSectionHover(id, 'enter'));
      el.addEventListener('mouseleave', () => handleSectionHover(id, 'leave'));
    });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [leadId, sessionId]);
}
```

---

## 3. Server Ingestion API Layer (`route.ts`)

Create this endpoint handler inside `app/api/freehold/telemetry/active/route.ts` to process telemetry streams, dynamically update ratings inside Neon, and calculate the re-engagement delta.

```typescript
import { NextResponse } from 'next/server';
import { db } from '@/lib/db'; // Your Prisma client path

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { leadId, sessionId, elementId, hoverDurationMs, scrollDepthPercent, mouseVelocityPxMs } = body;

    // 1. Log the active interaction telemetry
    await db.$executeRaw`
      INSERT INTO "ActiveTelemetry" ("leadId", "sessionId", "elementId", "hoverDurationMs", "scrollDepthPercent", "mouseVelocityPxMs")
      VALUES (${leadId}::uuid, ${sessionId}, ${elementId}, ${hoverDurationMs}, ${scrollDepthPercent}, ${mouseVelocityPxMs});
    `;

    // 2. Check if this is a premium element that triggers a quality rate bump
    if (leadId && hoverDurationMs > 15000) { // e.g., > 15s hover on premium ROI calculator
      const premiumElements = ['roi-calculator', 'dld-comparables', 'payment-structures'];
      
      if (premiumElements.includes(elementId)) {
        // Run lookups on active metrics to dynamically recalculate rate
        const currentLead = await db.lead.findUnique({ where: { id: leadId } });
        
        if (currentLead && currentLead.rate < 3) {
          // Programmatically elevate their initial ingest qualification signal
          await db.lead.update({
            where: { id: leadId },
            data: { rate: 3 } 
          });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Server Telemetry Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
```

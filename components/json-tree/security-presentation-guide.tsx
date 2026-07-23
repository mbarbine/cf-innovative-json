'use client'

import { ArrowLeft, ArrowRight, ExternalLink, Radio, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  formatSecuritySnapshotTime,
  type SecurityControlTone,
  type SecurityControlsSnapshot,
} from '@/lib/security-controls'

export interface SecurityPresentationStep {
  tone: SecurityControlTone
  label: string
  title: string
  detail: string
  proof: string
  color: string
}

export const SECURITY_PRESENTATION_STEPS: readonly SecurityPresentationStep[] = [
  {
    tone: 'waf',
    label: 'WAF',
    title: 'Stop hostile traffic at the edge',
    detail: 'Inspect the active custom-rule branch and its isolated attack-lab target.',
    proof: 'Proof cue: the edge returns 403 before the Worker can return application JSON.',
    color: 'rgb(244, 63, 94)',
  },
  {
    tone: 'bots',
    label: 'Bots',
    title: 'Apply the control available today',
    detail: 'Review the live Free-plan Bot Fight Mode posture and keep bot-score controls as an upgrade path.',
    proof: 'Claim boundary: Bot Management scores require a higher Cloudflare plan.',
    color: 'rgb(6, 182, 212)',
  },
  {
    tone: 'apiGateway',
    label: 'APIs',
    title: 'Map the intended API surface',
    detail: 'Review the eight managed operations and the public-safe request-inspection workflow.',
    proof: 'Claim boundary: Endpoint Management is live; Enterprise API Discovery is the next extension.',
    color: 'rgb(99, 102, 241)',
  },
  {
    tone: 'rateLimit',
    label: 'Rate limit',
    title: 'Contain bursts before origin work',
    detail: 'Inspect the active burst policy and its dedicated demonstration endpoint.',
    proof: 'Proof cue: normal traffic returns Worker JSON; a qualifying burst transitions to edge 429.',
    color: 'rgb(249, 115, 22)',
  },
] as const

interface SecurityPresentationGuideProps {
  activeTone: SecurityControlTone
  availableTones: SecurityControlTone[]
  snapshot: SecurityControlsSnapshot
  onToneChange: (tone: SecurityControlTone) => void
}

export function SecurityPresentationGuide({
  activeTone,
  availableTones,
  snapshot,
  onToneChange,
}: SecurityPresentationGuideProps) {
  const steps = SECURITY_PRESENTATION_STEPS.filter(step => availableTones.includes(step.tone))
  const activeIndex = Math.max(0, steps.findIndex(step => step.tone === activeTone))
  const activeStep = steps[activeIndex] ?? SECURITY_PRESENTATION_STEPS[0]
  const capturedLabel = formatSecuritySnapshotTime(snapshot.capturedAt) ?? 'No capture time reported'

  const move = (offset: number) => {
    const nextIndex = Math.min(Math.max(activeIndex + offset, 0), steps.length - 1)
    const nextStep = steps[nextIndex]
    if (nextStep) onToneChange(nextStep.tone)
  }

  return (
    <aside
      className="absolute left-4 top-4 z-30 w-[min(25rem,calc(100%-2rem))] rounded-2xl border border-border bg-background/95 p-4 shadow-2xl backdrop-blur-md"
      aria-label="Guided Cloudflare security tour"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            Guided security tour
          </div>
          <h2 className="mt-1 text-sm font-semibold text-foreground">
            Live control graph
          </h2>
        </div>
        <span
          className={cn(
            'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-medium',
            snapshot.live
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              : 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
          )}
          title={snapshot.message}
        >
          <Radio className="h-3 w-3" />
          {snapshot.live ? 'Live source' : 'Fallback'}
        </span>
      </div>

      <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
        Captured {capturedLabel} · server-side from the public-safe controls endpoint
      </p>

      <div className="mt-3 grid grid-cols-4 gap-1" role="group" aria-label="Security tour steps">
        {steps.map((step, index) => {
          const isActive = step.tone === activeStep.tone
          return (
            <button
              key={step.tone}
              type="button"
              className={cn(
                'rounded-lg border px-2 py-2 text-[10px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isActive
                  ? 'border-foreground/20 bg-foreground text-background'
                  : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
              onClick={() => onToneChange(step.tone)}
              aria-pressed={isActive}
              aria-label={`Step ${index + 1}: ${step.label}`}
            >
              <span
                className="mx-auto mb-1 block h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: step.color }}
              />
              {step.label}
            </button>
          )
        })}
      </div>

      <div className="mt-3 min-h-32 rounded-xl border border-border bg-muted/35 p-3" aria-live="polite">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {activeIndex + 1} / {steps.length}
          </span>
          <span className="h-px flex-1 bg-border" />
          <span className="text-[10px] font-semibold" style={{ color: activeStep.color }}>
            {activeStep.label}
          </span>
        </div>
        <h3 className="mt-2 text-sm font-semibold text-foreground">{activeStep.title}</h3>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{activeStep.detail}</p>
        <p className="mt-2 text-[10px] leading-relaxed text-foreground/80">{activeStep.proof}</p>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 px-2 text-xs"
            onClick={() => move(-1)}
            disabled={activeIndex === 0}
            aria-label="Previous security control"
          >
            <ArrowLeft className="mr-1 h-3.5 w-3.5" />
            Back
          </Button>
          <Button
            type="button"
            size="sm"
            className="h-8 px-2 text-xs"
            onClick={() => move(1)}
            disabled={activeIndex === steps.length - 1}
            aria-label="Next security control"
          >
            Next
            <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        </div>
        <a
          href="https://innovativefuturesolutions.com/#/10"
          className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Return to deck
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </aside>
  )
}

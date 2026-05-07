import React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export interface TimelineStep {
  id: string;
  title: string;
  description?: string;
  date?: string;
}

interface StatusTimelineProps {
  steps: TimelineStep[];
  currentStepIndex: number;
  className?: string;
}

export function StatusTimeline({ steps, currentStepIndex, className }: StatusTimelineProps) {
  return (
    <div className={cn("relative border-l border-muted-foreground/30 ml-3", className)}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStepIndex;
        const isCurrent = index === currentStepIndex;
        
        return (
          <div key={step.id} className="mb-8 ml-6 relative">
            <span
              className={cn(
                "absolute -left-9 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-background",
                isCompleted ? "bg-primary text-primary-foreground" : 
                isCurrent ? "bg-accent text-accent-foreground border-2 border-primary" : 
                "bg-muted border-2 border-muted-foreground/30 text-muted-foreground"
              )}
            >
              {isCompleted ? (
                <Check className="h-3 w-3" />
              ) : (
                <span className="text-xs font-medium">{index + 1}</span>
              )}
            </span>
            <div className="flex flex-col">
              <h4
                className={cn(
                  "text-sm font-semibold",
                  isCompleted || isCurrent ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step.title}
              </h4>
              {step.date && (
                <time className="text-xs text-muted-foreground mt-0.5">
                  {step.date}
                </time>
              )}
              {step.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {step.description}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

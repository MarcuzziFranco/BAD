import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

export interface Step {
  id: number;
  title: string;
  description?: string;
}

interface StepperProps {
  steps: Step[] | string[];
  currentStep: number;
  onStepClick?: (step: number) => void;
}

export function Stepper({ steps, currentStep, onStepClick }: StepperProps) {
  // Normalizar steps a formato Step[]
  const normalizedSteps: Step[] = steps.map((s, i) => 
    typeof s === 'string' ? { id: i, title: s } : s
  );

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {normalizedSteps.map((step, index) => (
          <div key={step.id} className="flex items-center flex-1">
            {/* Step circle */}
            <button
              onClick={() => onStepClick?.(index)}
              disabled={!onStepClick}
              className={cn(
                'flex items-center justify-center w-10 h-10 rounded-full border-2 font-semibold text-sm transition-all',
                currentStep > index
                  ? 'bg-primary border-primary text-primary-foreground'
                  : currentStep === index
                  ? 'border-primary text-primary bg-primary/10'
                  : 'border-muted-foreground/30 text-muted-foreground',
                onStepClick && 'cursor-pointer hover:border-primary/50'
              )}
            >
              {currentStep > index ? (
                <Check className="w-5 h-5" />
              ) : (
                index + 1
              )}
            </button>

            {/* Step info */}
            <div className="ml-3 hidden sm:block">
              <p
                className={cn(
                  'text-sm font-medium',
                  currentStep >= index ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {step.title}
              </p>
              {step.description && (
                <p className="text-xs text-muted-foreground">{step.description}</p>
              )}
            </div>

            {/* Connector line */}
            {index < normalizedSteps.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-0.5 mx-4 transition-colors',
                  currentStep > index ? 'bg-primary' : 'bg-muted-foreground/30'
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

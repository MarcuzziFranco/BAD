import { memo } from 'react';
import { WIZARD_STEPS, WizardStep } from './types';
import { cn } from '@/lib/utils';
import { Check, AlertCircle } from 'lucide-react';

interface WizardStepperProps {
  currentStep: WizardStep;
  getStepStatus: (step: WizardStep) => 'complete' | 'current' | 'pending' | 'error';
  onStepClick: (step: WizardStep) => void;
}

export const WizardStepper = memo(function WizardStepper({
  currentStep,
  getStepStatus,
  onStepClick,
}: WizardStepperProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-muted/30 rounded-lg border">
      {WIZARD_STEPS.map((step, index) => {
        const status = getStepStatus(step.id);
        const isClickable = status === 'complete' || status === 'current' || status === 'error';
        const isLast = index === WIZARD_STEPS.length - 1;

        return (
          <div key={step.id} className="flex items-center flex-1">
            {/* Step indicator */}
            <button
              onClick={() => isClickable && onStepClick(step.id)}
              disabled={!isClickable}
              className={cn(
                'flex items-center gap-3 group transition-colors',
                isClickable && 'cursor-pointer',
                !isClickable && 'cursor-not-allowed opacity-50'
              )}
            >
              {/* Circle/Icon */}
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all',
                  status === 'complete' && 'bg-green-500 text-white',
                  status === 'current' && 'bg-primary text-primary-foreground ring-2 ring-primary/30',
                  status === 'pending' && 'bg-muted text-muted-foreground border border-muted-foreground/20',
                  status === 'error' && 'bg-red-500 text-white'
                )}
              >
                {status === 'complete' ? (
                  <Check className="w-4 h-4" />
                ) : status === 'error' ? (
                  <AlertCircle className="w-4 h-4" />
                ) : (
                  index + 1
                )}
              </div>

              {/* Text */}
              <div className="text-left">
                <p
                  className={cn(
                    'text-sm font-medium leading-tight',
                    status === 'current' && 'text-foreground',
                    status === 'complete' && 'text-green-600',
                    status === 'pending' && 'text-muted-foreground',
                    status === 'error' && 'text-red-600'
                  )}
                >
                  {step.name}
                </p>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  {step.description}
                </p>
              </div>
            </button>

            {/* Connector line */}
            {!isLast && (
              <div className="flex-1 mx-4">
                <div
                  className={cn(
                    'h-0.5 rounded-full transition-colors',
                    index < currentStep ? 'bg-green-500' : 'bg-muted-foreground/20'
                  )}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
});

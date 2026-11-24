import { ArrowLeft, Hourglass } from "lucide-react";
import { InfoPanel } from "@/components/ui/InfoPanel";
import { PrimaryButton } from "@/components/ui/PrimaryButton";

/**
 * V1.0 stand-in for the analysis step. Deliberately shows no results.
 * V1.1: replace this with the analysis workflow, fed by `ScreenshotInput`.
 */
export function AnalysisPlaceholder({ onBack }: { onBack: () => void }) {
  return (
    <div className="space-y-4" role="status">
      <InfoPanel title="Analysis isn’t available yet">
        <p>
          <Hourglass className="mr-1.5 -mt-0.5 inline size-4" aria-hidden="true" />
          Screenshot analysis arrives in the next phase of TableShift. Nothing has been analysed or
          sent anywhere, and your screenshot never left this browser tab.
        </p>
      </InfoPanel>
      <PrimaryButton
        variant="secondary"
        onClick={onBack}
        icon={<ArrowLeft className="size-4" aria-hidden="true" />}
      >
        Back to screenshot
      </PrimaryButton>
    </div>
  );
}

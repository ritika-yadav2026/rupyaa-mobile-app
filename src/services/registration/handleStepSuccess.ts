import { userService } from '@/src/services/user/userService';
import type { UserStage } from '@/src/config/userStages';
import type { UserStageContext, UserStageSectionsCompleted } from '@/src/types/user';
import { useFlowStore } from '@/src/store/useFlowStore';
import { applyUserStageResultToStore } from '@/src/services/user/useUserStage';
import {
  logJourneyStageRedirect,
  pushLoanJourneyApiError,
} from '@/src/services/logging/logPoolJourney';

export interface HandleRegistrationStepSuccessParams {
  /** Current step's expected user stage (e.g. 'CONTACT_DETAILS', 'BANK_DETAILS'). */
  currentStage: UserStage;
  /** Callback to move to the next step in the flow. */
  onNext: () => void;
  /** Callback to sync flow state to backend stage (e.g. jump to a different step). */
  syncFromUserStage: (
    stage: UserStage,
    sectionsCompleted?: UserStageSectionsCompleted,
    context?: UserStageContext
  ) => void;
}

/**
 * Single source of truth: after a registration step succeeds, fetch user stage from API,
 * then either navigate to next step (if stage unchanged) or sync flow to backend stage.
 *
 * Use this in every step's onSuccess so behaviour can be updated in one place.
 * Update this file when you need to change how we react to user stage after a step.
 */
export async function handleRegistrationStepSuccess(
  params: HandleRegistrationStepSuccessParams
): Promise<void> {
  const { currentStage, onNext, syncFromUserStage } = params;
  const stageResponse = await userService.getUserStage();
  if (stageResponse.success) {
    applyUserStageResultToStore(stageResponse.data);
  }
  if (!stageResponse.success) {
    pushLoanJourneyApiError(
      'get user stage after step',
      stageResponse.error,
      stageResponse.status
    );
    onNext();
    return;
  }
  if (stageResponse.data?.stage) {
    const backendStage = stageResponse.data.stage;
    if (backendStage === currentStage) {
      onNext();
      return;
    }
    logJourneyStageRedirect(currentStage, backendStage);
    syncFromUserStage(
      backendStage,
      stageResponse.data?.sectionsCompleted,
      stageResponse.data?.context
    );
    return;
  }
  onNext();
}

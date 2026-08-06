import type { ComponentType } from 'react';
import type { StepProps } from '@/src/types/flow';
import type { StepComponentId } from '@/src/config/flowSteps';
import { PersonalDetailsStep } from './PersonalDetailsStep';
import { EmploymentTypeStep } from './EmploymentTypeStep';
import { EmploymentDetailsStep } from './EmploymentDetailsStep';
import { SoftPullStep } from './SoftPullStep';
import { BankConnectStep } from './BankConnectStep';
import { ApprovedOfferStep } from './ApprovedOfferStep';
import { DigilockerStep } from './DigilockerStep';
import { FaceKycStep } from './FaceKycStep';
import { ContactDetailsStep } from './ContactDetailsStep';
import { AddressDetailsStep } from './AddressDetailsStep';
import { FamilyDetailsStep } from './FamilyDetailsStep';
import { ReferenceDetailsStep } from './ReferenceDetailsStep';
import { BankDetailsStep } from './BankDetailsStep';
// import { AgreementStep } from './AgreementStep';
import { EsignStep } from './EsignStep';
import { SanctionedStep } from './SanctionedStep';
import { EnachStep } from './EnachStep';

export const STEP_COMPONENTS: Record<StepComponentId, ComponentType<StepProps>> = {
  PersonalDetailsStep,
  EmploymentTypeStep,
  EmploymentDetailsStep,
  SoftPullStep,
  BankConnectStep,
  ApprovedOfferStep,
  DigilockerStep,
  FaceKycStep,
  ContactDetailsStep,
  AddressDetailsStep,
  FamilyDetailsStep,
  ReferenceDetailsStep,
  BankDetailsStep,
  // AgreementStep,
  EsignStep,
  EnachStep,
  SanctionedStep,
};

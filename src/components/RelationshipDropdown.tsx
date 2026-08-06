import React from 'react';
import { Controller, Control, FieldValues, Path } from 'react-hook-form';
import { DropdownSelect, type DropdownOption } from './DropdownSelect';
import {
  RELATIONSHIP_VALUES,
  type RelationshipValue,
} from '@/src/types/kyc';

export { RELATIONSHIP_VALUES, type RelationshipValue };

export const RELATIONSHIP_OPTIONS: DropdownOption<RelationshipValue>[] = RELATIONSHIP_VALUES.map(
  (value) => ({ label: value, value })
);

interface ControlledRelationshipDropdownProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  /** Title shown inside the dropdown modal. Defaults to "Relationship to you". */
  modalTitle?: string;
  required?: boolean;
  placeholder?: string;
}

/**
 * Reusable relationship dropdown for FamilyDetailsStep and ReferenceDetailsStep.
 * Options: Parent, Spouse, Sibling, Child, Guardian, Other.
 */
export function ControlledRelationshipDropdown<T extends FieldValues>({
  control,
  name,
  label,
  modalTitle = 'Relationship to you',
  required = false,
  placeholder = 'Select relationship',
}: ControlledRelationshipDropdownProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <DropdownSelect<RelationshipValue>
          label={label}
          modalTitle={modalTitle}
          value={value as RelationshipValue | undefined}
          options={RELATIONSHIP_OPTIONS}
          onChange={onChange}
          onBlur={onBlur}
          error={error?.message}
          required={required}
          placeholder={placeholder}
        />
      )}
    />
  );
}

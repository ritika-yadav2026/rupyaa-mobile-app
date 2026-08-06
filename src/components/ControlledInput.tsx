import React, { useCallback, useRef, type ReactNode, type Ref } from 'react';
import { Controller, Control, FieldValues, Path } from 'react-hook-form';
import { FormInput } from './FormInput';
import { DateInput } from './DateInput';
import { RadioGroup, type RadioOption } from './RadioGroup';
import { DropdownSelect, type DropdownOption } from './DropdownSelect';
import { TextInput, TextInputProps } from 'react-native';
import { isBulkTextInsert } from '@/src/utils/textInput/isBulkTextInsert';

interface ControlledInputProps<T extends FieldValues>
  extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  required?: boolean;
  labelAccessory?: ReactNode;
  leftAccessory?: ReactNode;
  rightAccessory?: ReactNode;
  /** Ref forwarded to the underlying TextInput for programmatic focus. */
  inputRef?: Ref<TextInput>;
  /**
   * When true, change events that add more than one character at a time
   * (paste / autofill) are ignored. Useful for "reconfirm" style fields.
   */
  blockBulkInsert?: boolean;
  normalizeText?: (text: string) => string;
}

export function ControlledInput<T extends FieldValues>({
  control,
  name,
  label,
  required = false,
  labelAccessory,
  leftAccessory,
  rightAccessory,
  inputRef,
  blockBulkInsert = false,
  normalizeText,
  ...textInputProps
}: ControlledInputProps<T>) {
  // Internal handle to the native TextInput so we can synchronously revert
  // its text when a paste/autofill is rejected (avoids a 1-frame flicker
  // where the native input briefly paints the rejected text before React
  // re-renders the controlled value).
  const internalRef = useRef<TextInput | null>(null);

  // Forward the node to both our internal ref and the caller-provided ref.
  // Supports both RefObject and callback ref styles.
  const setRefs = useCallback(
    (node: TextInput | null) => {
      internalRef.current = node;
      if (typeof inputRef === 'function') {
        inputRef(node);
      } else if (inputRef) {
        (inputRef as React.MutableRefObject<TextInput | null>).current = node;
      }
    },
    [inputRef]
  );

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => {
        const currentValue = (value ?? '') as string;
        const handleChangeText = (text: string) => {
          // Reject paste/autofill on guarded fields; allow normal typing + deletion.
          if (blockBulkInsert && isBulkTextInsert(currentValue, text)) {
            // Native already shows the rejected text; push the controlled
            // value back synchronously so the user never sees the flash.
            internalRef.current?.setNativeProps({ text: currentValue });
            return;
          }
          const nextValue = normalizeText ? normalizeText(text) : text;
          if (nextValue !== text) {
            internalRef.current?.setNativeProps({ text: nextValue });
          }
          onChange(nextValue);
        };
        return (
          <FormInput
            inputRef={setRefs}
            label={label}
            labelAccessory={labelAccessory}
            leftAccessory={leftAccessory}
            rightAccessory={rightAccessory}
            value={currentValue}
            onChangeText={handleChangeText}
            onBlur={onBlur}
            error={error?.message}
            required={required}
            {...textInputProps}
          />
        );
      }}
    />
  );
}

interface ControlledDateInputProps<T extends FieldValues>
  extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  required?: boolean;
  /** Ref forwarded to the underlying TextInput for programmatic focus. */
  inputRef?: Ref<TextInput>;
}

export function ControlledDateInput<T extends FieldValues>({
  control,
  name,
  label,
  required = false,
  inputRef,
  ...textInputProps
}: ControlledDateInputProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <DateInput
          inputRef={inputRef}
          label={label}
          value={value ?? ''}
          onChangeText={onChange}
          onBlur={onBlur}
          error={error?.message}
          required={required}
          {...textInputProps}
        />
      )}
    />
  );
}

interface ControlledRadioGroupProps<T extends FieldValues, V extends string> {
  control: Control<T>;
  name: Path<T>;
  options: RadioOption<V>[];
  label?: string;
  variant?: 'default' | 'card' | 'row';
  accentColor?: string;
}

export function ControlledRadioGroup<T extends FieldValues, V extends string>({
  control,
  name,
  options,
  label,
  variant = 'default',
  accentColor,
}: ControlledRadioGroupProps<T, V>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <RadioGroup
          options={options}
          value={value as V | undefined}
          onChange={onChange}
          label={label}
          error={error?.message}
          variant={variant}
          accentColor={accentColor}
        />
      )}
    />
  );
}

interface ControlledDropdownProps<T extends FieldValues, V = unknown> {
  control: Control<T>;
  name: Path<T>;
  options: DropdownOption<V>[];
  label: string;
  required?: boolean;
  placeholder?: string;
  /** Helper text shown below the dropdown */
  helperText?: string;
}

export function ControlledDropdown<T extends FieldValues, V = unknown>({
  control,
  name,
  options,
  label,
  required = false,
  placeholder,
  helperText,
}: ControlledDropdownProps<T, V>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <DropdownSelect
          label={label}
          value={value as V | undefined}
          options={options}
          onChange={onChange}
          onBlur={onBlur}
          error={error?.message}
          required={required}
          placeholder={placeholder}
          helperText={helperText}
        />
      )}
    />
  );
}

import * as Contacts from 'expo-contacts';
import type { ContactResponse, ExistingContact } from 'expo-contacts';
import { getEnableUpfrontContactsPermission } from '@/src/config/resolvedAppConfig';
import type { DeviceContactRow } from '@/src/types';
import { consoleLogDev } from '@/src/utils/common-helper';

export interface FetchDeviceContactsPageArgs {
  pageOffset: number;
  pageSize: number;
}

export interface DeviceContactsPage {
  contacts: DeviceContactRow[];
  hasNextPage: boolean;
  nextPageOffset: number;
}

function sanitizePhone(phoneNumber: string | undefined): string | null {
  const safePhone = phoneNumber?.trim();
  if (!safePhone) return null;
  return safePhone;
}

function pickPrimaryPhone(contact: ExistingContact): string | null {
  const numbers = contact.phoneNumbers;
  if (!Array.isArray(numbers) || numbers.length === 0) return null;

  const mobileNumber =
    numbers.find((item) => item.label?.toLowerCase().includes('mobile'))?.number ?? null;
  if (mobileNumber) {
    return sanitizePhone(mobileNumber);
  }

  return sanitizePhone(numbers[0]?.number);
}

function mapDeviceContact(contact: ExistingContact): DeviceContactRow {
  const displayName =
    contact.name?.trim() ||
    [contact.firstName, contact.lastName].filter(Boolean).join(' ').trim() ||
    'Unknown';

  return {
    id: contact.id,
    name: displayName,
    phone: pickPrimaryPhone(contact),
  };
}

export async function getDeviceContactsPermission(): Promise<Contacts.PermissionStatus> {
  const current = await Contacts.getPermissionsAsync();
  if (current.status === Contacts.PermissionStatus.GRANTED) {
    return current.status;
  }

  const requested = await Contacts.requestPermissionsAsync();
  return requested.status;
}

/**
 * Best-effort contacts prompt on /permissions when enableUpfrontContactsPermission is on.
 * Never throws — denial must not block required permission flow.
 */
export async function requestContactsPermissionUpfrontIfEnabled(): Promise<void> {
  if (!getEnableUpfrontContactsPermission()) {
    return;
  }

  try {
    await getDeviceContactsPermission();
  } catch {
    // Contacts are optional; do not block camera/location/SMS onboarding.
  }
}

export async function fetchDeviceContactsPage({
  pageOffset,
  pageSize,
}: FetchDeviceContactsPageArgs): Promise<DeviceContactsPage> {
  const response: ContactResponse = await Contacts.getContactsAsync({
    fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
    pageOffset,
    pageSize,
    sort: Contacts.SortTypes.FirstName,
  });

  consoleLogDev('response from fetchDeviceContactsPage', response);

  const contacts = (response.data ?? []).map(mapDeviceContact);
  const safeNextOffset = pageOffset + contacts.length;

  return {
    contacts,
    hasNextPage: response.hasNextPage ?? false,
    nextPageOffset: safeNextOffset,
  };
}

export async function openCreateContactForm(): Promise<void> {
  await Contacts.presentFormAsync();
}

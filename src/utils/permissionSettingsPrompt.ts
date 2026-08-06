import type { PermissionDefinition, PermissionType } from '@/src/types/permissions';

/** Lines for `SettingsPromptModal.detailItems` built from app-config permission definitions. */
export function mapMissingTypesToSettingsPromptDetails(
  missingTypes: PermissionType[],
  definitions: readonly PermissionDefinition[],
): { title: string; description: string }[] {
  return missingTypes.map((id) => {
    const def = definitions.find((p) => p.id === id);
    return {
      title: def?.title ?? id,
      description: def?.description ?? '',
    };
  });
}

function resolvePermissionDisplayNames(
  missingTypes: PermissionType[],
  definitions: readonly PermissionDefinition[],
): string[] {
  return missingTypes.map((id) => {
    const definition = definitions.find((permission) => permission.id === id);
    return definition?.title ?? id;
  });
}

function formatPermissionNamesForSentence(names: readonly string[]): string {
  if (names.length === 0) {
    return '';
  }

  if (names.length === 1) {
    return names[0];
  }

  if (names.length === 2) {
    return `${names[0]} and ${names[1]}`;
  }

  const namesExceptLast = names.slice(0, -1).join(', ');
  const lastName = names[names.length - 1];
  return `${namesExceptLast}, and ${lastName}`;
}

/** Builds dynamic intro copy for the permissions settings modal. */
export function buildSettingsPromptMessage(
  missingTypes: PermissionType[],
  definitions: readonly PermissionDefinition[],
): string {
  const permissionNames = resolvePermissionDisplayNames(missingTypes, definitions);

  if (permissionNames.length === 0) {
    return 'This feature requires permissions to work properly. You can continue after enabling access from your device Settings.';
  }

  const namesText = formatPermissionNamesForSentence(permissionNames);
  const permissionWord = permissionNames.length === 1 ? 'permission' : 'permissions';

  return `This feature requires ${namesText} ${permissionWord} to work properly. You can continue after enabling access from your device Settings.`;
}

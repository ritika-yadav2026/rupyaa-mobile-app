/**
 * Permission status types
 */
export type PermissionStatus = 'granted' | 'denied' | 'undetermined' | 'checking';

/**
 * Permission type identifiers
 */
export type PermissionType =
  | 'camera'
  | 'location'
  | 'sms'
  | 'notifications'
  | 'appTrackingTransparency'
  | 'phoneState'
  | 'installedApps'
  | 'deviceMetadata'
  | 'contacts';

/**
 * Platform-specific permission availability
 */
export type PlatformAvailability = 'ios' | 'android' | 'both';

/**
 * Permission definition with metadata
 */
export interface PermissionDefinition {
  id: PermissionType;
  title: string;
  description: string;
  platform: PlatformAvailability;
}

/**
 * Permission status map
 */
export type PermissionStatusMap = Record<PermissionType, PermissionStatus>;

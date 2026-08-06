import React from 'react';
import {
  Camera as CameraIcon,
  MapPin,
  MessageSquare,
  Bell,
  Radar,
  Smartphone,
  Download,
  Database,
  Users,
} from 'lucide-react-native';
import { PermissionType } from '@/src/types/permissions';
import { colors } from '@/src/theme';

/**
 * Map permission types to their icon components
 */
export function getPermissionIcon(
  permissionType: PermissionType,
  size: number = 18
): React.ReactNode {
  const iconProps = { size, color: colors.primary.main };

  switch (permissionType) {
    case 'camera':
      return <CameraIcon {...iconProps} />;
    case 'location':
      return <MapPin {...iconProps} />;
    case 'sms':
      return <MessageSquare {...iconProps} />;
    case 'notifications':
      return <Bell {...iconProps} />;
    case 'appTrackingTransparency':
      return <Radar {...iconProps} />;
    case 'phoneState':
      return <Smartphone {...iconProps} />;
    case 'installedApps':
      return <Download {...iconProps} />;
    case 'deviceMetadata':
      return <Database {...iconProps} />;
    case 'contacts':
      return <Users {...iconProps} />;
    default:
      return null;
  }
}

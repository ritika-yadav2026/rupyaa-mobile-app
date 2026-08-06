import React from 'react';
import { useTranslation } from 'react-i18next';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Download, FileText } from 'lucide-react-native';
import { Screen, AppText } from '@/src/components';
import { colors, spacing, typography, radius } from '@/src/theme';

const PREVIEW_LINES = Array.from({ length: 6 }, (_, index) => index);

export default function LoanAgreementScreen() {
  const { t } = useTranslation();
  const handleDownload = () => {
    Alert.alert(t('Download'), t('Loan agreement will be downloaded'));
  };

  return (
    <Screen edges={[]} contentContainerStyle={styles.container}>
      <View style={styles.infoCard}>
        <AppText style={styles.infoTitle}>Access your signed loan agreement</AppText>
        <AppText style={styles.infoSubtitle}>
          Review all approved loan terms and conditions in one place.
        </AppText>
      </View>

      <View style={styles.documentCard}>
        <View style={styles.previewFrame}>
          <View style={styles.previewHeader}>
            <AppText style={styles.previewTitle}>Loan Agreement</AppText>
            <View style={styles.previewBadge}>
              <AppText style={styles.previewBadgeText}>Approved</AppText>
            </View>
          </View>
          <View style={styles.previewBody}>
            {PREVIEW_LINES.map((line) => (
              <View
                key={`line-${line}`}
                style={[styles.previewLine, line % 3 === 0 && styles.previewLineShort]}
              />
            ))}
            <View style={styles.previewSignature} />
          </View>
        </View>

        <View style={styles.fileRow}>
          <View style={styles.fileIcon}>
            <FileText size={18} color={colors.text.secondary} />
          </View>
          <View style={styles.fileInfo}>
            <AppText style={styles.fileName}>Loan Agreement.pdf</AppText>
            <AppText style={styles.fileMeta}>PDF - 1.2 MB</AppText>
          </View>
          <TouchableOpacity
            style={styles.downloadButton}
            onPress={handleDownload}
            activeOpacity={0.7}
          >
            <Download size={18} color={colors.primary.main} />
          </TouchableOpacity>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  infoCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: radius.lg,
    padding: spacing.base,
    marginBottom: spacing.xl,
  },
  infoTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  infoSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: typography.lineHeight.relaxed * typography.fontSize.sm,
  },
  documentCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.background.primary,
    padding: spacing.base,
  },
  previewFrame: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.background.secondary,
    padding: spacing.base,
    marginBottom: spacing.base,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  previewTitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text.primary,
  },
  previewBadge: {
    backgroundColor: colors.success.bg,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  previewBadgeText: {
    fontSize: typography.fontSize.xs,
    color: colors.success.main,
    fontFamily: typography.fontFamily.medium,
  },
  previewBody: {
    backgroundColor: colors.background.primary,
    borderRadius: radius.md,
    padding: spacing.base,
    minHeight: 160,
  },
  previewLine: {
    height: 6,
    borderRadius: radius.full,
    backgroundColor: colors.border.light,
    marginBottom: spacing.sm,
  },
  previewLineShort: {
    width: '70%',
  },
  previewSignature: {
    marginTop: spacing.base,
    width: 120,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: colors.background.tertiary,
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.background.secondary,
    padding: spacing.base,
  },
  fileIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.base,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  fileMeta: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  },
  downloadButton: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
  },
});

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { CloudUpload, FileText, X } from 'lucide-react-native';
import { AppText } from '@/src/components/AppText';
import { Button } from '@/src/components/Button';
import { colors, spacing } from '@/src/theme';

type BankStatementUploaderProps = {
  selectedFileName: string | null;
  onPickFile: () => void;
  onRemoveFile: () => void;
  onUploadPress: () => void;
  isPickingFile?: boolean;
  isUploading?: boolean;
};

export function BankStatementUploader({
  selectedFileName,
  onPickFile,
  onRemoveFile,
  onUploadPress,
  isPickingFile = false,
  isUploading = false,
}: BankStatementUploaderProps): React.JSX.Element {
  const canUpload = Boolean(selectedFileName) && !isUploading;

  return (
    <View style={styles.container}>
      {!selectedFileName ? (
        <TouchableOpacity
          style={styles.uploadArea}
          onPress={onPickFile}
          activeOpacity={0.7}
          disabled={isPickingFile || isUploading}
        >
          <CloudUpload size={32} color={colors.text.tertiary} />
          <AppText style={styles.uploadHint} variant="body">
            {isPickingFile ? 'Opening file picker...' : 'Select PDF Statement'}
          </AppText>
          <AppText style={styles.uploadFormat} variant="caption">
            File should be in .pdf format
          </AppText>
        </TouchableOpacity>
      ) : (
        <View style={styles.selectedFileContainer}>
          <View style={styles.uploadedFile}>
            <FileText size={22} color={colors.primary.main} />
            <View style={styles.uploadedFileInfo}>
              <AppText variant="body" weight="medium">
                {selectedFileName}
              </AppText>
              <AppText style={styles.fileSelectedText} variant="caption">
                PDF selected
              </AppText>
            </View>
            <TouchableOpacity onPress={onRemoveFile} hitSlop={12}>
              <X size={20} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>
          <Button
            variant="outline"
            size="small"
            fullWidth
            onPress={onPickFile}
            disabled={isPickingFile || isUploading}
          >
            Choose Another PDF
          </Button>
        </View>
      )}

      <Button
        variant="primary"
        size="large"
        fullWidth
        onPress={onUploadPress}
        loading={isUploading}
        disabled={!canUpload}
      >
        Upload Statement
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    rowGap: spacing.base,
  },
  uploadArea: {
    borderWidth: 2,
    borderColor: colors.border.light,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: spacing['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadHint: {
    color: colors.text.secondary,
    marginTop: spacing.sm,
  },
  uploadFormat: {
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  },
  selectedFileContainer: {
    rowGap: spacing.sm,
  },
  uploadedFile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.base,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
  },
  uploadedFileInfo: {
    flex: 1,
    marginLeft: spacing.base,
  },
  fileSelectedText: {
    color: colors.success.main,
    marginTop: spacing.xs,
  },
});

import React from 'react';
import { Modal, View, StyleSheet, TouchableOpacity } from 'react-native';
import { useUpdateStore } from '@/src/store/updateStore';
import { nativeUpdateHelper } from '@/src/services/startup/nativeUpdateHelper';
import { colors } from '@/src/theme';
import { AppText } from './AppText';
import { Button } from './Button';

interface Props { }

export const UpdateModal: React.FC<Props> = () => {
  const { visible, force, releaseNotes, storeUrl, version, hideUpdate } = useUpdateStore();

  const handleUpdateNow = () => {
    // Use Platform APIs for linking
    const { Linking } = require('react-native');
    Linking.openURL(storeUrl);
  };

  const handleSkip = async () => {
    if (version) {
      await nativeUpdateHelper.setSkippedUpdateVersion(version);
    }
    hideUpdate();
  };

  return (
    <Modal visible={visible} transparent={true}
      statusBarTranslucent={true} animationType="fade" onRequestClose={() => { }}>
      <View style={styles.backdrop}>
        <View style={styles.container}>
          <AppText variant="h4" weight="semiBold" color="textprimary" style={styles.title}>{force ? 'Update required' : 'Update available'}</AppText>
          <View style={styles.notesContainer}>
            <AppText variant="body" weight="regular" color="textprimary" style={styles.notes}>{releaseNotes || 'A new version is available.'}</AppText>
          </View>
          <View style={styles.actions}>
            {!force && (
              <TouchableOpacity
                style={[styles.button, styles.secondary]}
                onPress={handleSkip}
              >
                <AppText variant="body" weight="regular" color="textprimary">Later</AppText>
              </TouchableOpacity>
            )}
            
            <Button
              variant="primary"
              onPress={handleUpdateNow}
              title="Update now"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  container: {
    width: '100%',
    borderRadius: 12,
    backgroundColor: '#fff',
    padding: 16,
  },
  title: {
    marginBottom: 8,
  },
  notesContainer: {
    maxHeight: 260,
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  secondary: {
    backgroundColor: '#f0f0f0',
  },
  primary: {
    backgroundColor: colors.primary.main,
  },
  secondaryText: {
    color: '#111827',
    fontWeight: '600',
  },
  primaryText: {
    color: '#fff',
    fontWeight: '600',
  },
  notes: {
    // marginBottom: 16,
  },
});

export default UpdateModal;



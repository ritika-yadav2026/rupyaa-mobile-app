import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { colors, spacing, radius } from '@/src/theme';
import { AppText } from '../AppText';
import { Card } from '../Card';

interface TestimonialCardProps {
  /** User's quote/testimonial text */
  quote: string;
  /** User's name */
  userName: string;
  /** User's role/occupation */
  userRole: string;
  /** Optional profile image source */
  profileImage?: number;
  /** Whether card starts expanded */
  defaultExpanded?: boolean;
}

export function TestimonialCard({
  quote,
  userName,
  userRole,
  profileImage,
  defaultExpanded = false,
}: TestimonialCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <Card padding="medium" shadow="none" bordered onPress={() => setExpanded(!expanded)} style={styles.card}>
      <TouchableOpacity
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.8}
        style={styles.touchable}
      >
        <View style={styles.header}>
          <View style={styles.avatar}>
            {profileImage ? (
              <Image
                source={profileImage}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <AppText variant="body" weight="semiBold" color="textprimary" style={styles.avatarText}>
                {userName.charAt(0)}
              </AppText>
            )}
          </View>
          <View style={styles.userInfo}>
            <AppText variant="body" weight="semiBold" color="textprimary" style={styles.userName}>
              {userName}
            </AppText>
            <AppText variant="caption" color="textprimary">
              {userRole}
            </AppText>
          </View>
          {expanded ? (
            <ChevronUp size={20} color={colors.text.secondary} />
          ) : (
            <ChevronDown size={20} color={colors.text.secondary} />
          )}
        </View>
        {expanded && quote ? (
          <AppText variant="caption" color="textprimary" style={styles.quote}>
            {quote}
          </AppText>
        ) : null}
      </TouchableOpacity>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.sm,
  },
  touchable: {
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    color: colors.text.secondary,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: colors.text.primary,
    marginBottom: 2,
  },
  quote: {
    marginTop: spacing.sm,
    paddingLeft: 56,
    lineHeight: 20,
  },
});

import React, { useRef, useState, type ComponentType } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, radius } from '@/src/theme';
import { onboardingSlides } from '@/src/data/mock';
import {
  AppText,
  RupyaaLogo,
} from '@/src/components';
import {
  OnboardingApplyStepsIllustration,
  OnboardingLoanOfferIllustration,
  OnboardingApprovalBankIllustration,
} from '@/src/components/onboarding';
import type { OnboardingSlide } from '@/src/types';
import { useLocaleStore } from '@/src/store/useLocaleStore';
import { appConfig } from '@/src/config/appConfig';
import { storageService } from '@/src/services/storage';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const ILLUSTRATION_SIZE = Math.min(SCREEN_WIDTH * 0.84, SCREEN_HEIGHT * 0.42);

interface OnboardingIllustrationProps {
  size?: number;
}

const ONBOARDING_ILLUSTRATIONS: Record<
  string,
  ComponentType<OnboardingIllustrationProps>
> = {
  ONBOARDING_APPLY_STEPS: OnboardingApplyStepsIllustration,
  ONBOARDING_LOAN_OFFER: OnboardingLoanOfferIllustration,
  ONBOARDING_APPROVAL_BANK: OnboardingApprovalBankIllustration,
};

export default function OnboardingScreen() {
  const isHindi = useLocaleStore((state) => state.isHindi);
  const router = useRouter();
  const flatListRef = useRef<FlatList<OnboardingSlide>>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);

  if (!appConfig.enableOnboarding) {
    return <Redirect href="/auth/mobile-verification" />;
  }

  const currentSlide = onboardingSlides[currentIndex];
  const isLastSlide = currentIndex === onboardingSlides.length - 1;

  const handleGetStarted = async () => {
    if (isCompleting) {
      return;
    }
    setIsCompleting(true);
    try {
      await storageService.setKey('hasSeenOnboarding', 'true');
      router.replace('/auth/mobile-verification');
    } catch {
      setIsCompleting(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < onboardingSlides.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
      return;
    }
    void handleGetStarted();
  };

  const handleSkip = () => {
    void handleGetStarted();
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / SCREEN_WIDTH);
    setCurrentIndex(index);
  };

  const getIllustration = (
    slide: OnboardingSlide,
  ): ComponentType<OnboardingIllustrationProps> => {
    if (slide.image && ONBOARDING_ILLUSTRATIONS[slide.image]) {
      return ONBOARDING_ILLUSTRATIONS[slide.image];
    }
    return OnboardingApplyStepsIllustration;
  };

  const renderSlide = ({ item }: { item: OnboardingSlide }) => {
    const Illustration = getIllustration(item);
    return (
      <View style={styles.slide}>
        <View style={styles.illustrationContainer}>
          <Illustration size={ILLUSTRATION_SIZE} />
        </View>
      </View>
    );
  };

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {onboardingSlides.map((_, index) => (
        <View
          key={index}
          style={[styles.dot, index === currentIndex && styles.dotActive]}
        />
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        pointerEvents="none"
        colors={[
          colors.primary.main,
          colors.primary.opacity40,
          colors.primary.lightest,
          colors.background.primary,
        ]}
        locations={[0, 0.28, 0.52, 0.72]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <RupyaaLogo size="sm" />
          {!isLastSlide ? (
            <TouchableOpacity
              onPress={handleSkip}
              style={styles.skipButton}
              accessibilityLabel="Skip onboarding"
              accessibilityRole="button"
              disabled={isCompleting}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <AppText variant="body" weight="medium" style={styles.skipText}>
                Skip
              </AppText>
            </TouchableOpacity>
          ) : (
            <View style={styles.skipPlaceholder} />
          )}
        </View>

        <FlatList
          ref={flatListRef}
          data={onboardingSlides}
          renderItem={renderSlide}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          keyExtractor={(item) => item.id}
          style={styles.carousel}
        />

        <View style={styles.bottomCard}>
          <AppText
            variant={isHindi ? 'h4' : 'h3'}
            weight="bold"
            style={styles.title}
          >
            {currentSlide.title}
          </AppText>
          {currentSlide.description ? (
            <AppText variant="body" weight="regular" style={styles.description}>
              {currentSlide.description}
            </AppText>
          ) : null}

          <View style={styles.footer}>
            {renderDots()}
            {isLastSlide ? (
              <TouchableOpacity
                onPress={handleGetStarted}
                style={styles.getStartedButton}
                accessibilityLabel="Get Started"
                accessibilityRole="button"
                disabled={isCompleting}
                activeOpacity={0.8}
              >
                <AppText weight="semiBold" style={styles.getStartedText}>
                  Get Started
                </AppText>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={handleNext}
                style={styles.nextButton}
                accessibilityLabel="Next slide"
                accessibilityRole="button"
                disabled={isCompleting}
                activeOpacity={0.8}
              >
                <AppText weight="semiBold" style={styles.nextButtonText}>
                  Next
                </AppText>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
    marginTop: spacing.md,
  },
  skipButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  skipPlaceholder: {
    width: spacing['4xl'],
  },
  skipText: {
    color: colors.text.secondary,
  },
  carousel: {
    flex: 1,
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  illustrationContainer: {
    width: ILLUSTRATION_SIZE,
    height: ILLUSTRATION_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomCard: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: spacing['2xl'],
    borderTopRightRadius: spacing['2xl'],
    paddingHorizontal: spacing.xl,
    paddingTop: spacing['2xl'],
    paddingBottom: spacing.lg,
  },
  title: {
    color: colors.text.black,
    textAlign: 'left',
    marginBottom: spacing.md,
    lineHeight: typography.fontSize['2xl'] * typography.lineHeight.tight,
  },
  description: {
    color: colors.text.secondary,
    textAlign: 'left',
    lineHeight: typography.fontSize.base * typography.lineHeight.normal,
    marginBottom: spacing['2xl'],
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 48,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.primary.main,
  },
  dotActive: {
    width: 28,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.text.black,
  },
  nextButton: {
    backgroundColor: colors.text.black,
    borderRadius: radius.full,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing['2xl'],
    minWidth: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    color: colors.primary.main,
    fontSize: typography.fontSize.base,
  },
  getStartedButton: {
    backgroundColor: colors.text.black,
    borderRadius: radius.full,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 1,
  },
  getStartedText: {
    color: colors.primary.main,
    fontSize: typography.fontSize.base,
  },
});

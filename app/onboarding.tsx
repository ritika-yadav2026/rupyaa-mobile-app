import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/src/constants/data';
import { colors, spacing, typography } from '@/src/theme';
import { onboardingSlides } from '@/src/data/mock';
import { IMAGES } from '@/src/constants/images';
import { Button, AppText } from '@/src/components';
import { ArrowRightIcon } from '@/src/components/icons';
import type { OnboardingSlide } from '@/src/types';
import { useLocaleStore } from '@/src/store/useLocaleStore';
import { appConfig } from '@/src/config/appConfig';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
// ~58% of screen height gives enough room for illustration without crowding the title
const ILLUSTRATION_HEIGHT = Math.round(SCREEN_HEIGHT * 0.58);

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const isHindi = useLocaleStore((state) => state.isHindi);
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!appConfig.enableOnboarding) {
    return <Redirect href="/auth/mobile-verification" />;
  }

  const isLastSlide = currentIndex === onboardingSlides.length - 1;

  const handleNext = () => {
    if (currentIndex < onboardingSlides.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      handleGetStarted();
    }
  };

  const handleSkip = () => {
    handleGetStarted();
  };

  const handleGetStarted = async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.hasSeenOnboarding, 'true');
    router.replace('/auth/mobile-verification');
  };

  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / SCREEN_WIDTH);
    setCurrentIndex(index);
  };

  const getIllustration = (slide: OnboardingSlide) => {
    if (slide.id === '2') return IMAGES.ILLUSTRATION_TWO;
    if (slide.id === '3') return IMAGES.ILLUSTRATION_THREE;
    return IMAGES.ILLUSTRATION_ONE;
  };

  /**
   * Splits the title into normal + highlighted parts so the highlighted
   * substring can be rendered in the primary green color.
   */
  const renderTitle = (slide: OnboardingSlide) => {
    const title = t(slide.title);
    const titleHighlight = slide.titleHighlight ? t(slide.titleHighlight) : slide.titleHighlight;

    if (!titleHighlight) {
      return <AppText style={styles.title}>{title}</AppText>;
    }

    // Translated title may not contain the (also-translated) highlight substring at the
    // same position — falls back to the whole title with no accent styling rather than crashing.
    const splitIndex = title.indexOf(titleHighlight);
    if (splitIndex === -1) {
      return <AppText style={styles.title}>{title}</AppText>;
    }

    const before = title.slice(0, splitIndex);
    const after = title.slice(splitIndex + titleHighlight.length);

    return (
      <AppText variant={isHindi ? 'h4' : 'h3'} weight='semiBold' style={styles.title}>
        {before}
        <AppText variant={isHindi ? 'h4' : 'h3'} color='primary' weight='semiBold' style={styles.titleHighlight}>{titleHighlight}</AppText>
        {after}
      </AppText>
    );
  };

  const renderSlide = ({ item }: { item: OnboardingSlide }) => (
    <View style={styles.slide}>
      <View style={styles.illustrationContainer}>
        <Image
          source={getIllustration(item)}
          style={styles.illustration}
          resizeMode="contain"
        />
      </View>

      <View style={styles.contentContainer}>
        {renderTitle(item)}
        {item.description ? (
          <AppText variant='body' weight='regular' color='tertiary' style={styles.description}>{item.description}</AppText>
        ) : null}
      </View>
    </View>
  );

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
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Skip button — top-right overlay, hidden on the last slide */}
      {!isLastSlide && (
        <TouchableOpacity
          onPress={handleSkip}
          style={styles.skipButton}
          accessibilityLabel="Skip onboarding"
          accessibilityRole="button"
        >
          <AppText style={styles.skipText}>Skip</AppText>
        </TouchableOpacity>
      )}

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
      />

      {/* Bottom bar: dots left, next/continue right */}
      <View style={styles.footer}>
        {isLastSlide ? (
          <Button
            variant="primary"
            size="large"
            fullWidth
            onPress={handleGetStarted}
          >
            Continue
          </Button>
        ) : (
          <>
            {renderDots()}
            <TouchableOpacity
              onPress={handleNext}
              style={styles.nextButton}
              accessibilityLabel="Next slide"
              accessibilityRole="button"
            >
              <ArrowRightIcon size={24} color={colors.primary.contrast} />
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.transparent,
  },
  skipButton: {
    position: 'absolute',
    top: spacing['4xl'],
    right: spacing.xl,
    zIndex: 10,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  skipText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium as any,
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
  },
  illustrationContainer: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: ILLUSTRATION_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  illustration: {
    width: SCREEN_WIDTH,
    height: ILLUSTRATION_HEIGHT,
  },
  contentContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing['2xl'],
    paddingTop: spacing.lg,
  },
  title: {
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  titleHighlight: {
    color: colors.primary.light,
  },
  description: {
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center', 
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    paddingTop: spacing.sm,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border.light,
    marginRight: 6,
  },
  dotActive: {
    backgroundColor: colors.primary.main,
    width: 24,
    borderRadius: 4,
  },
  nextButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

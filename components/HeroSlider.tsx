// components/HeroSlider.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import PagerView from 'react-native-pager-view';

Dimensions.get('window');

interface HeroSlide {
  id: number;
  title: string;
  subtitle: string;
  backgroundColor: string;
  icon?: string; // Made optional since we now have images
  imageUrl?: string; // URL for remote images
  imageAsset?: ImageSourcePropType; // For local assets
  imageStyle?: 'background' | 'overlay' | 'icon'; // How to display the image
}

const HeroSlider: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const pagerRef = useRef<PagerView>(null);

  // Hero slides data with image support
  const slides: HeroSlide[] = [
    {
  id: 11,
  title: "SPREAD THE LOVE",
  subtitle: "Be the light in someone's darkness",
  backgroundColor: "#5a82d4",
  imageAsset: require('../assets/images/banner.jpeg'),
  imageStyle: "background"
},
    {
      id: 1,
      title: "SHARE JESUS TODAY",
      subtitle: "Just tell someone Jesus Loves You!",
      backgroundColor: "#4472C4",
      icon: "✝️",
      // Example with URL image as background
      // imageUrl: "https://example.com/cross-image.jpg",
      // imageStyle: "background"
    },
    {
      id: 2,
      title: "SPREAD THE LOVE",
      subtitle: "Be the light in someone's darkness",
      backgroundColor: "#5a82d4",
      icon: "💝",
      // Example with local asset as overlay
      // imageAsset: require('../assets/images/heart.png'),
      // imageStyle: "overlay"
    },
    {
      id: 3,
      title: "FAITH IN ACTION",
      subtitle: "Small acts of kindness, big impact",
      backgroundColor: "#365a96",
      icon: "🙏",
      // Example with URL image as icon replacement
      // imageUrl: "https://example.com/hands-praying.jpg",
      // imageStyle: "icon"
    },
    {
      id: 4,
      title: "CONNECT & INSPIRE",
      subtitle: "Share your testimony with the world",
      backgroundColor: "#4472C4",
      icon: "🌟",
      // Example with local asset as background
      // imageAsset: require('../assets/images/stars-bg.jpg'),
      // imageStyle: "background"
    }
  ];

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlay) return;

    const interval = setInterval(() => {
      setCurrentPage((prev) => {
        const nextPage = (prev + 1) % slides.length;
        pagerRef.current?.setPage(nextPage);
        return nextPage;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [isAutoPlay, slides.length]);

  const handlePageSelected = (event: any) => {
    setCurrentPage(event.nativeEvent.position);
  };

  const goToPage = (page: number) => {
    pagerRef.current?.setPage(page);
    setCurrentPage(page);
  };

  const toggleAutoPlay = () => {
    setIsAutoPlay(!isAutoPlay);
  };

  const renderSlideContent = (slide: HeroSlide) => {
    const hasImage = slide.imageUrl || slide.imageAsset;
    const imageSource = slide.imageUrl ? { uri: slide.imageUrl } : slide.imageAsset;

    return (
      <View style={[heroSliderStyles.slide, { backgroundColor: slide.backgroundColor }]}>
        {/* Background Image */}
        {hasImage && slide.imageStyle === 'background' && (
          <Image
            source={imageSource!}
            style={heroSliderStyles.backgroundImage}
            resizeMode="cover"
          />
        )}
        
        {/* Overlay for background images to ensure text readability */}
        {hasImage && slide.imageStyle === 'background' && (
          <View style={heroSliderStyles.overlay} />
        )}

        {/* Content Container */}
        <View style={heroSliderStyles.contentContainer}>
          {/* Icon or Icon Image */}
          {hasImage && slide.imageStyle === 'icon' ? (
            <Image
              source={imageSource!}
              style={heroSliderStyles.iconImage}
              resizeMode="contain"
            />
          ) : slide.icon ? (
            <Text style={heroSliderStyles.slideIcon}>{slide.icon}</Text>
          ) : null}

          <Text style={heroSliderStyles.slideTitle}>{slide.title}</Text>
          <Text style={heroSliderStyles.slideSubtitle}>{slide.subtitle}</Text>
        </View>

        {/* Overlay Image */}
        {hasImage && slide.imageStyle === 'overlay' && (
          <Image
            source={imageSource!}
            style={heroSliderStyles.overlayImage}
            resizeMode="contain"
          />
        )}
      </View>
    );
  };

  return (
    <View style={heroSliderStyles.container}>
      <PagerView
        ref={pagerRef}
        style={heroSliderStyles.pagerView}
        initialPage={0}
        onPageSelected={handlePageSelected}
      >
        {slides.map((slide) => (
          <View key={slide.id.toString()}>
            {renderSlideContent(slide)}
          </View>
        ))}
      </PagerView>

      {/* Play/Pause Button */}
      <TouchableOpacity
        style={heroSliderStyles.playPauseBtn}
        onPress={toggleAutoPlay}
        activeOpacity={0.7}
      >
        <Text style={heroSliderStyles.playPauseText}>
          {isAutoPlay ? '⏸' : '▶'}
        </Text>
      </TouchableOpacity>

      {/* Pagination Dots */}
      <View style={heroSliderStyles.paginationContainer}>
        {slides.map((_, index) => (
          <TouchableOpacity
            key={index}
            style={[
              heroSliderStyles.paginationDot,
              index === currentPage && heroSliderStyles.activePaginationDot
            ]}
            onPress={() => goToPage(index)}
            activeOpacity={0.7}
          />
        ))}
      </View>

      {/* Progress Indicator */}
      <View style={heroSliderStyles.progressContainer}>
        <View 
          style={[
            heroSliderStyles.progressBar,
            { width: `${((currentPage + 1) / slides.length) * 100}%` }
          ]}
        />
      </View>
    </View>
  );
};

// Enhanced styles with image support
const heroSliderStyles = StyleSheet.create({
  container: {
    height: 350,
    marginBottom: 30,
    position: 'relative',
  },
  pagerView: {
    flex: 1,
  },
  slide: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // Dark overlay for text readability
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
    zIndex: 2,
  },
  slideIcon: {
    fontSize: 48,
    marginBottom: 15,
    textAlign: 'center',
  },
  iconImage: {
    width: 48,
    height: 48,
    marginBottom: 15,
    tintColor: 'white', // Optional: apply tint to match theme
  },
  overlayImage: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 60,
    height: 60,
    opacity: 0.8,
    zIndex: 1,
  },
  slideTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  slideSubtitle: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: 22,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  playPauseBtn: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  playPauseText: {
    color: 'white',
    fontSize: 16,
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },
  paginationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: 6,
  },
  activePaginationDot: {
    backgroundColor: 'white',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  progressContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    zIndex: 3,
  },
  progressBar: {
    height: '100%',
    backgroundColor: 'white',
  },
});

export default HeroSlider;

/*
Usage Examples:

1. With URL image as background:
{
  id: 1,
  title: "SHARE JESUS TODAY",
  subtitle: "Just tell someone Jesus Loves You!",
  backgroundColor: "#4472C4",
  imageUrl: "https://example.com/cross-background.jpg",
  imageStyle: "background"
}

2. With local asset as icon:
{
  id: 2,
  title: "SPREAD THE LOVE",
  subtitle: "Be the light in someone's darkness",
  backgroundColor: "#5a82d4",
  imageAsset: require('../assets/images/heart-icon.png'),
  imageStyle: "icon"
}

3. With URL image as overlay:
{
  id: 3,
  title: "FAITH IN ACTION",
  subtitle: "Small acts of kindness, big impact",
  backgroundColor: "#365a96",
  imageUrl: "https://example.com/praying-hands.png",
  imageStyle: "overlay"
}

4. With local asset as background:
{
  id: 4,
  title: "CONNECT & INSPIRE",
  subtitle: "Share your testimony with the world",
  backgroundColor: "#4472C4",
  imageAsset: require('../assets/images/church-background.jpg'),
  imageStyle: "background"
}

Image Style Options:
- "background": Image covers the entire slide as background
- "overlay": Image appears as a decorative overlay (top-right corner)
- "icon": Image replaces the emoji icon in the center

Notes:
- Background images include a dark overlay for text readability
- Text has shadow effects when images are used
- Images can be mixed with traditional emoji icons
- All images are optional - slides work with or without them
*/
// components/HomeComponents.tsx
import React from 'react';
import {
  ActivityIndicator,
  Image,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { type Video as VideoType } from '../services/apiService';
import { homeStyles } from '../styles/HomeStyles';
import HeroSlider from './HeroSlider';

// Props interfaces
interface VideoCardProps {
  video: VideoType;
  onPress: (video: VideoType) => void;
}

interface PlayButtonProps {
  onPress: () => void;
}

interface LoadingStateProps {
  text: string;
}

interface EmptyStateProps {
  text: string;
  onRetry?: () => void;
}

interface VideoModalProps {
  visible: boolean;
  video: VideoType | null;
  isLoading: boolean;
  onClose: () => void;
  onVideoLoad: () => void;
  onVideoError: (error: any) => void;
  onPlaybackStatusUpdate: (status: any) => void;
}

// Logo Component
export const LogoIcon = () => (
  <View >
    <Image source={require('../assets/images/logo.png')} style={{ width: 300, height:200 }} />
  </View>
);

// Loading State Component
export const LoadingState: React.FC<LoadingStateProps> = ({ text }) => (
  <View style={homeStyles.loadingContainer}>
    <ActivityIndicator size="large" color="#4472C4" />
    <Text style={homeStyles.loadingText}>{text}</Text>
  </View>
);

// Empty State Component
export const EmptyState: React.FC<EmptyStateProps> = ({ text, onRetry }) => (
  <View style={homeStyles.emptyContainer}>
    <Text style={homeStyles.emptyText}>{text}</Text>
    {onRetry && (
      <TouchableOpacity style={homeStyles.retryButton} onPress={onRetry}>
        <Text style={homeStyles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    )}
  </View>
);

// Navigation Icons
export const HomeIcon = () => (
  <View style={homeStyles.navIcon}>
    <View style={[homeStyles.iconRect, { width: 16, height: 10, marginBottom: 2 }]} />
    <View style={[homeStyles.iconRect, { width: 12, height: 8 }]} />
  </View>
);

export const MenuIcon = () => (
  <View style={homeStyles.navIcon}>
    <View style={[homeStyles.iconDot, { marginBottom: 3 }]} />
    <View style={[homeStyles.iconDot, { marginBottom: 3 }]} />
    <View style={homeStyles.iconDot} />
  </View>
);



// Header Section Component
export const HeaderSection: React.FC<{
  onSearchProfiles: () => void;
  onPostVideo: () => void;
 
}> = ({ onSearchProfiles, onPostVideo}) => (
  <View style={homeStyles.header}>
    <View style={homeStyles.logo}>
      <LogoIcon />
      {/* <Text style={homeStyles.appTitle}>SHARE JESUS</Text>
      <Text style={homeStyles.appSubtitle}>Today</Text> */}
    </View>

    <View style={homeStyles.mainButtons}>
      {/* <TouchableOpacity style={homeStyles.actionButton} onPress={onSearchProfiles}>
        <Text style={homeStyles.actionButtonText}>SEARCH PROFILES</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={homeStyles.actionButton} onPress={onPostVideo}>
        <Text style={homeStyles.actionButtonText}>POST VIDEO</Text>
      </TouchableOpacity> */}
      
      {/* <TouchableOpacity style={homeStyles.actionButton} onPress={onWatchVideos}>
        <Text style={homeStyles.actionButtonText}>WATCH VIDEOS</Text>
      </TouchableOpacity> */}
    </View>
  </View>
);

// Hero Section Component
export const HeroSection = () => (
  <HeroSlider />
);

// Bottom Navigation Component


// Floating Action Button Component
export const FloatingActionButton: React.FC<{
  onPress: () => void;
}> = ({ onPress }) => (
  <TouchableOpacity style={homeStyles.floatingButton} onPress={onPress}>
    <Text style={homeStyles.floatingButtonText}>+</Text>
  </TouchableOpacity>
);
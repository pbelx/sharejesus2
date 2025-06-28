// components/video/VideoModal.tsx
import { VideoView, useVideoPlayer } from 'expo-video';
import React from 'react';
import {
  ActivityIndicator,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { GestureHandlerRootView, PanGestureHandler, PanGestureHandlerGestureEvent, State } from 'react-native-gesture-handler';
import { type Video as VideoType } from '../../services/apiService';
import { videoStyles } from '../../styles/VideoStyles';

interface VideoModalProps {
  visible: boolean;
  video: VideoType | null;
  isLoading: boolean;
  onClose: () => void;
  onVideoLoad: () => void;
  onVideoError: (error: any) => void;
  onPlaybackStatusUpdate: (status: any) => void;
  // New props for navigation
  videoList: VideoType[];
  currentVideoIndex: number;
  onNextVideo: () => void;
  onPreviousVideo: () => void;
}

export const VideoModal: React.FC<VideoModalProps> = ({
  visible,
  video,
  isLoading,
  onClose,
  onVideoLoad,
  onVideoError,
  onPlaybackStatusUpdate,
  videoList,
  currentVideoIndex,
  onNextVideo,
  onPreviousVideo,
}) => {
  // Don't initialize player until modal is actually visible
  const [shouldInitializePlayer, setShouldInitializePlayer] = React.useState(false);
  
  // Only initialize the video player when modal is visible and we have a video
  const player = useVideoPlayer(
    shouldInitializePlayer && video?.url ? video.url : null,
    player => {
      if (player) {
        player.loop = false;
      }
    }
  );

  // Ref to track component mounting status
  const isMountedRef = React.useRef(true);
  const hasInitializedRef = React.useRef(false);

  React.useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Handle modal visibility changes
  React.useEffect(() => {
    if (visible && video?.url && !hasInitializedRef.current) {
      setShouldInitializePlayer(true);
      hasInitializedRef.current = true;
    } else if (!visible) {
      setShouldInitializePlayer(false);
      hasInitializedRef.current = false;
    }
  }, [visible, video?.url]);

  // Handle player controls
  React.useEffect(() => {
    if (!isMountedRef.current || !player || !shouldInitializePlayer) return;

    const timer = setTimeout(() => {
      try {
        if (visible && video?.url) {
          player.play();
        } else if (player.status !== 'error' && typeof player.pause === 'function') {
          player.pause();
        }
      } catch (error) {
        console.log('Player control error (safe to ignore):', error);
      }
    }, 100); // Small delay to ensure player is ready

    return () => clearTimeout(timer);
  }, [visible, player, video?.url, shouldInitializePlayer]);

  // Handle player status updates
  React.useEffect(() => {
    if (!isMountedRef.current || !player || !shouldInitializePlayer || !video?.url) return;

    try {
      const status = {
        status: player.status,
        currentTime: player.currentTime,
        duration: player.duration,
        isPlaying: player.playing,
      };
      onPlaybackStatusUpdate(status);

      if (player.status === 'readyToPlay') {
        onVideoLoad();
      } else if (player.status === 'error') {
        onVideoError('Video failed to load');
      }
    } catch (error) {
      console.log('Player status error (safe to ignore):', error);
    }
  }, [player, player?.status, player?.currentTime, player?.duration, player?.playing, onPlaybackStatusUpdate, onVideoLoad, onVideoError, video?.url, shouldInitializePlayer]);

  // Gesture handler for swipe navigation
  const onSwipeGestureEvent = (event: PanGestureHandlerGestureEvent) => {
    const { translationX, velocityX } = event.nativeEvent;
    
    // Check if it's a significant horizontal swipe
    if (Math.abs(translationX) > 50 || Math.abs(velocityX) > 500) {
      if (translationX > 0 && velocityX > 0) {
        // Swipe right - go to previous video
        if (currentVideoIndex > 0) {
          onPreviousVideo();
        }
      } else if (translationX < 0 && velocityX < 0) {
        // Swipe left - go to next video
        if (currentVideoIndex < videoList.length - 1) {
          onNextVideo();
        }
      }
    }
  };

  const onSwipeHandlerStateChange = (event: PanGestureHandlerGestureEvent) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX, velocityX } = event.nativeEvent;
      
      // Threshold for swipe detection
      const swipeThreshold = 100;
      const velocityThreshold = 800;
      
      if (
        Math.abs(translationX) > swipeThreshold || 
        Math.abs(velocityX) > velocityThreshold
      ) {
        if (translationX > 0) {
          // Swipe right - previous video
          if (currentVideoIndex > 0) {
            onPreviousVideo();
          }
        } else {
          // Swipe left - next video  
          if (currentVideoIndex < videoList.length - 1) {
            onNextVideo();
          }
        }
      }
    }
  };

  // Don't render modal content if no video
  if (!video) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={videoStyles.modalContainer}>
          <View style={videoStyles.modalHeader}>
            <Text style={videoStyles.modalTitle} numberOfLines={2}>
              {video?.title || 'Video Player'}
            </Text>
            <View style={videoStyles.headerControls}>
              {/* Navigation indicators */}
              <Text style={videoStyles.videoCounter}>
                {currentVideoIndex + 1} of {videoList.length}
              </Text>
              <TouchableOpacity style={videoStyles.closeButton} onPress={onClose}>
                <Text style={videoStyles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <PanGestureHandler
            onGestureEvent={onSwipeGestureEvent}
            onHandlerStateChange={onSwipeHandlerStateChange}
            activeOffsetX={[-10, 10]}
            failOffsetY={[-5, 5]}
          >
            <View style={videoStyles.videoPlayerContainer}>
              {(isLoading || (player && player.status === 'loading')) && (
                <View style={videoStyles.videoLoadingContainer}>
                  <ActivityIndicator size="large" color="#4472C4" />
                  <Text style={videoStyles.videoLoadingText}>Loading video...</Text>
                </View>
              )}
              
              {shouldInitializePlayer && video?.url && player && (
                <VideoView
                  key={`video-${video.id}-${visible}`} // Force re-render when video changes
                  player={player}
                  style={videoStyles.videoPlayer}
                  allowsFullscreen
                  allowsPictureInPicture
                  nativeControls
                />
              )}
              
              {/* Navigation arrows overlay */}
              {currentVideoIndex > 0 && (
                <TouchableOpacity 
                  style={videoStyles.navigationArrowLeft}
                  onPress={onPreviousVideo}
                >
                  <Text style={videoStyles.navigationArrowText}>‹</Text>
                </TouchableOpacity>
              )}
              
              {currentVideoIndex < videoList.length - 1 && (
                <TouchableOpacity 
                  style={videoStyles.navigationArrowRight}
                  onPress={onNextVideo}
                >
                  <Text style={videoStyles.navigationArrowText}>›</Text>
                </TouchableOpacity>
              )}
            </View>
          </PanGestureHandler>
          
          <View style={videoStyles.videoDetails}>
            <Text style={videoStyles.videoDetailTitle}>{video?.title}</Text>
            <Text style={videoStyles.videoDetailAuthor}>
              By: {video?.uploader?.firstName} {video?.uploader?.lastName}
            </Text>
            <Text style={videoStyles.videoDetailDate}>
              {video && new Date(video.createdTimestamp).toLocaleDateString()}
            </Text>
            {video?.description && (
              <Text style={videoStyles.videoDescription}>{video.description}</Text>
            )}
            
            {/* Navigation buttons */}
            <View style={videoStyles.navigationControls}>
              <TouchableOpacity 
                style={[
                  videoStyles.navButton,
                  currentVideoIndex === 0 && videoStyles.navButtonDisabled
                ]}
                onPress={onPreviousVideo}
                disabled={currentVideoIndex === 0}
              >
                <Text style={[
                  videoStyles.navButtonText,
                  currentVideoIndex === 0 && videoStyles.navButtonTextDisabled
                ]}>
                  ← Previous
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  videoStyles.navButton,
                  currentVideoIndex === videoList.length - 1 && videoStyles.navButtonDisabled
                ]}
                onPress={onNextVideo}
                disabled={currentVideoIndex === videoList.length - 1}
              >
                <Text style={[
                  videoStyles.navButtonText,
                  currentVideoIndex === videoList.length - 1 && videoStyles.navButtonTextDisabled
                ]}>
                  Next →
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
};
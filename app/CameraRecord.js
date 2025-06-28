// CameraRecord.js - INTEGRATED WITH CAMERA SERVICE
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Button, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import cameraApiService from 'services/cameraApiService'; // Adjust path as needed

const CameraRecord = ({ onRecordingComplete, onCancel }) => {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();
  const [cameraType, setCameraType] = useState('back');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const cameraRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const isRecordingRef = useRef(false);
  const recordingPromiseRef = useRef(null);

  useEffect(() => {
    (async () => {
      if (!cameraPermission?.granted) {
        await requestCameraPermission();
      }
      if (!microphonePermission?.granted) {
        await requestMicrophonePermission();
      }
      
      // Initialize camera service and cleanup old temp files
      try {
        await cameraApiService.cleanupTempFiles();
        console.log('Camera service initialized and temp files cleaned');
      } catch (error) {
        console.warn('Camera service initialization warning:', error);
      }
    })();
  }, []);

  // Timer effect
  useEffect(() => {
    if (isRecording && isRecordingRef.current) {
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prevTime => {
          const newTime = prevTime + 1;
          // Auto-stop at 30 seconds
          if (newTime >= 30) {
            handleStopRecording();
          }
          return newTime;
        });
      }, 1000);
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }

    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    };
  }, [isRecording]);

  const handleFlipCamera = () => {
    setCameraType(current => current === 'back' ? 'front' : 'back');
  };

  const handleStartRecording = async () => {
    if (!cameraRef.current || isRecording || !isCameraReady || isRecordingRef.current || isProcessing) {
      console.log('Cannot start recording:', { 
        hasCamera: !!cameraRef.current, 
        isRecording, 
        isCameraReady,
        isRecordingRef: isRecordingRef.current,
        isProcessing 
      });
      return;
    }

    try {
      console.log('Starting video recording...');
      
      // Set recording state BEFORE starting recording
      setIsRecording(true);
      isRecordingRef.current = true;
      setRecordingTime(0);

      // Get camera settings from service (optional)
      const settingsResponse = await cameraApiService.getCameraSettings();
      let recordingOptions = {
        maxDuration: 30, // 30 seconds max
      };
      
      // Apply server settings if available
      if (settingsResponse.success && settingsResponse.data) {
        recordingOptions = {
          ...recordingOptions,
          ...settingsResponse.data.recordingOptions,
        };
      }

      console.log('Recording options:', recordingOptions);
      
      // Start recording and store the promise
      recordingPromiseRef.current = cameraRef.current.recordAsync(recordingOptions);
      
      // Wait for recording to complete (either by manual stop or timeout)
      const data = await recordingPromiseRef.current;
      
      console.log('Recording completed with data:', data);
      
      // Only process if we have valid data and haven't already processed
      if (data && data.uri && isRecordingRef.current) {
        await handleRecordingComplete(data);
      }
      
    } catch (error) {
      console.error('Failed to record video:', error);
      handleRecordingError(error);
    }
  };

  const handleStopRecording = async () => {
    if (!cameraRef.current || !isRecording || !isRecordingRef.current) {
      console.log('Cannot stop recording:', { 
        hasCamera: !!cameraRef.current, 
        isRecording,
        isRecordingRef: isRecordingRef.current 
      });
      return;
    }

    try {
      console.log('Stopping video recording...');
      
      // Stop the recording - this will resolve the promise in handleStartRecording
      await cameraRef.current.stopRecording();
      
    } catch (error) {
      console.error('Error stopping recording:', error);
      handleRecordingError(error);
    }
  };

  const handleRecordingComplete = async (data) => {
    console.log('Processing recording completion...');
    
    // Set processing state
    setIsProcessing(true);
    setProcessingStatus('Validating recording...');
    
    // Reset recording states
    setIsRecording(false);
    isRecordingRef.current = false;
    setRecordingTime(0);
    recordingPromiseRef.current = null;
    
    // Clear timer
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    
    if (!data || !data.uri) {
      console.error('Recording data is invalid:', data);
      setIsProcessing(false);
      setProcessingStatus('');
      Alert.alert('Recording Error', 'Failed to save the recorded video. Please try again.');
      onRecordingComplete(null);
      return;
    }

    try {
      const fileName = `video_${Date.now()}.mp4`;
      const fileType = 'video/mp4';
      
      const videoFile = {
        uri: data.uri,
        name: fileName,
        type: fileType
      };

      // Validate the recording using the camera service
      setProcessingStatus('Validating file...');
      const validationResponse = await cameraApiService.validateRecording(videoFile);
      
      if (!validationResponse.success) {
        console.error('Recording validation failed:', validationResponse.error);
        setIsProcessing(false);
        setProcessingStatus('');
        Alert.alert('Recording Error', validationResponse.error || 'Recording validation failed');
        onRecordingComplete(null);
        return;
      }

      console.log('Recording validated successfully:', validationResponse.data);

      // Save recording metadata to the service
      setProcessingStatus('Saving metadata...');
      const fileId = `rec_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      if (validationResponse.data) {
        const metadataResponse = await cameraApiService.saveRecordingMetadata(
          fileId,
          validationResponse.data
        );
        
        if (metadataResponse.success) {
          console.log('Metadata saved successfully');
        } else {
          console.warn('Failed to save metadata:', metadataResponse.error);
          // Don't fail the whole process, just log the warning
        }
      }

      // Upload session data for analytics
      setProcessingStatus('Saving session data...');
      const sessionData = {
        sessionId: fileId,
        recordingDuration: recordingTime,
        cameraType: cameraType,
        timestamp: new Date().toISOString(),
        platform: Platform.OS,
        quality: 'standard', // Could be dynamic based on settings
      };

      const sessionResponse = await cameraApiService.uploadSessionData(sessionData);
      if (sessionResponse.success) {
        console.log('Session data saved successfully');
      } else {
        console.warn('Failed to save session data:', sessionResponse.error);
      }

      // Prepare the complete file object with additional metadata
      const completeVideoFile = {
        ...videoFile,
        fileId: fileId,
        metadata: validationResponse.data,
        sessionData: sessionData,
      };

      setIsProcessing(false);
      setProcessingStatus('');
      
      console.log('Calling onRecordingComplete with:', completeVideoFile);
      onRecordingComplete(completeVideoFile);

    } catch (error) {
      console.error('Error processing recording:', error);
      setIsProcessing(false);
      setProcessingStatus('');
      Alert.alert('Processing Error', 'Failed to process the recorded video. Please try again.');
      onRecordingComplete(null);
    }
  };

  const handleRecordingError = (error) => {
    console.error('Recording error occurred:', error);
    
    // Reset all recording states
    setIsRecording(false);
    isRecordingRef.current = false;
    setRecordingTime(0);
    recordingPromiseRef.current = null;
    setIsProcessing(false);
    setProcessingStatus('');
    
    // Clear timer
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    
    // Show user-friendly error message
    let errorMessage = 'Failed to record video. Please try again.';
    
    if (error.message) {
      if (error.message.includes('stopped before any data')) {
        errorMessage = 'Recording was too short. Please record for at least 1 second.';
      } else if (error.message.includes('permission')) {
        errorMessage = 'Camera or microphone permission denied. Please check your permissions.';
      } else if (error.message.includes('busy') || error.message.includes('use')) {
        errorMessage = 'Camera is busy. Please close other camera apps and try again.';
      }
    }
    
    Alert.alert('Recording Error', errorMessage);
  };

  // Add cleanup on component unmount
  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (isRecordingRef.current && cameraRef.current) {
        try {
          cameraRef.current.stopRecording();
        } catch (e) {
          console.log('Cleanup recording stop error:', e);
        }
      }
    };
  }, []);

  // Permission checks
  if (!cameraPermission || !microphonePermission) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Requesting permissions...</Text>
      </View>
    );
  }

  if (!cameraPermission.granted || !microphonePermission.granted) {
    return (
      <View style={styles.permissionDeniedContainer}>
        <Text style={styles.permissionText}>
          Camera and microphone access are needed to record video.
        </Text>
        <View style={styles.buttonContainer}>
          <Button 
            title="Grant Permissions" 
            onPress={async () => {
              await requestCameraPermission();
              await requestMicrophonePermission();
            }} 
          />
          <View style={styles.buttonSpacer} />
          <Button title="Cancel" onPress={onCancel} color="#888" />
        </View>
      </View>
    );
  }

  // Format recordingTime into MM:SS
  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.cameraPreview}
        facing={cameraType}
        ref={cameraRef}
        mode="video"
        onCameraReady={() => {
          console.log('Camera is ready for video recording');
          setIsCameraReady(true);
        }}
        onMountError={(error) => {
          console.error('Camera mount error:', error);
          Alert.alert('Camera Error', 'Failed to initialize camera. Please try again.');
        }}
      />
      
      {/* Top Controls Overlay */}
      <View style={styles.topControlsOverlay} pointerEvents="box-none">
        <TouchableOpacity 
          style={styles.controlButton} 
          onPress={onCancel}
          disabled={isRecording || isProcessing}
        >
          <Ionicons 
            name="close" 
            size={30} 
            color={(isRecording || isProcessing) ? "#888" : "white"} 
          />
        </TouchableOpacity>
        
        {isRecording && (
          <View style={styles.timerContainer}>
            <Text style={styles.timerText}>
              {formatTime(recordingTime)} / 00:30
            </Text>
            <View style={styles.recordingIndicator} />
          </View>
        )}
        
        <TouchableOpacity 
          style={styles.controlButton} 
          onPress={handleFlipCamera}
          disabled={isRecording || isProcessing}
        >
          <Ionicons 
            name="camera-reverse" 
            size={30} 
            color={(isRecording || isProcessing) ? "#888" : "white"} 
          />
        </TouchableOpacity>
      </View>
      
      {/* Bottom Controls Overlay */}
      <View style={styles.bottomControlsOverlay} pointerEvents="box-none">
        <TouchableOpacity
          style={[
            styles.recordButton,
            isRecording ? styles.recordButtonRecording : {},
            (!isCameraReady || isProcessing) ? styles.recordButtonDisabled : {},
          ]}
          onPress={isRecording ? handleStopRecording : handleStartRecording}
          disabled={!isCameraReady || isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator size="large" color="white" />
          ) : (
            <Ionicons
              name={isRecording ? "stop-circle" : "radio-button-on"}
              size={70}
              color={isRecording ? "red" : "white"}
            />
          )}
        </TouchableOpacity>
        
        {(!isCameraReady || isProcessing) && (
          <Text style={styles.statusText}>
            {!isCameraReady ? 'Initializing camera...' : processingStatus}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  cameraPreview: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topControlsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 60,
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 10,
  },
  bottomControlsOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 50,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 10,
  },
  controlButton: {
    padding: 10,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  recordButton: {
    alignSelf: 'center',
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: 10,
    padding: 10,
  },
  recordButtonRecording: {
    backgroundColor: 'rgba(255,0,0,0.3)',
  },
  recordButtonDisabled: {
    opacity: 0.5,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  permissionDeniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'black',
  },
  permissionText: {
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 16,
    color: 'white',
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
  },
  buttonSpacer: {
    height: 10,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  timerText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  recordingIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'red',
  },
  statusText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
  },
});

export default CameraRecord;
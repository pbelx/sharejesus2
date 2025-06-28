import { Ionicons } from '@expo/vector-icons'; // For icons
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import React, { useEffect, useRef, useState } from 'react';
import { Button, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const CameraRecord = ({ onRecordingComplete, onCancel }) => {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();
  const [cameraType, setCameraType] = useState('back');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const cameraRef = useRef(null);
  const recordingTimerRef = useRef(null);

  useEffect(() => {
    (async () => {
      if (!cameraPermission?.granted) {
        await requestCameraPermission();
      }
      if (!microphonePermission?.granted) {
        await requestMicrophonePermission();
      }
    })();
  }, []);

  useEffect(() => {
    if (isRecording) {
      setRecordingTime(0); // Reset timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prevTime => prevTime + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
    return () => { // Cleanup timer on unmount or when isRecording changes
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, [isRecording]);


  const handleFlipCamera = () => {
    setCameraType(
      cameraType === 'back'
        ? 'front'
        : 'back'
    );
  };

  const handleStartRecording = async () => {
    if (cameraRef.current && !isRecording && isCameraReady) {
      setIsRecording(true);
      try {
        const data = await cameraRef.current.recordAsync({
          maxDuration: 30,
          quality: '720p',
          mute: false,
        });
        
        console.log('Video recorded:', data.uri);
        setIsRecording(false);
        
        // Construct a file name and type
        const fileName = `video_${Date.now()}.mp4`;
        const fileType = 'video/mp4';
        onRecordingComplete({ uri: data.uri, name: fileName, type: fileType });
      } catch (error) {
        console.error('Failed to record video', error);
        setIsRecording(false);
        // You might want to show an error message to the user here
      }
    }
  };

  const handleStopRecording = async () => {
    if (cameraRef.current && isRecording) {
      try {
        await cameraRef.current.stopRecording();
      } catch (error) {
        console.error('Error stopping recording:', error);
        setIsRecording(false);
      }
    }
  };

  if (!cameraPermission || !microphonePermission) {
    return <View><Text>Requesting permissions...</Text></View>;
  }
  if (!cameraPermission.granted || !microphonePermission.granted) {
    return (
        <View style={styles.permissionDeniedContainer}>
            <Text style={styles.permissionText}>Camera and microphone access are needed to record video.</Text>
            <Button title="Grant Permissions" onPress={async () => {
                 await requestCameraPermission();
                 await requestMicrophonePermission();
            }} />
            <Button title="Cancel" onPress={onCancel} color="#888" />
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
        ratio="16:9"
        onCameraReady={() => setIsCameraReady(true)}
      />
      {/* Overlay controls using absolute positioning */}
      <View style={styles.topControlsOverlay} pointerEvents="box-none">
        <TouchableOpacity style={styles.controlButton} onPress={onCancel}>
          <Ionicons name="close" size={30} color="white" />
        </TouchableOpacity>
        {isRecording && (
          <Text style={styles.timerText}>{formatTime(recordingTime)} / 00:30</Text>
        )}
        <TouchableOpacity style={styles.controlButton} onPress={handleFlipCamera}>
          <Ionicons name="camera-reverse" size={30} color="white" />
        </TouchableOpacity>
      </View>
      <View style={styles.bottomControlsOverlay} pointerEvents="box-none">
        <TouchableOpacity
          style={[
            styles.recordButton,
            isRecording ? styles.recordButtonRecording : {},
            recordingTime === 0 && isRecording ? styles.recordButtonDisabled : {},
          ]}
          onPress={
            isRecording && recordingTime === 0
              ? undefined
              : isRecording
              ? handleStopRecording
              : handleStartRecording
          }
          disabled={isRecording && recordingTime === 0 || !isCameraReady}
        >
          <Ionicons
            name={isRecording ? "stop-circle" : "radio-button-on"}
            size={70}
            color={isRecording ? "red" : "white"}
          />
        </TouchableOpacity>
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
    paddingTop: Platform.OS === 'android' ? 20 : 40,
    backgroundColor: 'rgba(0,0,0,0.2)',
    zIndex: 10,
  },
  bottomControlsOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    zIndex: 10,
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 20 : 40, // Adjust for status bar
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  bottomControls: {
    paddingBottom: 30,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  controlButton: {
    padding: 10,
  },
  recordButton: {
    alignSelf: 'center',
    // Basic styling, can be enhanced
  },
  recordButtonRecording: {
    // Style when recording, e.g. different color or animation
  },
  recordButtonDisabled: {
    opacity: 0.5,
  },
  permissionDeniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 16,
  },
  timerText: {
    color: 'white',
    fontSize: 18,
    alignSelf: 'center',
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 5,
  }
});

export default CameraRecord;
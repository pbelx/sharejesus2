import React, { useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CameraRecord from '../CameraRecord'; // Path to the new CameraRecord component
import VideoUpload, { VideoFileType } from '../VideoUpload'; // Import VideoUpload and its types

type PostMode = 'options' | 'upload' | 'record';

export default function PostVideoScreen() {
  const [mode, setMode] = useState<PostMode>('options');
  const [videoToUpload, setVideoToUpload] = useState<VideoFileType>(null);

  // Reminder: apiService.initializeAuthToken() should be called at app startup.

  const handleRecordingComplete = (videoFile: VideoFileType) => {
    if (videoFile) {
      setVideoToUpload(videoFile);
      setMode('upload'); // Switch to upload mode with the recorded file
    } else {
      // Handle case where recording didn't produce a file or was cancelled in a way that returns null
      setMode('options'); // Or stay in record mode with a message, depends on desired UX
    }
  };

  const handleUploadCancelled = () => {
    setVideoToUpload(null); // Clear any pending video
    setMode('options');
  };

  const handleUploadComplete = (uploadedVideoData?: any) => {
    setVideoToUpload(null);
    setMode('options');
    // You can handle the uploaded video data here if needed
    if (uploadedVideoData) {
      console.log('Video uploaded successfully:', uploadedVideoData);
    }
  };

  const renderContent = () => {
    switch (mode) {
      case 'options':
        return (
          <View style={styles.optionsContainer}>
            <Text style={styles.title}>Create a Post</Text>
            <View style={styles.buttonContainer}>
              <Button
                title="Upload Existing Video"
                onPress={() => {
                  setVideoToUpload(null);
                  setMode('upload');
                }}
              />
            </View>
            <View style={styles.buttonContainer}>
              <Button
                title="Record New Video"
                onPress={() => {
                  setVideoToUpload(null);
                  setMode('record');
                }}
              />
            </View>
          </View>
        );
      case 'upload':
        return (
          <View style={styles.fullScreenView}>
            <VideoUpload
              initialFile={videoToUpload}
              onUploadComplete={handleUploadComplete}
              onCancel={handleUploadCancelled}
            />
          </View>
        );
      case 'record':
        return (
          <View style={styles.fullScreenView}>
            <CameraRecord
              onRecordingComplete={handleRecordingComplete}
              onCancel={() => setMode('options')}
            />
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {renderContent()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenView: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  optionsContainer: {
    width: '80%',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  buttonContainer: {
    marginVertical: 10,
    width: '100%',
  },
});
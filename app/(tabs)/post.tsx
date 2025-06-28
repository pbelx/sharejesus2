import React, { useState, useEffect } from 'react';
import { View, Button, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import VideoUpload from '../../VideoUpload'; // Adjust path if VideoUpload.js is not in the root
import CameraRecord from '../../CameraRecord'; // Path to the new CameraRecord component

type PostMode = 'options' | 'upload' | 'record';
export type VideoFileType = { uri: string, name: string, type: string } | null;


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
  }

  const renderContent = () => {
    switch (mode) {
      case 'options':
        return (
          <View style={styles.optionsContainer}>
            <Text style={styles.title}>Create a Post</Text>
            <View style={styles.buttonContainer}>
              <Button title="Upload Existing Video" onPress={() => { setVideoToUpload(null); setMode('upload'); }} />
            </View>
            <View style={styles.buttonContainer}>
              <Button title="Record New Video" onPress={() => {setVideoToUpload(null); setMode('record')}} />
            </View>
          </View>
        );
      case 'upload':
        return (
          <View style={styles.fullScreenView}>
            {/* Pass a method to VideoUpload to allow it to signal cancellation/completion back to options */}
            <VideoUpload
                initialFile={videoToUpload}
                onUploadComplete={() => { setVideoToUpload(null); setMode('options');}}
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
    // padding: 20, // Keep padding if desired for options view, or manage per-view
  },
  fullScreenView: { // Used for upload and record to take full screen
    flex: 1,
    width: '100%',
    height: '100%',
  },
  optionsContainer: {
    width: '80%',
    alignItems: 'center',
    padding: 20, // Add padding here if container doesn't have it
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
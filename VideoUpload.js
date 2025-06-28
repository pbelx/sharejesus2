// VideoUpload.js - Updated to use VideoApiService
import * as DocumentPicker from 'expo-document-picker';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Button, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import videoApiService from 'services/videoApiService'; // Changed from apiService to videoApiService

const VideoUpload = ({ initialFile, onUploadComplete, onCancel }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (initialFile) {
      setSelectedFile(initialFile);
      const fileName = initialFile.name || 'Recorded Video';
      setMessage(`Selected: ${fileName}`);
      // Auto-populate name field with filename
      setName(fileName.replace(/\.[^/.]+$/, '')); // Remove extension
    }
  }, [initialFile]);

  const handleFilePick = async () => {
    if (initialFile) {
      setMessage("A recorded video is already selected. To choose another, please go back and select 'Upload Existing Video' again.");
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'video/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const videoFile = {
          uri: asset.uri,
          name: asset.name || `video-${Date.now()}.mp4`,
          type: asset.mimeType || 'video/mp4'
        };
        
        setSelectedFile(videoFile);
        setMessage(`Selected: ${videoFile.name}`);
        // Auto-populate name field with filename
        setName(videoFile.name.replace(/\.[^/.]+$/, ''));
      } else {
        if (!initialFile) setSelectedFile(null);
        setMessage(result.canceled ? 'File picking cancelled.' : 'No file selected.');
      }
    } catch (error) {
      console.error('Error picking document:', error);
      setMessage('Error picking file. Please try again.');
      if (!initialFile) setSelectedFile(null);
    }
  };

  const resetForm = (clearInitial = true) => {
    if (clearInitial || !initialFile) {
      setSelectedFile(null);
    }
    setTitle('');
    setCaption('');
    setName('');
    setMessage('');
  };

  const getFileExtension = (uri) => {
    try {
      const parts = uri.split('.');
      return parts.length > 1 ? parts[parts.length - 1] : 'mp4';
    } catch {
      return 'mp4';
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage('Please select or record a video file first.');
      return;
    }

    if (!title.trim()) {
      setMessage('Please enter a title for your video.');
      return;
    }

    if (!name.trim()) {
      setMessage('Please enter a name for your video.');
      return;
    }

    setIsLoading(true);
    setMessage('Uploading...');

    try {
      // Ensure we have a valid file name and extension
      const extension = getFileExtension(selectedFile.uri);
      const fileName = selectedFile.name || `video-${Date.now()}.${extension}`;

      const fileToUpload = {
        uri: selectedFile.uri,
        name: fileName,
        type: selectedFile.type || 'video/mp4',
      };

      const metadata = {
        name: name.trim(),
        title: title.trim(),
        caption: caption.trim(),
      };

      console.log('Uploading file:', fileToUpload);
      console.log('With metadata:', metadata);

      // Use videoApiService instead of apiService
      const response = await videoApiService.uploadVideo(fileToUpload, metadata);
      setIsLoading(false);

      if (response.success) {
        const videoId = response.data?.id || 'N/A';
        setMessage(`Upload successful! Video ID: ${videoId}`);
        resetForm();
        
        // Call onUploadComplete after a delay to show success message
        setTimeout(() => {
          if (onUploadComplete) {
            onUploadComplete();
          }
        }, 2000);
      } else {
        const errorMessage = response.error || 'Unknown error occurred';
        console.error('Upload failed:', errorMessage);
        setMessage(`Upload failed: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setIsLoading(false);
      
      // Provide more specific error messages
      if (error.message && error.message.includes('Network request failed')) {
        setMessage('Upload failed: Network connection error. Please check your internet connection.');
      } else if (error.message && error.message.includes('401')) {
        setMessage('Upload failed: Authentication error. Please login again.');
      } else if (error.message && error.message.includes('413')) {
        setMessage('Upload failed: File too large. Please select a smaller video file.');
      } else {
        setMessage('Upload failed: Network error or server unavailable');
      }
    }
  };

  const handleCancel = () => {
    resetForm();
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <View style={styles.scrollContainer}>
      <ScrollView 
        style={styles.scrollView}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          <Text style={styles.header}>
            {initialFile ? 'Upload Recorded Video' : 'Upload Video'}
          </Text>

          {/* File Selection Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Video File</Text>
            {!initialFile && (
              <Button 
                title="Select Video File" 
                onPress={handleFilePick}
                disabled={isLoading}
              />
            )}
            {message ? (
              <Text style={[
                styles.message, 
                message.includes('successful') ? styles.successMessage : 
                message.includes('failed') || message.includes('Error') ? styles.errorMessage : 
                styles.infoMessage
              ]}>
                {message}
              </Text>
            ) : null}
          </View>

          {/* Video Details Section */}
          {selectedFile && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Video Details</Text>
              
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Name *</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter video name"
                  editable={!isLoading}
                  maxLength={100}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Title *</Text>
                <TextInput
                  style={styles.input}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Enter video title"
                  editable={!isLoading}
                  maxLength={100}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Caption</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={caption}
                  onChangeText={setCaption}
                  placeholder="Enter video caption (optional)"
                  multiline
                  numberOfLines={3}
                  editable={!isLoading}
                  maxLength={500}
                />
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            {selectedFile && (
              <View style={styles.button}>
                {isLoading ? (
                  <ActivityIndicator size="large" color="#0000ff" />
                ) : (
                  <Button title="Upload Video" onPress={handleUpload} />
                )}
              </View>
            )}
            
            <View style={styles.button}>
              <Button 
                title="Cancel" 
                onPress={handleCancel} 
                color="#888" 
                disabled={isLoading}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  section: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 5,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    marginTop: 20,
  },
  button: {
    marginBottom: 10,
  },
  message: {
    marginTop: 10,
    padding: 10,
    borderRadius: 6,
    fontSize: 14,
  },
  successMessage: {
    backgroundColor: '#d4edda',
    borderColor: '#c3e6cb',
    color: '#155724',
  },
  errorMessage: {
    backgroundColor: '#f8d7da',
    borderColor: '#f5c6cb',
    color: '#721c24',
  },
  infoMessage: {
    backgroundColor: '#e2e3e5',
    borderColor: '#d6d8db',
    color: '#383d41',
  },
});

export default VideoUpload;
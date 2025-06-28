import * as DocumentPicker from 'expo-document-picker';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Button, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import apiService from 'services/apiService'; // Adjusted path

const VideoUpload = ({ initialFile, onUploadComplete, onCancel }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (initialFile) {
      setSelectedFile(initialFile);
      // Safe access to name property with fallback
      const fileName = initialFile.name || 'Recorded Video';
      setMessage(`Selected: ${fileName}`);
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
      } else {
        // Keep current selectedFile if cancel, unless it was from initialFile
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

      // Metadata for apiService.uploadVideo
      const metadata = {
        title: title.trim() || 'Untitled Video',
        caption: caption.trim(),
      };

      // Check authentication
      if (!apiService.getAuthToken()) {
        try {
          await apiService.initializeAuthToken();
          if (!apiService.getAuthToken()) {
            setMessage('User not authenticated. Please login.');
            setIsLoading(false);
            return;
          }
        } catch (authError) {
          console.error('Authentication error:', authError);
          setMessage('Authentication error. Please try logging in again.');
          setIsLoading(false);
          return;
        }
      }

      const response = await apiService.uploadVideo(fileToUpload, metadata);
      setIsLoading(false);

      if (response.success) {
        const videoId = response.data?.id || 'N/A';
        setMessage(`Upload successful! Video ID: ${videoId}`);
        resetForm();
        // Call onUploadComplete after a delay to show success message
        setTimeout(() => onUploadComplete(), 2000);
      } else {
        const errorMessage = response.error || 'Unknown error occurred';
        setMessage(`Upload failed: ${errorMessage}`);
        // Don't call onUploadComplete on failure
      }
    } catch (error) {
      console.error('Upload error:', error);
      setIsLoading(false);
      setMessage('Upload failed: Network error or server unavailable');
    }
  };

  const handleCancel = () => {
    resetForm();
    onCancel();
  };

  return (
    <View style={styles.scrollContainer}>
      <ScrollView 
        style={styles.scrollView}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
        <Text style={styles.header}>
          {initialFile ? "Confirm Upload" : "Upload Video"}
        </Text>

        {!initialFile && (
          <View style={styles.buttonWrapper}>
            <Button 
              title="Select Video File" 
              onPress={handleFilePick} 
              disabled={isLoading} 
            />
          </View>
        )}

        {selectedFile && (
          <Text style={styles.fileInfo}>
            Selected: {selectedFile.name || 'Unknown file'}
          </Text>
        )}

        <TextInput
          style={styles.input}
          placeholder="Title"
          value={title}
          onChangeText={setTitle}
          editable={!isLoading}
          maxLength={100}
        />
        
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Caption (optional)"
          value={caption}
          onChangeText={setCaption}
          editable={!isLoading}
          multiline
          numberOfLines={3}
          maxLength={500}
        />
        
        <View style={styles.buttonWrapper}>
          <Button
            title={isLoading ? 'Uploading...' : 'Upload Video'}
            onPress={handleUpload}
            disabled={isLoading || !selectedFile}
          />
        </View>
        
        {isLoading && (
          <ActivityIndicator 
            size="large" 
            color="#3260AD" 
            style={styles.loader} 
          />
        )}

        {message ? (
          <Text 
            style={[
              styles.message, 
              message.startsWith('Upload successful') ? styles.success : styles.error
            ]}
          >
            {message}
          </Text>
        ) : null}
        
        {!isLoading && (
          <View style={styles.buttonWrapper}>
            <Button 
              title="Cancel / Back to Options" 
              onPress={handleCancel} 
              color="#888" 
            />
          </View>
        )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'stretch',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  fileInfo: {
    marginVertical: 10,
    textAlign: 'center',
    color: '#555',
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  loader: {
    marginTop: 20,
  },
  message: {
    marginTop: 15,
    textAlign: 'center',
    fontSize: 16,
    paddingHorizontal: 10,
  },
  success: {
    color: 'green',
  },
  error: {
    color: 'red',
  },
  buttonWrapper: {
    marginVertical: 8,
  }
});

export default VideoUpload;
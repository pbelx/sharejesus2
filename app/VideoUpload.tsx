// VideoUpload.tsx - Without external file picker dependency
import * as DocumentPicker from 'expo-document-picker';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import videoApiService from '../services/videoApiService';

// Define the video file type
export type VideoFileType = {
  uri: string;
  name: string;
  type: string;
} | null;

// Define proper prop types
type VideoUploadProps = {
  initialFile?: VideoFileType;
  onUploadComplete?: ((uploadedVideoData?: any) => void) | null | undefined;
  onCancel?: (() => void) | null | undefined;
};

const VideoUpload: React.FC<VideoUploadProps> = ({ 
  initialFile = null, 
  onUploadComplete = null, 
  onCancel = null 
}) => {
  const [selectedFile, setSelectedFile] = useState<VideoFileType>(initialFile);
  const [title, setTitle] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [caption, setCaption] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');

  // Update selectedFile when initialFile changes
  useEffect(() => {
    setSelectedFile(initialFile);
  }, [initialFile]);

  const handleSelectFile = async (): Promise<void> => {
    try {
      setMessage(''); // Clear any previous messages
      
      const result = await DocumentPicker.getDocumentAsync({
        type: 'video/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        console.log('📁 File selected:', asset);
        
        setSelectedFile({
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType || 'video/mp4',
        });
        
        setMessage('File selected successfully!');
      }
    } catch (error: any) {
      console.error('📁 File selection error:', error);
      setMessage('Failed to select file. Please try again.');
    }
  };

  const resetForm = (): void => {
    setSelectedFile(initialFile);
    setTitle('');
    setName('');
    setCaption('');
    setMessage('');
  };

  const getFileExtension = (uri: string): string => {
    try {
      const parts = uri.split('.');
      return parts.length > 1 ? parts[parts.length - 1] : 'mp4';
    } catch {
      return 'mp4';
    }
  };

  const validateInputs = (): boolean => {
    if (!selectedFile) {
      setMessage('Please select or record a video file first.');
      return false;
    }

    if (!title.trim()) {
      setMessage('Please enter a title for your video.');
      return false;
    }

    return true;
  };

  const handleUpload = async (): Promise<void> => {
    if (!validateInputs()) {
      return;
    }

    setIsLoading(true);
    setMessage('Uploading...');

    try {
      const extension = getFileExtension(selectedFile!.uri);
      const fileName = selectedFile!.name || `video-${Date.now()}.${extension}`;

      const fileToUpload = {
        uri: selectedFile!.uri,
        name: fileName,
        type: selectedFile!.type || 'video/mp4',
      };

      const metadata = {
        name: name.trim() || title.trim(),
        title: title.trim(),
        caption: caption.trim(),
      };

      console.log('📤 Uploading file:', fileToUpload);
      console.log('📋 With metadata:', metadata);

      const response = await videoApiService.uploadVideo(fileToUpload, metadata);
      setIsLoading(false);

      if (response.success) {
        const videoData = response.data;
        console.log('✅ Upload successful:', videoData);
        
        setMessage(`Upload successful! Video uploaded.`);
        resetForm();
        
        setTimeout(() => {
          if (onUploadComplete) {
            onUploadComplete(videoData);
          }
        }, 2000);
      } else {
        const errorMessage = response.error || 'Unknown error occurred';
        console.error('❌ Upload failed:', errorMessage);
        
        if (errorMessage.includes('unsupported format')) {
          setMessage('Upload failed: Video format not supported. Please use MP4, MOV, or MP2T format.');
        } else if (errorMessage.includes('File is empty')) {
          setMessage('Upload failed: The selected file appears to be empty.');
        } else {
          setMessage(`Upload failed: ${errorMessage}`);
        }
      }
    } catch (error: any) {
      console.error('💥 Upload error:', error);
      setIsLoading(false);
      
      if (error.message && error.message.includes('Network request failed')) {
        setMessage('Upload failed: Network connection error. Please check your internet connection.');
      } else if (error.message && error.message.includes('413')) {
        setMessage('Upload failed: File too large. Please select a smaller video file.');
      } else {
        setMessage(`Upload failed: ${error.message || 'Network error or server unavailable'}`);
      }
    }
  };

  const handleCancel = (): void => {
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
            <Text style={styles.label}>Selected File:</Text>
            <Text style={styles.fileName}>
              {selectedFile ? selectedFile.name || 'Video File' : 'No file selected'}
            </Text>
            
            {/* Add Select File Button if no file is selected or if user wants to change */}
            {(!selectedFile || !initialFile) && (
              <TouchableOpacity
                style={[
                  styles.selectFileButton,
                  isLoading && styles.disabledButton
                ]}
                onPress={handleSelectFile}
                disabled={isLoading}
              >
                <Text style={styles.selectFileButtonText}>
                  {selectedFile ? 'Change Video File' : 'Select Video File'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Form Fields */}
          <View style={styles.section}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter video title"
              multiline={false}
              editable={!isLoading}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Name (optional)</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter video name"
              multiline={false}
              editable={!isLoading}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Caption (optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={caption}
              onChangeText={setCaption}
              placeholder="Enter video caption"
              multiline={true}
              numberOfLines={3}
              editable={!isLoading}
            />
          </View>

          {/* Status Message */}
          {message ? (
            <View style={styles.messageContainer}>
              <Text style={[
                styles.message,
                message.includes('successful') ? styles.successMessage : styles.errorMessage
              ]}>
                {message}
              </Text>
            </View>
          ) : null}

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancel}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button, 
                styles.uploadButton,
                (isLoading || !selectedFile) && styles.disabledButton
              ]}
              onPress={handleUpload}
              disabled={isLoading || !selectedFile}
            >
              <Text style={styles.uploadButtonText}>
                {isLoading ? 'Uploading...' : 'Upload Video'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  fileName: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
  },
  selectFileButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  selectFileButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  messageContainer: {
    marginVertical: 10,
    padding: 10,
    borderRadius: 5,
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
  },
  successMessage: {
    color: '#28a745',
    backgroundColor: '#d4edda',
  },
  errorMessage: {
    color: '#dc3545',
    backgroundColor: '#f8d7da',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
    gap: 15,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  uploadButton: {
    backgroundColor: '#28a745',
  },
  uploadButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
});

export default VideoUpload;
// VideoUpload.tsx - Updated with proper TypeScript types and better authentication handling
import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import videoApiService from '../services/videoApiService';
import { AuthDebugger } from '../utils/authDebug'; // Import the debug utility

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
  const [authStatus, setAuthStatus] = useState<'checking' | 'authenticated' | 'not_authenticated' | 'error'>('checking');

  // Check authentication on component mount
  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async (): Promise<void> => {
    try {
      console.log('🔍 Checking authentication status...');
      
      // Run auth diagnostic if needed (remove in production)
      if (__DEV__) {
        await AuthDebugger.runCompleteAuthDiagnostic();
      }
      
      const isAuth = await videoApiService.isAuthenticated();
      
      if (isAuth) {
        setAuthStatus('authenticated');
        console.log('✅ User is authenticated');
      } else {
        setAuthStatus('not_authenticated');
        console.log('❌ User is not authenticated');
        setMessage('Please login to upload videos.');
      }
    } catch (error) {
      console.error('❌ Auth check failed:', error);
      setAuthStatus('error');
      setMessage('Authentication check failed. Please try logging in again.');
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

    // Name is optional based on your backend, so we don't require it
    return true;
  };

  const handleUpload = async (): Promise<void> => {
    // Validate inputs first
    if (!validateInputs()) {
      return;
    }

    // Check auth status
    if (authStatus !== 'authenticated') {
      setMessage('Please login first to upload videos.');
      return;
    }

    setIsLoading(true);
    setMessage('Uploading...');

    try {
      // Ensure we have a valid file name and extension
      const extension = getFileExtension(selectedFile!.uri);
      const fileName = selectedFile!.name || `video-${Date.now()}.${extension}`;

      const fileToUpload = {
        uri: selectedFile!.uri,
        name: fileName,
        type: selectedFile!.type || 'video/mp4',
      };

      // Backend expects: title and caption (not name)
      const metadata = {
        name: name.trim() || title.trim(), // Use title as fallback for name
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
        
        // Call onUploadComplete after a delay to show success message
        setTimeout(() => {
          if (onUploadComplete) {
            onUploadComplete(videoData);
          }
        }, 2000);
      } else {
        const errorMessage = response.error || 'Unknown error occurred';
        console.error('❌ Upload failed:', errorMessage);
        
        // Handle specific error cases
        if (errorMessage.includes('Authentication') || errorMessage.includes('login')) {
          setAuthStatus('not_authenticated');
          setMessage('Session expired. Please login again.');
        } else if (errorMessage.includes('unsupported format')) {
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
      
      // Provide more specific error messages
      if (error.message && error.message.includes('Network request failed')) {
        setMessage('Upload failed: Network connection error. Please check your internet connection.');
      } else if (error.message && error.message.includes('401')) {
        setAuthStatus('not_authenticated');
        setMessage('Upload failed: Authentication error. Please login again.');
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

  const handleRetryAuth = async (): Promise<void> => {
    setAuthStatus('checking');
    setMessage('Checking authentication...');
    await checkAuthentication();
  };

  // Show auth status
  const renderAuthStatus = () => {
    switch (authStatus) {
      case 'checking':
        return (
          <View style={[styles.authStatus, styles.authChecking]}>
            <Text style={styles.authStatusText}>Checking authentication...</Text>
          </View>
        );
      case 'not_authenticated':
        return (
          <View style={[styles.authStatus, styles.authError]}>
            <Text style={styles.authStatusText}>Not authenticated</Text>
            <TouchableOpacity onPress={handleRetryAuth} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        );
      case 'authenticated':
        return (
          <View style={[styles.authStatus, styles.authSuccess]}>
            <Text style={styles.authStatusText}>✅ Authenticated</Text>
          </View>
        );
      case 'error':
        return (
          <View style={[styles.authStatus, styles.authError]}>
            <Text style={styles.authStatusText}>Authentication error</Text>
            <TouchableOpacity onPress={handleRetryAuth} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        );
      default:
        return null;
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

          {/* Auth Status */}
          {renderAuthStatus()}

          {/* File Selection */}
          <View style={styles.section}>
            <Text style={styles.label}>Selected File:</Text>
            <Text style={styles.fileName}>
              {selectedFile ? selectedFile.name || 'Video File' : 'No file selected'}
            </Text>
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
              editable={!isLoading && authStatus === 'authenticated'}
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
              editable={!isLoading && authStatus === 'authenticated'}
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
              editable={!isLoading && authStatus === 'authenticated'}
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
                (isLoading || authStatus !== 'authenticated' || !selectedFile) && styles.disabledButton
              ]}
              onPress={handleUpload}
              disabled={isLoading || authStatus !== 'authenticated' || !selectedFile}
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

const styles = {
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
    fontWeight: 'bold' as const,
    marginBottom: 20,
    textAlign: 'center' as const,
    color: '#333',
  },
  authStatus: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  authChecking: {
    backgroundColor: '#e3f2fd',
  },
  authSuccess: {
    backgroundColor: '#e8f5e8',
  },
  authError: {
    backgroundColor: '#ffebee',
  },
  authStatusText: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  retryButton: {
    backgroundColor: '#2196f3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500' as const,
  },
  section: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 8,
    color: '#333',
  },
  fileName: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic' as const,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top' as const,
  },
  messageContainer: {
    marginVertical: 15,
  },
  message: {
    fontSize: 14,
    textAlign: 'center' as const,
    padding: 10,
    borderRadius: 8,
  },
  successMessage: {
    backgroundColor: '#e8f5e8',
    color: '#2e7d32',
  },
  errorMessage: {
    backgroundColor: '#ffebee',
    color: '#c62828',
  },
  buttonContainer: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    marginTop: 20,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center' as const,
    marginHorizontal: 5,
  },
  uploadButton: {
    backgroundColor: '#4caf50',
  },
  cancelButton: {
    backgroundColor: '#f44336',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  uploadButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold' as const,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold' as const,
  },
};

export default VideoUpload;
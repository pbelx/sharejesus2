// services/videoApiService.ts - Fixed Video API Service
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ReactNode } from "react";

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface Video {
  duration: any;
  description: ReactNode;
  id: string;
  title: string;
  url: string;
  thumbnailUrl?: string;
  uploader?: {
    id: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
  };
  createdTimestamp: string;
}

interface VideoUploadMetadata {
  name: string;
  title: string;
  caption: string;
}

interface VideoFile {
  uri: string;
  name: string;
  type: string;
}

class VideoApiService {
  private baseURL = 'https://himfirstapis.com';
  private authToken: string | null = null;

  // Get authentication token from AsyncStorage
  private async getAuthToken(): Promise<string | null> {
    if (this.authToken) {
      return this.authToken;
    }

    try {
      // Check all possible token storage keys
      const tokenKeys = ['authToken', 'jwt', 'token', 'accessToken'];
      
      for (const key of tokenKeys) {
        const token = await AsyncStorage.getItem(key);
        if (token) {
          console.log(`VideoAPI: Found auth token with key: ${key}`);
          this.authToken = token;
          return token;
        }
      }
      
      console.warn('VideoAPI: No auth token found in AsyncStorage');
      return null;
    } catch (e) {
      console.error('VideoAPI: Failed to load auth token from AsyncStorage', e);
      return null;
    }
  }

  // Set authentication token
  setAuthToken(token: string) {
    this.authToken = token;
    console.log('VideoAPI: Auth token set');
  }

  // Clear authentication token
  clearAuthToken() {
    this.authToken = null;
    console.log('VideoAPI: Auth token cleared');
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getAuthToken();
    return token !== null;
  }

  // Helper method for making API requests
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`;
      
      const defaultHeaders: HeadersInit = {};
      
      // Only add Content-Type for JSON requests (not FormData)
      if (options.body && !(options.body instanceof FormData)) {
        defaultHeaders['Content-Type'] = 'application/json';
      }

      // Add authorization header if token exists
      const token = await this.getAuthToken();
      if (token) {
        // Try different auth header formats
        defaultHeaders['Authorization'] = `Bearer ${token}`;
        console.log('VideoAPI: Added auth header with Bearer token');
      } else {
        console.warn('VideoAPI: No auth token available for request');
      }

      const config: RequestInit = {
        headers: {
          ...defaultHeaders,
          ...options.headers,
        },
        ...options,
      };

      console.log('VideoAPI: Making request to:', url);
      console.log('VideoAPI: Request headers:', config.headers);

      const response = await fetch(url, config);
      
      console.log('VideoAPI: Response status:', response.status);
      console.log('VideoAPI: Response headers:', response.headers);

      if (!response.ok) {
        let errorMessage = 'Request failed';
        try {
          const errorData = await response.json();
          console.log('VideoAPI: Error response data:', errorData);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        
        // Special handling for auth errors
        if (response.status === 401) {
          console.error('VideoAPI: Authentication failed - clearing token');
          this.clearAuthToken();
          errorMessage = 'Authentication failed. Please login again.';
        }
        
        return {
          success: false,
          error: errorMessage,
        };
      }

      const data = await response.json();
      console.log('VideoAPI: Success response data:', data);
      
      return {
        success: true,
        data: data,
      };
    } catch (error) {
      console.error('VideoAPI: Network error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred',
      };
    }
  }

  // Upload video (Fixed and Complete)
  async uploadVideo(
    videoFile: VideoFile,
    metadata: VideoUploadMetadata
  ): Promise<ApiResponse<any>> {
    try {
      // Check authentication first
      const isAuth = await this.isAuthenticated();
      if (!isAuth) {
        return {
          success: false,
          error: 'Authentication required. Please login first.',
        };
      }

      const formData = new FormData();
      
      // Append the video file - this matches your backend @RequestParam("file")
      formData.append('file', {
        uri: videoFile.uri,
        name: videoFile.name,
        type: videoFile.type,
      } as any);

      // Add metadata fields to match backend @RequestParam
      // Your backend expects: title, caption (not name)
      if (metadata.title) {
        formData.append('title', metadata.title);
      }
      
      if (metadata.caption) {
        formData.append('caption', metadata.caption);
      }

      console.log('VideoAPI: Uploading video with metadata:', {
        fileName: videoFile.name,
        fileType: videoFile.type,
        title: metadata.title,
        caption: metadata.caption,
      });

      // Make the upload request to match your backend endpoint
      return await this.makeRequest('/api/v1/video/upload', {
        method: 'POST',
        body: formData,
      });

    } catch (error) {
      console.error('VideoAPI: Upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  // Get all videos with pagination
  async getAllVideos(
    page: number = 0,
    size: number = 100,
    sortBy: string = 'createdTimestamp',
    sortOrder: string = 'DESC'
  ): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sortBy,
      sortOrder,
    });

    return this.makeRequest(`/api/v1/video/public/all?${queryParams.toString()}`, {
      method: 'GET',
    });
  }

  // Get user's videos
  async getMyVideos(
    page: number = 0,
    size: number = 100,
    sortBy: string = 'createdTimestamp',
    sortOrder: string = 'DESC'
  ): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sortBy,
      sortOrder,
    });

    return this.makeRequest(`/api/v1/video/my-videos?${queryParams.toString()}`, {
      method: 'GET',
    });
  }

  // Get videos before a specific date
  async getPrevVideos(
    date: string,
    page: number = 0,
    size: number = 100,
    sortBy: string = 'createdTimestamp',
    sortOrder: string = 'DESC'
  ): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sortBy,
      sortOrder,
    });

    return this.makeRequest(`/api/v1/video/public/prev-videos/${date}?${queryParams.toString()}`, {
      method: 'GET',
    });
  }

  // Delete video by ID
  async deleteVideo(videoId: string): Promise<ApiResponse<any>> {
    return this.makeRequest(`/api/v1/video/${videoId}`, {
      method: 'DELETE',
    });
  }
}

// Export singleton instance
export const videoApiService = new VideoApiService();
export default videoApiService;
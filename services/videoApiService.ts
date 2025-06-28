// services/videoApiService.ts - Dedicated Video API Service
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

interface PastVideosParams {
  size?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
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
      // Try 'authToken' first, then 'jwt' for Android compatibility
      let token = await AsyncStorage.getItem('authToken');
      if (!token) {
        token = await AsyncStorage.getItem('jwt');
      }
      
      if (token) {
        this.authToken = token;
        return token;
      }
    } catch (e) {
      console.error('Failed to load auth token from AsyncStorage', e);
    }
    
    return null;
  }

  // Set authentication token
  setAuthToken(token: string) {
    this.authToken = token;
  }

  // Clear authentication token
  clearAuthToken() {
    this.authToken = null;
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
        defaultHeaders['Authorization'] = `Bearer ${token}`;
      }

      const config: RequestInit = {
        headers: {
          ...defaultHeaders,
          ...options.headers,
        },
        ...options,
      };

      console.log('VideoAPI: Making request to:', url);

      const response = await fetch(url, config);
      
      console.log('VideoAPI: Response status:', response.status);

      if (!response.ok) {
        let errorMessage = 'Request failed';
        try {
          const errorData = await response.json();
          console.log('VideoAPI: Error response data:', errorData);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
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

  // Upload video (matches Android implementation exactly)
  async uploadVideo(
    videoFile: VideoFile,
    metadata: VideoUploadMetadata
  ): Promise<ApiResponse<any>> {
    try {
      const formData = new FormData();
      
      // Append the video file
      formData.append('file', {
        uri: videoFile.uri,
        name: videoFile.name,
        type: videoFile.type,
      } as any);

      // Add all metadata fields to match Android
      formData.append('name', metadata.name);
      formData.append('title', metadata.title);
      formData.append('caption', metadata.caption);

      console.log('VideoAPI: Uploading video with metadata:', {
        fileName: videoFile.name,
        fileType: videoFile.type,
        name: metadata.name,
        title: metadata.title,
        caption: metadata.caption,
      });

      // Get auth token
      const token = await this.getAuthToken();
      if (!token) {
        return {
          success: false,
          error: 'Authentication required. Please login first.',
        };
      }

      const headers: HeadersInit = {
        'Authorization': `Bearer ${token}`,
      };

      const response = await fetch(`${this.baseURL}/api/v1/video/upload`, {
        method: 'POST',
        headers: headers,
        body: formData,
      });

      console.log('VideoAPI: Upload response status:', response.status);

      if (!response.ok) {
        let errorMessage = 'Upload failed';
        try {
          const errorData = await response.json();
          console.log('VideoAPI: Upload error data:', errorData);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        
        return {
          success: false,
          error: errorMessage,
        };
      }

      const data = await response.json();
      console.log('VideoAPI: Upload success data:', data);
      
      return {
        success: true,
        data: data,
      };
    } catch (error) {
      console.error('VideoAPI: Upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload error occurred',
      };
    }
  }

  // Get all public videos
  async getAllPublicVideos(): Promise<ApiResponse<Video[]>> {
    return this.makeRequest<Video[]>('/api/v1/video/public/all', {
      method: 'GET',
    });
  }

  // Get past videos by date
  async getPastVideos(
    date: string,
    params: PastVideosParams = {}
  ): Promise<ApiResponse<Video[]>> {
    const {
      size = 100,
      sortBy = 'createdTimestamp',
      sortOrder = 'DESC'
    } = params;

    const queryParams = new URLSearchParams({
      size: size.toString(),
      sortBy,
      sortOrder,
    });

    return this.makeRequest<Video[]>(
      `/api/v1/video/public/prev-videos/${date}?${queryParams.toString()}`,
      {
        method: 'GET',
      }
    );
  }

  // Get video by ID
  async getVideoById(videoId: string): Promise<ApiResponse<Video>> {
    return this.makeRequest<Video>(`/api/v1/video/${videoId}`, {
      method: 'GET',
    });
  }

  // Delete video
  async deleteVideo(videoId: string): Promise<ApiResponse<any>> {
    return this.makeRequest(`/api/v1/video/${videoId}`, {
      method: 'DELETE',
    });
  }

  // Get user's uploaded videos
  async getUserVideos(userId: string): Promise<ApiResponse<Video[]>> {
    return this.makeRequest<Video[]>(`/api/v1/video/user/${userId}`, {
      method: 'GET',
    });
  }

  // Update video metadata
  async updateVideo(
    videoId: string,
    metadata: Partial<VideoUploadMetadata>
  ): Promise<ApiResponse<any>> {
    return this.makeRequest(`/api/v1/video/${videoId}`, {
      method: 'PUT',
      body: JSON.stringify(metadata),
    });
  }

  // Search videos
  async searchVideos(query: string, limit: number = 20): Promise<ApiResponse<Video[]>> {
    const queryParams = new URLSearchParams({
      q: query,
      limit: limit.toString(),
    });

    return this.makeRequest<Video[]>(
      `/api/v1/video/search?${queryParams.toString()}`,
      {
        method: 'GET',
      }
    );
  }

  // Like/Unlike video
  async toggleVideoLike(videoId: string): Promise<ApiResponse<any>> {
    return this.makeRequest(`/api/v1/video/${videoId}/like`, {
      method: 'POST',
    });
  }

  // Get video comments
  async getVideoComments(videoId: string): Promise<ApiResponse<any[]>> {
    return this.makeRequest<any[]>(`/api/v1/video/${videoId}/comments`, {
      method: 'GET',
    });
  }

  // Add comment to video
  async addVideoComment(videoId: string, comment: string): Promise<ApiResponse<any>> {
    return this.makeRequest(`/api/v1/video/${videoId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ comment }),
    });
  }

  // Report video
  async reportVideo(videoId: string, reason: string): Promise<ApiResponse<any>> {
    return this.makeRequest(`/api/v1/video/${videoId}/report`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // Get video analytics (for uploaded videos)
  async getVideoAnalytics(videoId: string): Promise<ApiResponse<any>> {
    return this.makeRequest(`/api/v1/video/${videoId}/analytics`, {
      method: 'GET',
    });
  }
}

// Create and export a singleton instance
const videoApiService = new VideoApiService();

export default videoApiService;

// Export types for use in components
export { VideoApiService }; // Export class for potential future use
export type {
    ApiResponse, PastVideosParams, Video, VideoFile, VideoUploadMetadata
};

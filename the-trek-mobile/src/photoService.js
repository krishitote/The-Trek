// Photo Upload Service
// Handles camera access, image picking, compression, and upload

import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

/**
 * Request camera permissions
 */
export async function requestCameraPermissions() {
  try {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error requesting camera permissions:', error);
    return false;
  }
}

/**
 * Request media library permissions
 */
export async function requestMediaLibraryPermissions() {
  try {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error requesting media library permissions:', error);
    return false;
  }
}

/**
 * Take photo with camera
 */
export async function takePhoto(options = {}) {
  try {
    // Request permission
    const hasPermission = await requestCameraPermissions();
    if (!hasPermission) {
      throw new Error('Camera permission not granted');
    }

    // Launch camera
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: options.allowsEditing !== false,
      aspect: options.aspect || [4, 3],
      quality: options.quality || 0.8, // 0.8 = good quality with compression
      exif: false, // Don't include GPS metadata for privacy
    });

    if (result.canceled) {
      return null;
    }

    return {
      uri: result.assets[0].uri,
      width: result.assets[0].width,
      height: result.assets[0].height,
      type: 'image/jpeg',
      fileName: `photo_${Date.now()}.jpg`,
    };
  } catch (error) {
    console.error('Error taking photo:', error);
    throw error;
  }
}

/**
 * Pick photo from gallery
 */
export async function pickPhoto(options = {}) {
  try {
    // Request permission
    const hasPermission = await requestMediaLibraryPermissions();
    if (!hasPermission) {
      throw new Error('Media library permission not granted');
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: options.allowsEditing !== false,
      aspect: options.aspect || [4, 3],
      quality: options.quality || 0.8,
      exif: false,
    });

    if (result.canceled) {
      return null;
    }

    return {
      uri: result.assets[0].uri,
      width: result.assets[0].width,
      height: result.assets[0].height,
      type: 'image/jpeg',
      fileName: `photo_${Date.now()}.jpg`,
    };
  } catch (error) {
    console.error('Error picking photo:', error);
    throw error;
  }
}

/**
 * Pick multiple photos from gallery
 */
export async function pickMultiplePhotos(options = {}) {
  try {
    // Request permission
    const hasPermission = await requestMediaLibraryPermissions();
    if (!hasPermission) {
      throw new Error('Media library permission not granted');
    }

    // Launch image picker with multiple selection
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: options.quality || 0.7, // Lower quality for multiple images
      exif: false,
    });

    if (result.canceled) {
      return null;
    }

    return result.assets.map((asset, index) => ({
      uri: asset.uri,
      width: asset.width,
      height: asset.height,
      type: 'image/jpeg',
      fileName: `photo_${Date.now()}_${index}.jpg`,
    }));
  } catch (error) {
    console.error('Error picking multiple photos:', error);
    throw error;
  }
}

/**
 * Upload photo to backend
 */
export async function uploadPhoto(photoData, token, apiBaseUrl) {
  try {
    const formData = new FormData();
    
    // Create file object for FormData
    const file = {
      uri: Platform.OS === 'ios' ? photoData.uri.replace('file://', '') : photoData.uri,
      type: photoData.type,
      name: photoData.fileName,
    };
    
    formData.append('image', file);

    const response = await fetch(`${apiBaseUrl}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }

    const data = await response.json();
    return {
      success: true,
      imageUrl: data.profile_image || data.imageUrl,
    };
  } catch (error) {
    console.error('Error uploading photo:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Upload activity photo with compression
 */
export async function uploadActivityPhoto(photoData, activityId, token, apiBaseUrl) {
  try {
    const formData = new FormData();
    
    const file = {
      uri: Platform.OS === 'ios' ? photoData.uri.replace('file://', '') : photoData.uri,
      type: photoData.type,
      name: photoData.fileName,
    };
    
    formData.append('image', file);
    formData.append('activityId', activityId.toString());

    const response = await fetch(`${apiBaseUrl}/activities/${activityId}/photo`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }

    const data = await response.json();
    return {
      success: true,
      photoUrl: data.photoUrl,
    };
  } catch (error) {
    console.error('Error uploading activity photo:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Show photo picker action sheet
 * Returns selected photo or null
 */
export async function showPhotoPickerSheet(options = {}) {
  try {
    // Check permissions first
    const cameraGranted = await requestCameraPermissions();
    const libraryGranted = await requestMediaLibraryPermissions();

    if (!cameraGranted && !libraryGranted) {
      throw new Error('Camera and media library permissions required');
    }

    // Return both options so caller can show action sheet
    return {
      cameraAvailable: cameraGranted,
      libraryAvailable: libraryGranted,
    };
  } catch (error) {
    console.error('Error checking photo permissions:', error);
    return {
      cameraAvailable: false,
      libraryAvailable: false,
    };
  }
}

/**
 * Compress image quality based on file size
 * Returns recommended quality value (0-1)
 */
export function getCompressionQuality(imageWidth, imageHeight) {
  const megapixels = (imageWidth * imageHeight) / 1000000;
  
  if (megapixels > 8) return 0.6; // High res cameras
  if (megapixels > 4) return 0.7; // Modern phones
  if (megapixels > 2) return 0.8; // Standard quality
  return 0.9; // Low res images
}

/**
 * Get image dimensions without loading full image
 */
export async function getImageDimensions(uri) {
  return new Promise((resolve, reject) => {
    const Image = require('react-native').Image;
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      (error) => reject(error)
    );
  });
}

import ENV from '@/config/env';

interface CloudinaryUploadResponse {
  url: string;
  public_id: string;
}

export class CloudinaryService {
  private cloudName = ENV.CLOUDINARY_CLOUD_NAME;
  private uploadPreset = ENV.CLOUDINARY_UPLOAD_PRESET;

  async uploadImage(uri: string, folder: string = 'recipes'): Promise<string> {
    try {
      const formData = new FormData();
      
      const filename = uri.split('/').pop() || 'image.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('file', {
        uri,
        name: filename,
        type,
      } as any);
      
      formData.append('upload_preset', this.uploadPreset);
      formData.append('folder', folder);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data: CloudinaryUploadResponse = await response.json();
      return data.url;
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw error;
    }
  }

  async uploadMultipleImages(uris: string[], folder: string = 'recipes'): Promise<string[]> {
    try {
      const uploadPromises = uris.map((uri) => this.uploadImage(uri, folder));
      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Multiple upload error:', error);
      throw error;
    }
  }

  getOptimizedUrl(url: string, width: number = 800, quality: number = 80): string {
    if (!url.includes('cloudinary')) return url;
    
    const parts = url.split('/upload/');
    if (parts.length !== 2) return url;
    
    return `${parts[0]}/upload/w_${width},q_${quality},f_auto/${parts[1]}`;
  }

  getThumbnailUrl(url: string, width: number = 300, height: number = 300): string {
    if (!url.includes('cloudinary')) return url;
    
    const parts = url.split('/upload/');
    if (parts.length !== 2) return url;
    
    return `${parts[0]}/upload/w_${width},h_${height},c_fill,q_80,f_auto/${parts[1]}`;
  }
}

export const cloudinaryService = new CloudinaryService();

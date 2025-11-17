/**
 * Image Validation and Optimization Service
 * Validates and optimizes images for Facebook and Instagram publishing
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface ImageInfo {
  width: number;
  height: number;
  format: string;
  size: number;
  aspectRatio: number;
  orientation: 'landscape' | 'portrait' | 'square';
}

export interface ImageValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  info?: ImageInfo;
  needsOptimization: boolean;
  recommendedAction?: string;
}

export interface ImageOptimizationOptions {
  platform: 'facebook' | 'instagram';
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

/**
 * Platform-specific image requirements
 */
export const IMAGE_REQUIREMENTS = {
  facebook: {
    formats: ['jpeg', 'png', 'gif', 'webp', 'heic'],
    maxResolution: { width: 2048, height: 2048 },
    maxFileSize: 10 * 1024 * 1024, // 10MB
    aspectRatios: {
      landscape: { min: 1.91, max: 1.91, recommended: 1.91 },
      square: { min: 1.0, max: 1.0, recommended: 1.0 },
      portrait: { min: 0.8, max: 0.8, recommended: 0.8 } // 4:5
    }
  },
  instagram: {
    formats: ['jpeg', 'png'], // NO GIF for feed posts
    minResolution: { width: 320, height: 320 },
    maxResolution: { width: 1080, height: 1350 }, // Max for 4:5 portrait
    maxFileSize: 8 * 1024 * 1024, // 8MB
    aspectRatios: {
      landscape: { min: 1.91, max: 1.91, recommended: 1.91 },
      square: { min: 1.0, max: 1.0, recommended: 1.0 },
      portrait: { min: 0.8, max: 0.8, recommended: 0.8 } // 4:5
    },
    // Instagram accepts aspect ratios between 4:5 and 1.91:1
    minAspectRatio: 0.8,  // 4:5
    maxAspectRatio: 1.91  // 1.91:1
  }
};

/**
 * Check if FFmpeg is installed
 */
export async function checkFFmpegInstalled(): Promise<boolean> {
  try {
    await execAsync('ffmpeg -version');
    return true;
  } catch {
    return false;
  }
}

/**
 * Get image information using FFprobe
 */
export async function getImageInfo(filePath: string): Promise<ImageInfo> {
  try {
    const { stdout } = await execAsync(
      `ffprobe -v error -select_streams v:0 -show_entries stream=width,height,pix_fmt -show_entries format=format_name,size -of json "${filePath}"`
    );

    const data = JSON.parse(stdout);
    const stream = data.streams?.[0];
    const format = data.format;

    if (!stream || !format) {
      throw new Error('Unable to read image information');
    }

    const width = parseInt(stream.width);
    const height = parseInt(stream.height);
    const aspectRatio = width / height;
    const size = parseInt(format.size);
    const formatName = format.format_name?.split(',')[0] || 'unknown';

    let orientation: 'landscape' | 'portrait' | 'square';
    if (aspectRatio > 1.1) {
      orientation = 'landscape';
    } else if (aspectRatio < 0.9) {
      orientation = 'portrait';
    } else {
      orientation = 'square';
    }

    return {
      width,
      height,
      format: formatName,
      size,
      aspectRatio,
      orientation
    };
  } catch (error: any) {
    throw new Error(`Failed to get image info: ${error.message}`);
  }
}

/**
 * Validate image for Facebook
 */
export async function validateFacebookImage(filePath: string): Promise<ImageValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  let needsOptimization = false;

  try {
    const info = await getImageInfo(filePath);
    const reqs = IMAGE_REQUIREMENTS.facebook;

    // Check format
    if (!reqs.formats.includes(info.format.toLowerCase())) {
      errors.push(`Unsupported format: ${info.format}. Allowed: ${reqs.formats.join(', ')}`);
    }

    // Check file size
    if (info.size > reqs.maxFileSize) {
      errors.push(`File too large: ${(info.size / 1024 / 1024).toFixed(2)}MB. Max: ${reqs.maxFileSize / 1024 / 1024}MB`);
      needsOptimization = true;
    }

    // Check resolution
    if (info.width > reqs.maxResolution.width || info.height > reqs.maxResolution.height) {
      warnings.push(`Resolution ${info.width}x${info.height} exceeds recommended ${reqs.maxResolution.width}x${reqs.maxResolution.height}. Image will be resized by Facebook.`);
      needsOptimization = true;
    }

    // Check aspect ratio recommendations
    const aspectRatioCheck = checkAspectRatio(info.aspectRatio, 'facebook');
    if (aspectRatioCheck.warning) {
      warnings.push(aspectRatioCheck.warning);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      info,
      needsOptimization,
      recommendedAction: needsOptimization ? 'Optimize image to reduce file size or resolution' : undefined
    };
  } catch (error: any) {
    return {
      valid: false,
      errors: [error.message],
      warnings: [],
      needsOptimization: false
    };
  }
}

/**
 * Validate image for Instagram
 */
export async function validateInstagramImage(filePath: string): Promise<ImageValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  let needsOptimization = false;

  try {
    const info = await getImageInfo(filePath);
    const reqs = IMAGE_REQUIREMENTS.instagram;

    // Check format (NO GIF for Instagram feed)
    if (!reqs.formats.includes(info.format.toLowerCase())) {
      if (info.format.toLowerCase() === 'gif') {
        errors.push('GIF format not supported for Instagram feed posts. Convert to JPG or PNG.');
      } else {
        errors.push(`Unsupported format: ${info.format}. Allowed: ${reqs.formats.join(', ')}`);
      }
      needsOptimization = true;
    }

    // Check file size
    if (info.size > reqs.maxFileSize) {
      errors.push(`File too large: ${(info.size / 1024 / 1024).toFixed(2)}MB. Max: ${reqs.maxFileSize / 1024 / 1024}MB`);
      needsOptimization = true;
    }

    // Check minimum resolution
    if (info.width < reqs.minResolution.width || info.height < reqs.minResolution.height) {
      errors.push(`Resolution too low: ${info.width}x${info.height}. Minimum: ${reqs.minResolution.width}x${reqs.minResolution.height}`);
    }

    // Check maximum resolution
    if (info.width > reqs.maxResolution.width || info.height > reqs.maxResolution.height) {
      warnings.push(`Resolution ${info.width}x${info.height} exceeds Instagram's max ${reqs.maxResolution.width}x${reqs.maxResolution.height}. Will be resized to 1080px width.`);
      needsOptimization = true;
    }

    // Check aspect ratio (Instagram is strict about this)
    if (info.aspectRatio < reqs.minAspectRatio || info.aspectRatio > reqs.maxAspectRatio) {
      errors.push(`Aspect ratio ${info.aspectRatio.toFixed(2)}:1 not supported. Must be between ${reqs.minAspectRatio}:1 (4:5 portrait) and ${reqs.maxAspectRatio}:1 (landscape)`);
      needsOptimization = true;
    } else {
      const aspectRatioCheck = checkAspectRatio(info.aspectRatio, 'instagram');
      if (aspectRatioCheck.warning) {
        warnings.push(aspectRatioCheck.warning);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      info,
      needsOptimization,
      recommendedAction: needsOptimization ? 'Resize, crop, or convert image to meet Instagram requirements' : undefined
    };
  } catch (error: any) {
    return {
      valid: false,
      errors: [error.message],
      warnings: [],
      needsOptimization: false
    };
  }
}

/**
 * Check aspect ratio against platform requirements
 */
function checkAspectRatio(aspectRatio: number, platform: 'facebook' | 'instagram'): { valid: boolean; warning?: string } {
  const reqs = IMAGE_REQUIREMENTS[platform].aspectRatios;

  // Check if it matches standard ratios
  const isSquare = Math.abs(aspectRatio - 1.0) < 0.05;
  const isLandscape = Math.abs(aspectRatio - 1.91) < 0.05;
  const isPortrait = Math.abs(aspectRatio - 0.8) < 0.05;

  if (isSquare || isLandscape || isPortrait) {
    return { valid: true };
  }

  // For Instagram, check if within acceptable range
  if (platform === 'instagram') {
    const inRange = aspectRatio >= IMAGE_REQUIREMENTS.instagram.minAspectRatio && 
                    aspectRatio <= IMAGE_REQUIREMENTS.instagram.maxAspectRatio;
    
    if (inRange) {
      return { 
        valid: true, 
        warning: `Aspect ratio ${aspectRatio.toFixed(2)}:1 is acceptable but not standard. Recommended: 1:1 (square), 4:5 (0.8:1 portrait), or 1.91:1 (landscape)` 
      };
    }
  }

  return {
    valid: false,
    warning: `Aspect ratio ${aspectRatio.toFixed(2)}:1 may cause cropping. Recommended: 1:1 (square), 4:5 (portrait), or 1.91:1 (landscape)`
  };
}

/**
 * Optimize image using FFmpeg
 * Resizes, converts format, and compresses image
 */
export async function optimizeImage(
  inputPath: string,
  outputPath: string,
  options: ImageOptimizationOptions
): Promise<{ success: boolean; outputPath?: string; error?: string }> {
  try {
    const info = await getImageInfo(inputPath);
    const reqs = IMAGE_REQUIREMENTS[options.platform];
    
    let maxWidth = options.maxWidth || reqs.maxResolution.width;
    let maxHeight = options.maxHeight || reqs.maxResolution.height;
    const quality = options.quality || 85;
    const format = options.format || 'jpeg';

    // Determine target dimensions based on aspect ratio
    let targetWidth = info.width;
    let targetHeight = info.height;

    // Resize if too large
    if (targetWidth > maxWidth || targetHeight > maxHeight) {
      const scale = Math.min(maxWidth / targetWidth, maxHeight / targetHeight);
      targetWidth = Math.floor(targetWidth * scale);
      targetHeight = Math.floor(targetHeight * scale);
    }

    // For Instagram, ensure width is exactly 1080 for optimal quality
    if (options.platform === 'instagram' && targetWidth > 1080) {
      const scale = 1080 / targetWidth;
      targetWidth = 1080;
      targetHeight = Math.floor(targetHeight * scale);
    }

    // Build FFmpeg command
    let command = `ffmpeg -i "${inputPath}" -vf "scale=${targetWidth}:${targetHeight}"`;
    
    // Add quality settings based on format
    if (format === 'jpeg') {
      command += ` -q:v ${Math.floor((100 - quality) / 10) + 2}`; // Convert quality to FFmpeg qscale
    } else if (format === 'png') {
      command += ` -compression_level 9`;
    } else if (format === 'webp') {
      command += ` -quality ${quality}`;
    }

    command += ` -y "${outputPath}"`;

    console.log('🎨 [IMAGE OPTIMIZE] Running FFmpeg command:', command);

    await execAsync(command);

    return {
      success: true,
      outputPath
    };
  } catch (error: any) {
    console.error('❌ [IMAGE OPTIMIZE] Failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Auto-optimize image based on platform requirements
 */
export async function autoOptimizeForPlatform(
  inputPath: string,
  outputPath: string,
  platform: 'facebook' | 'instagram'
): Promise<{ success: boolean; outputPath?: string; error?: string; optimized: boolean }> {
  try {
    // First validate
    const validation = platform === 'facebook' 
      ? await validateFacebookImage(inputPath)
      : await validateInstagramImage(inputPath);

    // If valid and doesn't need optimization, return original
    if (validation.valid && !validation.needsOptimization) {
      return {
        success: true,
        outputPath: inputPath,
        optimized: false
      };
    }

    // If has errors that can't be fixed by optimization, return error
    if (validation.errors.length > 0 && !validation.needsOptimization) {
      return {
        success: false,
        error: validation.errors.join('; '),
        optimized: false
      };
    }

    // Optimize the image
    const result = await optimizeImage(inputPath, outputPath, {
      platform,
      quality: 85
    });

    return {
      ...result,
      optimized: result.success
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      optimized: false
    };
  }
}

/**
 * Get recommended dimensions for platform and orientation
 */
export function getRecommendedDimensions(
  platform: 'facebook' | 'instagram',
  orientation: 'landscape' | 'portrait' | 'square'
): { width: number; height: number } {
  if (platform === 'instagram') {
    switch (orientation) {
      case 'square':
        return { width: 1080, height: 1080 };
      case 'portrait':
        return { width: 1080, height: 1350 }; // 4:5
      case 'landscape':
        return { width: 1080, height: 566 }; // 1.91:1
    }
  } else {
    switch (orientation) {
      case 'square':
        return { width: 1200, height: 1200 };
      case 'portrait':
        return { width: 1200, height: 1500 }; // 4:5
      case 'landscape':
        return { width: 1200, height: 628 }; // 1.91:1
    }
  }
}

/**
 * Estimate optimization time based on file size and resolution
 */
export function estimateOptimizationTime(info: ImageInfo): number {
  const megapixels = (info.width * info.height) / 1000000;
  const sizeMB = info.size / 1024 / 1024;
  
  // Rough estimate: 0.5-2 seconds per megapixel + file size factor
  return Math.ceil((megapixels * 1.5 + sizeMB * 0.5) * 1000); // in milliseconds
}

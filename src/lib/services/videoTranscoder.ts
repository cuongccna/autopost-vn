/**
 * Video Transcoding Service
 * Automatically re-encode videos to Instagram-compatible format
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execPromise = promisify(exec);

interface TranscodeOptions {
  inputPath: string;
  outputPath: string;
  preset?: 'reels' | 'square' | 'portrait' | 'auto';
  quality?: number; // CRF value (18-28, lower = better quality)
  maxBitrate?: string; // e.g., '5M'
  onProgress?: (progress: number) => void;
}

interface VideoInfo {
  width: number;
  height: number;
  duration: number;
  codec: string;
  bitrate: number;
  fps: number;
  pixelFormat: string;
  isProgressive: boolean;
  needsTranscoding: boolean;
}

/**
 * Check if FFmpeg is installed
 */
export async function checkFFmpegInstalled(): Promise<boolean> {
  try {
    await execPromise('ffmpeg -version');
    return true;
  } catch (error) {
    console.error('❌ FFmpeg not installed:', error);
    return false;
  }
}

/**
 * Get video information using ffprobe
 */
export async function getVideoInfo(filePath: string): Promise<VideoInfo> {
  try {
    const { stdout } = await execPromise(
      `ffprobe -v error -select_streams v:0 -show_entries stream=codec_name,width,height,r_frame_rate,pix_fmt,field_order -show_entries format=duration,bit_rate -of json "${filePath}"`
    );

    const data = JSON.parse(stdout);
    const stream = data.streams[0];
    const format = data.format;

    // Parse framerate (e.g., "30/1" -> 30)
    const [fpsNum, fpsDenom] = (stream.r_frame_rate || '30/1').split('/').map(Number);
    const fps = fpsNum / fpsDenom;

    // Check if progressive
    const fieldOrder = stream.field_order || 'progressive';
    const isProgressive = fieldOrder === 'progressive' || fieldOrder === 'unknown';

    // Determine if transcoding is needed
    const needsTranscoding =
      stream.codec_name !== 'h264' ||
      stream.pix_fmt !== 'yuv420p' ||
      !isProgressive ||
      stream.width > 1920 ||
      stream.height > 1920 ||
      parseInt(format.bit_rate || '0') > 5000000; // > 5 Mbps

    return {
      width: stream.width,
      height: stream.height,
      duration: parseFloat(format.duration || '0'),
      codec: stream.codec_name,
      bitrate: parseInt(format.bit_rate || '0'),
      fps,
      pixelFormat: stream.pix_fmt,
      isProgressive,
      needsTranscoding
    };
  } catch (error) {
    console.error('Error getting video info:', error);
    throw new Error('Failed to analyze video file');
  }
}

/**
 * Get FFmpeg command based on preset
 */
function getFFmpegCommand(options: TranscodeOptions): string {
  const { inputPath, outputPath, preset = 'auto', quality = 22, maxBitrate = '5M' } = options;

  // Base options (always applied)
  const baseOptions = [
    '-c:v libx264',
    '-preset slow',
    `-crf ${quality}`,
    '-c:a aac',
    '-b:a 128k',
    '-movflags +faststart',
    '-pix_fmt yuv420p',
    '-r 30',
    `-maxrate ${maxBitrate}`,
    '-bufsize 10M'
  ];

  // Preset-specific scale filters
  let scaleFilter = '';
  let bitrate = '4M';

  switch (preset) {
    case 'reels': // 9:16 vertical
      scaleFilter = 'scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2';
      bitrate = '4M';
      break;
    case 'square': // 1:1
      scaleFilter = 'scale=1080:1080:force_original_aspect_ratio=decrease,pad=1080:1080:(ow-iw)/2:(oh-ih)/2';
      bitrate = '3M';
      break;
    case 'portrait': // 4:5
      scaleFilter = 'scale=1080:1350:force_original_aspect_ratio=decrease,pad=1080:1350:(ow-iw)/2:(oh-ih)/2';
      bitrate = '3.5M';
      break;
    case 'auto':
    default: // Auto-detect and fix
      scaleFilter = "scale='min(1920,iw)':'min(1080,ih)':force_original_aspect_ratio=decrease,pad=ceil(iw/2)*2:ceil(ih/2)*2";
      bitrate = '4M';
  }

  const command = `ffmpeg -i "${inputPath}" ${baseOptions.join(' ')} -vf "${scaleFilter}" -b:v ${bitrate} "${outputPath}"`;
  
  return command;
}

/**
 * Transcode video to Instagram-compatible format
 */
export async function transcodeVideo(options: TranscodeOptions): Promise<string> {
  const { inputPath, outputPath, onProgress } = options;

  // Check if FFmpeg is installed
  const hasFFmpeg = await checkFFmpegInstalled();
  if (!hasFFmpeg) {
    throw new Error('FFmpeg is not installed. Please install FFmpeg to enable video transcoding.');
  }

  // Check if input file exists
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input file not found: ${inputPath}`);
  }

  // Get video info
  console.log('📹 Analyzing video:', inputPath);
  const videoInfo = await getVideoInfo(inputPath);
  console.log('📊 Video info:', videoInfo);

  // Skip transcoding if already compatible
  if (!videoInfo.needsTranscoding) {
    console.log('✅ Video already compatible, copying...');
    fs.copyFileSync(inputPath, outputPath);
    return outputPath;
  }

  console.log('🔄 Transcoding required. Starting...');

  // Build FFmpeg command
  const command = getFFmpegCommand(options);
  console.log('🎬 FFmpeg command:', command);

  try {
    // Execute transcoding
    const { stdout, stderr } = await execPromise(command);
    
    if (stderr && stderr.includes('error')) {
      throw new Error(stderr);
    }

    console.log('✅ Transcoding completed:', outputPath);
    return outputPath;

  } catch (error: any) {
    console.error('❌ Transcoding failed:', error);
    
    // Clean up failed output file
    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }

    throw new Error(`Video transcoding failed: ${error.message}`);
  }
}

/**
 * Transcode video for Instagram (wrapper with defaults)
 */
export async function transcodeForInstagram(
  inputPath: string,
  outputPath?: string
): Promise<string> {
  // Generate output path if not provided
  if (!outputPath) {
    const ext = path.extname(inputPath);
    const basename = path.basename(inputPath, ext);
    const dirname = path.dirname(inputPath);
    outputPath = path.join(dirname, `${basename}_instagram${ext}`);
  }

  return transcodeVideo({
    inputPath,
    outputPath,
    preset: 'auto',
    quality: 22,
    maxBitrate: '5M'
  });
}

/**
 * Get estimated transcoding time (rough estimate)
 */
export function estimateTranscodingTime(durationSeconds: number, fileSize: number): number {
  // Very rough estimate: 1 second of video = ~0.5-1 second of encoding
  // For a 30-second video, estimate 15-30 seconds
  const baseFactor = 0.7; // Average encoding speed factor
  const sizeFactor = fileSize / (1024 * 1024 * 50); // Adjust for file size
  
  return Math.ceil(durationSeconds * baseFactor * (1 + sizeFactor * 0.2));
}

/**
 * Validate video meets Instagram requirements
 */
export async function validateInstagramVideo(filePath: string): Promise<{
  valid: boolean;
  errors: string[];
  warnings: string[];
}> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const info = await getVideoInfo(filePath);

    // Check codec
    if (info.codec !== 'h264') {
      errors.push(`Invalid codec: ${info.codec} (required: h264)`);
    }

    // Check pixel format
    if (info.pixelFormat !== 'yuv420p') {
      errors.push(`Invalid pixel format: ${info.pixelFormat} (required: yuv420p)`);
    }

    // Check progressive
    if (!info.isProgressive) {
      errors.push('Video must be progressive (not interlaced)');
    }

    // Check resolution
    if (info.width > 1920 || info.height > 1920) {
      warnings.push(`Resolution ${info.width}x${info.height} exceeds 1920px (will be resized)`);
    }

    // Check bitrate
    if (info.bitrate > 5000000) {
      warnings.push(`Bitrate ${Math.round(info.bitrate / 1000000)}Mbps exceeds 5Mbps (will be reduced)`);
    }

    // Check duration (Reels: 3-90 seconds)
    if (info.duration < 3) {
      warnings.push('Video shorter than 3 seconds (Instagram Reels minimum)');
    }
    if (info.duration > 90) {
      errors.push('Video longer than 90 seconds (Instagram Reels maximum)');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  } catch (error: any) {
    return {
      valid: false,
      errors: [`Failed to validate video: ${error.message}`],
      warnings: []
    };
  }
}

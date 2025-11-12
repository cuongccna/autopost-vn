import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Database configuration
    const dbHost = process.env.POSTGRES_HOST;
    const dbName = process.env.POSTGRES_DATABASE;
    const hasDbCredentials = !!(process.env.POSTGRES_USER && process.env.POSTGRES_PASSWORD);

    // S3 configuration
    const s3Bucket = process.env.AWS_S3_BUCKET_NAME;
    const hasS3Credentials = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);

    // Email configuration
    const hasSmtpConfig = !!(process.env.SMTP_HOST && process.env.SMTP_USER);

    // Mask sensitive info for security
    const maskedDbHost = dbHost
      ? dbHost.substring(0, 8) + '***'
      : 'NOT_SET';

    const maskedS3Bucket = s3Bucket
      ? s3Bucket.substring(0, 8) + '***'
      : 'NOT_SET';

    return NextResponse.json({
      success: true,
      environment: {
        database: {
          host: maskedDbHost,
          database: dbName || 'NOT_SET',
          hasCredentials: hasDbCredentials
        },
        storage: {
          s3Bucket: maskedS3Bucket,
          hasCredentials: hasS3Credentials,
          region: process.env.AWS_REGION || 'NOT_SET'
        },
        email: {
          hasSmtpConfig,
          smtpHost: process.env.SMTP_HOST || 'NOT_SET'
        },
        nodeEnv: process.env.NODE_ENV,
        debugApiEnabled: process.env.DEBUG_API_ENABLED === 'true'
      }
    });

  } catch (error) {
    console.error('Env debug error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to debug environment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

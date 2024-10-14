import os
import boto3
import logging

s3 = boto3.client('s3')
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    try:
        logger.info(f"Received event: {event}")
        source_bucket = event['detail']['bucket']['name']
        source_key = event['detail']['object']['key']
        destination_bucket = os.environ['CONTENT_BUCKET']
        
        logger.info(f"Copying object {source_key} from {source_bucket} to {destination_bucket}")

        copy_source = {
            'Bucket': source_bucket,
            'Key': source_key
        }

        # Perform the copy
        s3.copy_object(Bucket=destination_bucket, CopySource=copy_source, Key=source_key)

        logger.info(f"Object {source_key} copied to {destination_bucket}")
        return {
            'statusCode': 200,
            'body': f"Successfully copied {source_key} to {destination_bucket}"
        }

    except Exception as e:
        logger.error(f"Error copying object: {e}")
        return {
            'statusCode': 500,
            'body': f"Error copying object: {str(e)}"
        }
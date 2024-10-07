import os
import boto3
import logging

s3 = boto3.client('s3')
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    try:
        source_key = event['detail']['object']['key']
        destination_bucket = os.environ['CONTENT_BUCKET']

        logger.info(f"Checking if object {source_key} exists in {destination_bucket}")

        # Check if the object exists in the content bucket
        try:
            s3.head_object(Bucket=destination_bucket, Key=source_key)

            # Object exists, proceed to delete it
            logger.info(f"Object {source_key} found, deleting it from {destination_bucket}")

            s3.delete_object(Bucket=destination_bucket, Key=source_key)

            logger.info(f"Object {source_key} deleted from {destination_bucket}")
            return {
                'statusCode': 200,
                'body': f"Successfully deleted {source_key} from {destination_bucket}"
            }

        except s3.exceptions.ClientError as e:
            if e.response['Error']['Code'] == '404':
                logger.info(f"Object {source_key} not found in {destination_bucket}")
                return {
                    'statusCode': 404,
                    'body': f"Object {source_key} not found in {destination_bucket}"
                }
            else:
                logger.error(f"Error checking object: {e}")
                raise

    except Exception as e:
        logger.error(f"Error processing event: {e}")
        return {
            'statusCode': 500,
            'body': f"Error processing event: {str(e)}"
        }
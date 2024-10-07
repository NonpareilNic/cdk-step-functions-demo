import * as s3 from 'aws-cdk-lib/aws-s3';

const editorialBucket = new s3.Bucket(this, 'ducktape-EditorialBucket', {
  versioned: true,
});

const contentBucket = new s3.Bucket(this, 'ducktape-ContentBucket', {
  versioned: true,
});
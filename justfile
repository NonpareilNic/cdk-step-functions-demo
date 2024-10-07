deploy-cdk:
    cd app
    @echo "Deploying CDK stack"
    cdk bootstrap
    cdk deploy

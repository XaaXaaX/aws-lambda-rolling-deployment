import { Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as codedeploy from 'aws-cdk-lib/aws-codedeploy';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';

export { LambdaDeploymentConfig } from 'aws-cdk-lib/aws-codedeploy';

export interface LambdaDeploymentProps
  extends codedeploy.LambdaApplicationProps {
  deploymentConfig: codedeploy.ILambdaDeploymentConfig;
  alias: lambda.Alias;
  alarms?: cloudwatch.Alarm[];
}

export class LambdaDeployment extends codedeploy.LambdaApplication {
  public readonly deploymentGroup: codedeploy.LambdaDeploymentGroup;

  constructor(scope: Construct, id: string, props: LambdaDeploymentProps) {
    super(scope, id, props);

    const failureAlarm = new cloudwatch.Alarm(this, "DeploymentAlarm", {
      metric: props.alias.metricErrors(),
      threshold: 1,
      evaluationPeriods: 1,
    });

    const application =  new codedeploy.LambdaApplication(this, 'createItemFunctionApp', {
      applicationName: 'createItemFunctionApp',
    });
    const alarms = [failureAlarm].concat(props.alarms ?? []);
    const deploymentConfig = props.deploymentConfig ?? codedeploy.LambdaDeploymentConfig.ALL_AT_ONCE;

    this.deploymentGroup = new codedeploy.LambdaDeploymentGroup(
      this,
      `${id} CodeDeploy Deployment Group`,
      {
        application: this,
        alias: props.alias,
        alarms,
        deploymentConfig
      }
    );
  }
}
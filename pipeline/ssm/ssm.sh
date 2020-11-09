aws ssm put-parameter --name "/myapp/{your stage}/deploy_role" --value "arn:aws:iam::{your_account#}:role/deployer-role" --type "String"
aws ssm put-parameter --name "/myapp/{your stage}slack_url" --value "url to slack webhook" --type "String"
aws ssm put-parameter --name "/myapp/code_artifact/domain_owner" --value "account id of domain owner" --type "String"
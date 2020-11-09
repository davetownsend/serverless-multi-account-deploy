const superagent = require('superagent');
const middy = require('middy');
const { ssm } = require('middy/middlewares');

const notify = async (event, context) => {
  const { slackUrl } = context;
  let data = getMessage(event);

  try {
    await superagent.post(slackUrl).send(data);
    return `Sent to Slack`;
  } catch (error) {
    return { statusCode: 500 };
  }
};

const getMessage = (event) => {
  const status = event.detail['build-status'];
  const project = event.detail['project-name'];
  let account = getJobAccount(event);
  const deepLink = event.detail['additional-information'].logs['deep-link'];

  let msg = {
    attachments: [
      {
        fallback: `${project}  ${status} - ${account}`,
        pretext: ``,
        color: status === 'SUCCEEDED' ? '#00A542' : '#D00000',
        fields: [
          {
            value:
              status === 'SUCCEEDED'
                ? `Successful deploy to ${account} - CodeBuild Log: ${deepLink}`
                : `Failed deploy to ${account} - CodeBuild Log: ${deepLink}`,
            short: false,
          },
        ],
      },
    ],
  };
  return msg;
};

const getJobAccount = (event) => {
  let jobAccount = 'No account found';
  const envVars = event.detail['additional-information'].environment['environment-variables'];
  if (envVars.some((stage) => stage['value'] === 'dev')) {
    jobAccount = 'DEV';
  } else if (envVars.some((stage) => stage['value'] === 'test')) {
    jobAccount = 'TEST';
  } else if (envVars.some((stage) => stage['value'] === 'prod')) {
    jobAccount = 'PRODUCTION';
  }
  return jobAccount;
};

module.exports.notify = middy(notify).use(
  ssm({
    cache: true,
    cacheExpiryInMillis: 5 * 60 * 1000,
    setToContext: true,
    names: {
      slackUrl: `/myapp/${process.env.STAGE}/slack_url`,
    },
  })
);

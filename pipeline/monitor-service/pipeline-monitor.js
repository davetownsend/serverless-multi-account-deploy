const superagent = require('superagent');
const middy = require('middy');
const { ssm } = require('middy/middlewares');

const notify = async (event, context) => {
  const { slackUrl } = context;
  let data = {};

  if (event.Records[0].Sns) {
    let snsMessage = JSON.stringify(event.Records[0].Sns.Message, null, '  ');
    try {
      let messageData = [];
      let parsedMessage = JSON.parse(event.Records[0].Sns.Message);
      for (let key in parsedMessage) {
        messageData.push(key + ': ' + parsedMessage[key]);
      }
      snsMessage = messageData.join('\n');
    } catch (e) {
      console.error(e);
    }
    data = {
      attachments: [
        {
          fallback: snsMessage,
          pretext: `${event.Records[0].Sns.Subject}`,
          color: '#FFCC00',
          fields: [
            {
              value: snsMessage,
              short: false,
            },
          ],
        },
      ],
    };
  } else {
    return 'Not an SNS msg';
  }
  try {
    await superagent.post(slackUrl).send(data);
    return `Posted to Slack`;
  } catch (error) {
    return { statusCode: 500 };
  }
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

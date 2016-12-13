// Hello this is a quick and dirty hack to route incoming review messages from Appbot to Asana tasks.
// I am sorry to expose you to this quick and dirty code. But hey, at least you get to read it!

var Botkit = require('botkit');
var asana = require('asana');
var express = require('express');

if (!process.env.token) {
  console.log('Error: Specify a Slack bot token in environment.');
  usage_tip();
  process.exit(1);
}

if (!process.env.asanaToken) {
  console.log("Error: Specify an Asana token in environment.");
  usage_tip();
  process.exit(1);
}

// Create the Botkit controller, which controls all instances of the bot.
var controller = Botkit.slackbot({
  debug: false,
  retry: 10,
});

var client = asana.Client.create().useAccessToken(process.env['asanaToken']);

controller.on('message', function(bot, message) {
  console.log(message);
});

controller.on('bot_message', function(bot,message) {
  var section = null;
  if (/iOS/.test(message.text)) {
    section = "228483622216933";
  } else if (/Google Play/.test(message.text)) {
    section = "228483622216934";
  } else {
    console.error("Unknown platform");
    console.error(message);
    return;
  }

  for (var attachment of message.attachments) {
    var starTag = 0;
    var shouldPost = false;

    switch (attachment.title) {
      case "★★★★★":
        starTag = "228475209196936";
        break;
      case "★★★★☆":
        starTag = "228467259979402";
        break;
      case "★★★☆☆":
        starTag = "228475209196933";
        shouldPost = true;
        break;
      case "★★☆☆☆":
        starTag = "228475209196934";
        shouldPost = true;
        break;
      case "★☆☆☆☆":
        starTag = "228475209196935";
        shouldPost = true;
        break;
    }
    if (starTag === 0) {
      console.error("Invalid message: no stars!");
      console.error(message);
      continue;
    }
    console.log(JSON.stringify(message));

    var lines = attachment.text.split("\n");
    var firstLine = lines.shift();
    firstLine = firstLine.substring(1, firstLine.length - 1); // Strip the *'s.
    var request = {
      workspace: "1120786379245",
      memberships: [{project: "228447770082285", section: section}],
      tags: starTag,
      name: firstLine,
      notes: lines.join("\n"),
    }
    console.log(request);

    if (shouldPost) {
      client.tasks.create(request);
    } else {
      console.log("Skipping...");
    }
  }
});

var bot = controller.spawn({
    token: process.env.token,
}).startRTM();

function usage_tip() {
    console.log('~~~~~~~~~~');
    console.log('Execute the bot like this:');
    console.log('token=<MY SLACK TOKEN> asanaToken=<MY ASANA TOKEN> node bot.js');
    console.log('Get a Slack token here: https://my.slack.com/apps/new/A0F7YS25R-bots')
    console.log('~~~~~~~~~~');
}


var dummyWebApp = express();

dummyWebApp.get('/', function (req, res) {
  res.send('Greetings!')
})

dummyWebApp.listen(process.env['PORT'], (err) => {
  if (err) throw err;
});
/*-----------------------------------------------------------------------------
A simple echo bot for the Microsoft Bot Framework. 
-----------------------------------------------------------------------------*/

var restify = require('restify');
var builder = require('botbuilder');
var botbuilder_azure = require("botbuilder-azure");
var LineConnector = require("botbuilder-linebot-connector");

// Setup Express Server
var express = require('express');
var server = express();
server.listen(process.env.port || process.env.PORT || 3980, function () {
    console.log('%s listening to %s', server.name, server.url); 
});

// Create chat connector for LINE
var connector = new LineConnector.LineConnector({
    hasPushApi: false, //you have to pay for push api >.,<
    // your line
    channelId: process.env.channelId || "",
    channelSecret: process.env.channelSecret || "",
    channelAccessToken: process.env.channelAccessToken || ""
});

server.post('/line', connector.listen());  


// Setup Restify Server
/* var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url); 
});

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword,
    openIdMetadata: process.env.BotOpenIdMetadata 
});

// Listen for messages from users 
server.post('/api/messages', connector.listen()); */

/*----------------------------------------------------------------------------------------
* Bot Storage: This is a great spot to register the private state storage for your bot. 
* We provide adapters for Azure Table, CosmosDb, SQL Azure, or you can implement your own!
* For samples and documentation, see: https://github.com/Microsoft/BotBuilder-Azure
* ---------------------------------------------------------------------------------------- */

var tableName = 'botdata';
var azureTableClient = new botbuilder_azure.AzureTableClient(tableName, process.env['AzureWebJobsStorage']);
var tableStorage = new botbuilder_azure.AzureBotStorage({ gzipData: false }, azureTableClient);

// Create your bot with a function to receive messages from the user
var bot = new builder.UniversalBot(connector);

/* ----- This breaks on LINE ----- */
// bot.set('storage', tableStorage); 

// Make sure you add code to validate these fields
var luisAppId = process.env.LuisAppId;
var luisAPIKey = process.env.LuisAPIKey;
var luisAPIHostName = process.env.LuisAPIHostName || 'westus.api.cognitive.microsoft.com';

const LuisModelUrl = 'https://' + luisAPIHostName + '/luis/v2.0/apps/' + luisAppId + '?subscription-key=' + luisAPIKey;

// Main dialog with LUIS
var recognizer = new builder.LuisRecognizer(LuisModelUrl);
var intents = new builder.IntentDialog({ recognizers: [recognizer] })
.matches('Greeting', (s) => {
   console.log("----- Greeting Intent -----");
   s.send(new builder.Message(s).text('大家好我叫 桜愛 請多多指教'));
})
.matches('Info.Colonization', (s, r) => {
   console.log("----- Colonization Intent -----");
   let m = new builder.Message(s)
        .addAttachment(
            //Planet image
            new builder.MediaCard(s).image(builder.CardImage.create(s, 'https://i.imgur.com/f8dX0kA.png'))
        );
   s.send(m);
   s.send(new builder.Message(s).text('小櫻為你帶來了殖民星的資訊哦~'))
})
.matches('Info.Coordinate', (s, r) => {
   console.log("----- Coordinate Intent -----");
   if(r.entities[0] !== undefined){
       console.log(" # Entity found");
       console.log(r.entities[0]);
       s.send(new builder.Message(s).text('這是'+r.entities[0].entity+'的星體資訊哦'));
   }else{
       console.log(" !# Entity NOT found");
       s.send(new builder.Message(s).text('請問你是要找誰的星體資訊？'));
   }
})
.onDefault((s) => {
    console.log("!! Default !!");  
});

bot.dialog('/', intents);

bot.on('conversationUpdate', function (message) {
    // detect event
    switch (message.text) {
        case 'follow':
            break;
        case 'unfollow':
            break;
        case 'join':
            break;
        case 'leave':
            break;
    }
    var isGroup = message.address.conversation.isGroup;
    var txt = isGroup ? "大家好我叫「桜愛」 請多多指教！" : "Hello " + message.from.name;
    var reply = new builder.Message()
        .address(message.address)
        .text(txt);
    bot.send(reply);
    //bot.beginDialog(message.address, "hello")
});

bot.dialog("SearchUser", [
    s => {
        builder.Prompts.text(s, "你要找誰");
    },
    (s, r) => {
        s.send("oh!" + r.response)
        s.endDialog()
    }
])

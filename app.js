require('dotenv').config();
var builder = require('botbuilder');
var restify = require('restify');
const SpaceXAPI = require('SpaceX-API-Wrapper');
 
let SpaceX = new SpaceXAPI();


var server = restify.createServer();

server.listen(process.env.PORT || 3978, function () {
    console.log("Serveur en écoute");
});

//Create chat connector for communicating with the Bot Framwork Service
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

//listen for messages from users
server.post('/api/messages', connector.listen());

var inMemoryStorage = new builder.MemoryBotStorage();


/** exercice 3 chat avec option recupérer d'un json. **/

var bot = new builder.UniversalBot(connector, [
    function (session) { // lancer la session de discussion
        session.beginDialog('menu');
    }

]).set('storage', inMemoryStorage);

/**
 * Mesage d'accueil lors de la connexion
 */

bot.on('conversationUpdate', function (message) {
    if (message.membersAdded) {
        message.membersAdded.forEach(function (identity) {
            if (identity.id === message.address.bot.id) {
                bot.beginDialog(message.address, '/');
            }
        });
    }
    else if (message.membersRemoved) {
        // See if bot was removed
        var botId = message.address.bot.id;
        for (var i = 0; i < message.membersRemoved.length; i++) {
            if (message.membersRemoved[i].id === botId) {
                // Say goodbye
                reply = new builder.Message()
                    .address(message.address)
                    .text("Goodbye");
                bot.send(reply);
                break;
            }
        }
    }
});


const menuItems = { // json des différentes options
    "Next launch": {
        item: "option1"
    },
    "Last launch": {
        item: "option2"
    },
    "All past launch": {
        item: "option3"
    },
    "All upcoming launch": {
        item: "option4"
    },
    "All launch": {
        item: "option5"
    }
};

bot.dialog('menu', [
    // Step 1
    function (session) {

        builder.Prompts.choice(session,
            "Launch menu",
            menuItems,
            {listStyle: 3 })
    },
    //Step 2
    function(session, results){
        var choice = results.response.entity;
        session.beginDialog(menuItems[choice].item);
    }
]);

bot.dialog('option1', [
    function (session) {
        SpaceX.getCompanyInfo(function(err, info){
            session.send(info);
        });   
    }
]);

bot.dialog('option2', [
    function (session) {
        SpaceX.getLatestLaunch(function(err, info){
            session.send(info)
        });
    }
]);

bot.dialog('option3', [
    function (session) {
        SpaceX.getAllPastLaunches(filters, function(err, info){
            session.send(info)
        });
    }
]);

bot.dialog('option4', [
    function (session) {
        SpaceX.getAllUpcomingLaunches(filters, function(err, info){
            session.send(info)
        });
    }
]);

bot.dialog('option5', [
    function (session) {
        SpaceX.getAllLaunches(filters, function(err, info){
            session.send(info)
        });
    }
]);
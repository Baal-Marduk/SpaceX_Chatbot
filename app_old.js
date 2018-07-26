/*var builder = require('botbuilder');
var restify = require('restify');

var server = restify.createServer();
server.listen(3978, function() {
    console.log("server démarré: " + server.name)
});

// crée un bot en mode console - écoute ce qui se passe sur la console
// var connector = new builder.ConsoleConnector().listen();
var connector = new builder.ChatConnector();
server.post("/api/messages", connector.listen());

var bot = new builder.UniversalBot(connector, [
    function (session)

] function(session) {
    session.send("Coucou Mehdi, params: %s", session.message.text);
});

bot.dialog('dialog1', [
    function (session){
        builder.Prompts.text(session, 'c'/'est quoi ton prénom ? ');
    },
    function (session, result){
        session.send('bonjour %s, result');
    }
]);
*/


require('dotenv').config();
var builder = require('botbuilder');
var restify = require('restify');


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


/***
 * Exercice 2 dialogue simple
 */
/*

var bot = new builder.UniversalBot(connector, [
    function (session) { // lancer la session de discussion
        session.beginDialog('greetings', session.userData.profile);
    },
    function(session, results) {
    session.userData.profile = results.response;
    session.send(`Hello ${session.userData.profile.name} !!`);
    }

]).set('storage', inMemoryStorage);

bot.dialog('greetings', [
    // Step 1
    function (session, args, next) { // next sert a sauter une étape du dialogue
        session.dialogData.profile = args ||{};
        if(!session.dialogData.profile.name) {
            builder.Prompts.text(session, 'What is your name ?');
            // si il manque le name je le demande à l'utilisateur

        } else next(); // si j'ai l'information, je passe à l'autre dialogue dialogue

    },

    // Step 2
    function (session, results) {
        if(results.response) {
            session.dialogData.profile.name = results.response;
        }
        session.endDialogWithResult({response: session.dialogData.profile});

    }
]);
*/


/** exercice 3 chat avec option recupérer d'un json. **/

var bot = new builder.UniversalBot(connector, [
    function (session) { // lancer la session de discussion
    session.beginDialog('menu');
    }

]).set('storage', inMemoryStorage);

const menuItems = { // json des différentes options
    "toto": {
        item: "option1"
    },
    "titi": {
        item: "option2"
    },
    "tutu": {
        item: "option3"
    }
};

bot.dialog('menu', [
    // Step 1
    function (session) {

        builder.Prompts.choice(session,
            "Choose item option",
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
        session.send('We are in the option 1 dialog !')
    }
]);

bot.dialog('option2', [
    function (session) {
        session.send('We are in the option 2 dialog !')
    }
]);

bot.dialog('option3', [
    function (session) {
        session.send('We are in the option 3 dialog !')
    }
]);


/*
var bot = new builder.UniversalBot(connector, [
    function (session) {
        session.beginDialog('dialog1');
    },
    function (session, result) {
        session.send("Coucou %s", result.response);
    }
]);

bot.dialog('dialog1', [
    function (session) {
        builder.Prompts.text(session, "c'est quoi ton prénom");
    },
    function (session, result) {
        session.endDialogWithResult(result);
    }
]);
*/
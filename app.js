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
            session.send(JSON.stringify(info));
        });   
    }
]);

bot.dialog('option2', [
    function (session) {
        SpaceX.getLatestLaunch(function(err, info){
            var card= {
                "attachments": [
                    {
                        "contentType": "application/vnd.microsoft.card.adaptive",
                        "content": {
                            "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
                            "type": "AdaptiveCard",
                            "version": "1.0",
                            "body": [
                                {
                                    "type": "Container",
                                    "items": [
                                        {
                                            "type": "TextBlock",
                                            "text": "Space X - Last Launch",
                                            "weight": "bolder",
                                            "size": "medium"
                                        },
                                        {
                                            "type": "ColumnSet",
                                            "columns": [
                                                {
                                                    "type": "Column",
                                                    "width": "auto",
                                                    "items": [
                                                        {
                                                            "type": "Image",
                                                            "url": "",
                                                            "size": "small",
                                                            "style": "person"
                                                        }
                                                    ]
                                                },
                                                {
                                                    "type": "Column",
                                                    "width": "stretch",
                                                    "items": [
                                                        {
                                                            "type": "TextBlock",
                                                            "text": "Founder : "+info.founder,
                                                            "weight": "bolder",
                                                            "wrap": true
                                                        },
                                                        {
                                                            "type": "TextBlock",
                                                            "spacing": "none",
                                                            "text": "Created {{DATE(2002-03-02T06:08:39Z, SHORT)}}",
                                                            "isSubtle": true,
                                                            "wrap": true
                                                        }
                                                    ]
                                                }
                                            ]
                                        }
                                    ]
                                },
                                {
                                    "type": "Container",
                                    "items": [
                                        {
                                            "type": "TextBlock",
                                            "text": info.summary,
                                            "wrap": true
                                        },
                                        {
                                            "type": "FactSet",
                                            "facts": [
                                                {
                                                    "title": "Adress:",
                                                    "value": info.headquarters.address+', '+info.headquarters.city+', '+info.headquarters.state,
                                                },
                                                {
                                                    "title": "Employees:",
                                                    "value": info.employees,
                                                },
                                                {
                                                    "title": "Launch sites:",
                                                    "value": info.launch_sites,
                                                },
                                                {
                                                    "title": "Vehicles:",
                                                    "value": info.vehicles,
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ],
                            "actions": [
                                {
                                    "type": "Action.ShowCard",
                                    "title": "Comment",
                                    "card": {
                                        "type": "AdaptiveCard",
                                        "body": [
                                            {
                                                "type": "Input.Text",
                                                "id": "comment",
                                                "isMultiline": true,
                                                "placeholder": "Enter your comment"
                                            }
                                        ],
                                        "actions": [
                                            {
                                                "type": "Action.Submit",
                                                "title": "OK"
                                            }
                                        ]
                                    }
                                },
                                {
                                    "type": "Action.OpenUrl",
                                    "title": "View",
                                    "url": "http://adaptivecards.io"
                                }
                            ]
                        }
                    }
                ]
};
            var msg = new builder.Message(session).addAttachment(card);
            session.send(msg);
            //session.send(JSON.stringify(info));
        });
    }
]);

bot.dialog('option3', [
    function (session) {
        SpaceX.getAllPastLaunches({}, function(err, info){
            session.send(JSON.stringify(info));
        });
    }
]);

bot.dialog('option4', [
    function (session) {
        SpaceX.getAllUpcomingLaunches({}, function(err, info){
            session.send(JSON.stringify(info));
        });
    }
]);

bot.dialog('option5', [
    function (session) {
        SpaceX.getCompanyInfo(function(err, info){
            session.send(JSON.stringify(info));
        });
    }
]);

function createCard(){

}
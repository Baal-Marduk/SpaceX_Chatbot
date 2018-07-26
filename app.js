//import { ListStyle } from 'botbuilder';
//import SpaceX from 'Services/spacex'

require('dotenv').config();
var builder = require('botbuilder');
var restify = require('restify');

// var spacexClient = require('./Services/spacex')
// let spacex = new spacexClient();
const SpaceXAPI = require('SpaceX-API-Wrapper');
let SpaceX = new SpaceXAPI();



var server = restify.createServer();
server.listen(process.env.PORT || 3978, function () {
    console.log("serveur", server.name, "démarré");
});

var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

server.post('/api/messages', connector.listen());
var inMemoryStorage = new builder.MemoryBotStorage();
var bot = new builder.UniversalBot(connector, [
    function (session) {
        //Lancement du premier dialogue 'greetings'
        session.send(`Welcome to the chatbot Space X, How can i help you ?`);
        session.beginDialog('menu', session.userData.profile);
    }
]).set('storage', inMemoryStorage);

bot.on('conversationUpdate', function (message) {
    if (message.membersAdded) {
        message.membersAdded.forEach(function (identity) {
            if (identity.id === message.address.bot.id) {
                bot.beginDialog(message.address, '/');
            }
        });
    }
});

var menuItems = {
    "About SpaceX": {
        item: "getCompanyInfo",
    },
    "Latest launch": {
        item: "latestLaunch",
    },
    "Next launch": {
        item: "nextLaunch",
    },
    "All successuful launches": {
        item: "successufulLaunches",
    },
};

bot.dialog('menu', [
    //step 1    
    function (session) {
        builder.Prompts.choice(session,
            "Click on the buttons to have an information about Space X :",
            menuItems,
            { listStyle: 3 }
        );
    },
    //step 2
    function (session, results) {
        var choice = results.response.entity;
        session.beginDialog(menuItems[choice].item);
    }
]);

bot.dialog('getCompanyInfo', [
    function (session) {
        SpaceX.getCompanyInfo(function (err, info) {
            var cardCompanyInfo = {
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
                                            "text": "Space X - Info Company",
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
                                                            "url": "https://cdn2.hubspot.net/hub/250707/hubfs/Blog_Images/100_entrepreneurs_lessons_advice/elon_musk.png?t=1448928230514&width=300&height=300",
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
                                    "type": "Action.OpenUrl",
                                    "title": "More details",
                                    "url": "http://www.spacex.com/"
                                }
                            ]
                        }
                    }
                ]
            };
            session.send(cardCompanyInfo);
        });
    }
]);
bot.dialog('nextLaunch', [
    function (session) {
        session.sendTyping();
        SpaceX.getNextLaunch(function (err, launch) {
            var adaptiveCardMessage = buildLaunchAdaptiveCard(launch, session);
            session.send(JSON.stringify(launch));
            //session.send(adaptiveCardMessage);
        });
    },
]);

bot.dialog('latestLaunch', [
    function (session) {
        session.sendTyping();
        SpaceX.getLatestLaunch(function (err, launch) {
            var adaptiveCardMessage = buildLaunchAdaptiveCard(launch, session);
            // session.send(JSON.stringify(launch));
            session.send(adaptiveCardMessage);
        });
    },
]);

bot.dialog('successufulLaunches', [
    function (session) {
        session.sendTyping();
        SpaceX.getAllLaunches({ launch_success: true }, function (err, launches) {
            session.send(JSON.stringify(launches));
        });
    },
]);

function buildLaunchAdaptiveCard(launch, session) {
    var adaptiveCardMessage = new builder.Message(session)
        .addAttachment({
            contentType: "application/vnd.microsoft.card.adaptive",
            content: {
                type: "AdaptiveCard",
                body: [
                    {
                        "type": "Container",
                        "items": [
                            {
                                "type": "TextBlock",
                                "text": launch.mission_name,
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
                                                "url": launch.links.mission_patch_small,
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
                                                "text": "Flight number : "+launch.flight_number,
                                                "weight": "bolder",
                                                "wrap": true
                                            },
                                            {
                                                "type": "TextBlock",
                                                "spacing": "none",
                                                "text": "Launched {{DATE("+launch.launch_date_local+", SHORT)}}",
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
                                "type": "FactSet",
                                "facts": [
                                    {
                                        "title": "Rocket type:",
                                        "value": launch.rocket.rocket_name
                                    },
                                    {
                                        "title": "Sucess:",
                                        "value": launch.launch_success
                                    },
                                    {
                                        "title": "Launch site:",
                                        "value": launch.launch_site.site_name
                                    }
                    
                                ]
                            }
                        ]
                    }
                ],
                "actions": [
                    {
                        "type": "Action.OpenUrl",
                        "title": "Video link",
                        "url": launch.links.video_link
                    },
                    {
                        "type": "Action.ShowCard",
                        "title": "Payloads",
                        "card": {
                            "type": "AdaptiveCard",
                            "body": [
                                {
                                    "type": "TextBlock",
                                    "id": "comment",
                                    "isMultiline": true,
                                    "placeholder": "Enter your comment"
                                },
                                {
                                    "type": "Container",
                                    "items": [
                                        {
                                            "type": "FactSet",
                                            "facts": [
                                                {
                                                    "title": "Payload type: ",
                                                    "value": launch.rocket.second_stage.payloads[0].payload_type
                                                },
                                                {
                                                    "title": "Payload mass: ",
                                                    "value": launch.rocket.second_stage.payloads[0].payload_mass_kg
                                                },
                                                {
                                                    "title": "Orbit: ",
                                                    "value": launch.rocket.second_stage.payloads[0].orbit
                                                }
                                
                                            ]
                                        }
                                    ]
                                }
                            ],
                        }
                    }
                ]
            }
        });
        return adaptiveCardMessage;
}
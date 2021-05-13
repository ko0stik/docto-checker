# COVID-19 Docto Checker

## Preambule

A mini-script specifically designed to fetch every X minutes vax center availabitilies for people waiting for free slots to appear.
Highly contextual script which might makes sense if you have no comorbidity in France around half of May, 2021.

If a result is found, it will prompt the url on the command line (if everything goes fine, it hasn't been tested yet since no slots were found) and send a telegram message to a designated channel (you'll need some config on this end to do that).

This script has no pretention and should be considered as such.

## Installation

``` js
npm i
```

## Configuration

```
vim config/default.json
```

```json
{
    "telegramBotToken": "",
    "timer": 1,
    "telegramConvID": "",
    "doctolibSearchBaseURL": "",
    "fetchConfig": ""
}
```

- `timer` is the interval used between queries
- `telegramConvID` after you created a group and invited your bot, you can invite @getidsbot to the conv to get the convID. Here is a [stack overflow post explaining this](https://stackoverflow.com/questions/32423837/telegram-bot-how-to-get-a-group-chat-id)
- `fetchConfig` is the json dump you get when you copy from network the `node-fetch` of a query. It will mimick your web session
-  `doctolibSearchBaseURL` is the url your would normally refresh in order to get the slots
- `telegramBotToken` is the token you'll get once you have created your own bot by talking to their. You'll need to invite your bot in the group where you plan to get the udpates.

## Launch

```shell
npm start
```

## Troubleshooting

It seems center IDs are refreshed every once in a while (every hour or so), causing the stored IDs to be flushed. To fix this, you need to relaunch the script in order to get new center ids from doctolib. An automated refresher will come soon.
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

## Launch

```shell
tsc ; node ./build/main.js
```

## Troubleshooting

It seems center IDs are refreshed every once in a while (every hour or so), causing the stored IDs to be flushed. To fix this, you need to relaunch the script in order to get new center ids from doctolib. An automated refresher will come soon.
import { TelegramClient } from "messaging-api-telegram";
import fetch from "node-fetch";
import * as cheerio from 'cheerio';
import axios from "axios";
import * as config from "config";


const searchURL = config.get("doctolibSearchBaseURL") as string;
const telegramToken = config.get("telegramBotToken") as string;
const convId = config.get("telegramConvID") as string;
// CENTER_ID is replace by variable corresponding to center
const baseURL = "https://www.doctolib.fr/search_results/CENTER_ID.json?ref_visit_motive_ids%5B%5D=6970&ref_visit_motive_ids%5B%5D=7005&speciality_id=5494&search_result_format=json&force_max_limit=2";
const timer = config.get("timer") as number; // in minutes
var count = 0;

const init = async (): Promise<string[]> => {
    client.sendMessage(convId, "Launching **Scrapping**\nI'll tell you right away if something comes up.");
    return refresh();
};

const refresh = async (): Promise<string[]> => {
    var ret = [];
    const { data } = await axios.get(searchURL);
    const $ = cheerio.load(data);
    const selector = ".dl-search-result > div.dl-search-result-calendar > div";
    const items = $(selector);
    items.map((i, e) => {
        let j = JSON.parse(e['attribs']['data-props']);
        ret.push(j["searchResultId"]);
    });
    return ret;
}

const client = new TelegramClient({
    accessToken: telegramToken
});


const launchSearch = (targetIDs: string[]) => {
    console.log("\n-----------------\n");
    count++;
    targetIDs.forEach((targetID, index) => {
        const targetURL = baseURL.replace("CENTER_ID", targetID);
        fetch(targetURL, config.get("fetchConfig")).then(async response => {
            const res = await response.json();
            try {
                if (res["availabilities"] > 0) {
                    console.log(res);
                    client.sendMessage(convId, "A center seems to have availabilities. Go check https://www.doctolib.fr" + res["search_result"]["url"]);
                } else if (!res["search_result"]) { // meaning we need to refresh IDs
                    if (index == 0) {
                        targetIDs = await refresh();
                    }
                } else {
                    console.log("no availability for center " + res["search_result"]["id"]);
                }
            } catch (e) {
                console.log(res, e);
            }
        });
    });
}

init().then(targetIDs => {
    launchSearch(targetIDs);
    setInterval(() => launchSearch(targetIDs), timer * 60 * 1000);
});
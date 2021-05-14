import { TelegramClient } from "messaging-api-telegram";
import fetch from "node-fetch";
import * as cheerio from 'cheerio';
import axios from "axios";
import * as config from "config";

const contextIsTest = (): boolean => config.get("testMode");
const searchURL = contextIsTest() ?
    "https://www.doctolib.fr/vaccination-covid-19/bordeaux-cours-de-luze?ref_visit_motive_ids[]=6970&ref_visit_motive_ids[]=7005&ref_visit_motive_ids[]=7107&ref_visit_motive_ids[]=7945" :
    config.get("doctolibSearchBaseURL") as string;
// CENTER_ID is replace by variable corresponding to center
const baseURL = contextIsTest() ?
    "https://www.doctolib.fr/search_results/CENTER_ID.json?limit=6&ref_visit_motive_ids%5B%5D=6970&ref_visit_motive_ids%5B%5D=7005&ref_visit_motive_ids%5B%5D=7107&ref_visit_motive_ids%5B%5D=7945&speciality_id=5494&search_result_format=json" :
    "https://www.doctolib.fr/search_results/CENTER_ID.json?ref_visit_motive_ids%5B%5D=6970&ref_visit_motive_ids%5B%5D=7005&speciality_id=5494&search_result_format=json&force_max_limit=2";
const telegramToken = config.get("telegramBotToken") as string;
const convId = config.get("telegramConvID") as string;
const timer = config.get("timer") as number; // in minutes

const init = async (): Promise<string[]> => {
    sendTelegramNotification("Launching **Scrapping**\nI'll tell you right away if something comes up.");
    console.log([
        "Environment:",
        contextIsTest() ? "test" : "prod",
        "searchURL:",
        searchURL,
        "baseURL:",
        baseURL,
        "timer:",
        timer.toString()
    ].join("\n"));
    return refresh();
};

const sendTelegramNotification = (msg: string) => {
    if (!contextIsTest) {
        client.sendMessage(convId, msg);
    } else {
        console.log(msg);
    }
}

/**
 * refresh queries searchURL in order to extract embed data being used for separate private api calls
 * @returns An array of IDs used to then query the private API, looking for availabilities
 */
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

type availability = {
    date: string;
    slots: slot[];
    substitution: any;
}

type slot = {
    agenda_id: string;
    start_date: string;
    end_date: string;
    steps: object[]
}

const processAvailabilities = (az: availability[]): string[] => {
    let ret: string[] = [];
    az.forEach(a => {
        if (a.slots.length > 0) {
            ret.push(a.date);
        }
    })
    return ret;
}

const launchSearch = (targetIDs: string[]) => {
    console.log("\n-----------------\n");
    targetIDs.forEach((targetID, index) => {
        var mess = "";
        const targetURL = baseURL.replace("CENTER_ID", targetID);
        fetch(targetURL, config.get("fetchConfig")).then(async response => {
            const res = await response.json();
            try {
                if (res.availabilities && res.availabilities.length > 0) {
                    const center = res.search_result.name_with_title;
                    const url = `https://www.doctolib.fr/${res.search_result.url}`;
                    var processedRes = processAvailabilities(res.availabilities);
                    if (processedRes.length > 0) {
                        sendTelegramNotification([
                            `Slots available for ${center}`,
                            processedRes.join(", "),
                            `please visit: ${url}`
                        ].join("\n"));
                    }
                } else if (!res["search_result"]) { // meaning we need to refresh IDs
                    mess = "need to update targetIDs, meaning creneaux might be incoming\n";
                    console.log(mess);
                } else {
                    console.log("no availability for center " + res["search_result"]["id"]);
                }
                if (mess) {
                    sendTelegramNotification(mess);
                }
            } catch (e) {
                console.log(res, e);
            }
        });
    });
}

init().then(targetIDs => {
    launchSearch(targetIDs);
    setInterval(async () => {
        targetIDs = await refresh();
        launchSearch(targetIDs)
    }, timer * 60 * 1000);
});
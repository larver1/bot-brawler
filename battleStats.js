const BotBuilder = require('./Helpers/BotBuilder');
const fs = require('fs');
const botData = JSON.parse(fs.readFileSync('./Data/Bots/botData.json'));
const botResults = { ...botData };
const chips = ["power", "lifespan", "viral", "firewall", "balanced"];
const BotObj = require("./Data/Bots/BotObj");   
const Ascii = require("ascii-table");

async function battleSim(bot1, bot2) {
    let bot1Percent = 0.0;
    let bot2Percent = 0.0;

    let bot1BestChip = "balanced";
    let bot2BestChip = "balanced";
    
    let bot1MaxPercent = 0.0;
    let bot2MaxPercent = 0.0;

    for(let i = 0; i < chips.length; i++) {
        for(let j = 0; j < chips.length; j++) {
            bot1.item = chips[i];
            bot2.item = chips[j];

            let results = await bot1.battle(bot2);
            bot1Percent += results.yourPercent;
            bot2Percent += results.otherPercent;
        
            if(results.yourPercent > bot1MaxPercent) {
                bot1MaxPercent = results.yourPercent;
                bot1BestChip = bot1.item;
            }
            if(results.otherPercent > bot2MaxPercent) {
                bot2MaxPercent = results.otherPercent;
                bot2BestChip = bot2.item;
            }        
        }
    }

    return [(bot1Percent / Math.pow(chips.length, 2)), (bot2Percent) / Math.pow(chips.length, 2), bot1BestChip, bot2BestChip];

}

async function battleAllBots() {  
    const Table = new Ascii("Battle Stats");
    Table.addRow(`Bot Name`, `Winrate`, `Balanced`, `Power`, `Lifespan`, `Viral`, `Firewall`);
  
    for(let i = 0; i < botData.length; i++) {
        botData[i].percentage = 0.0;
        botData[i].balanced = 0;
        botData[i].power = 0;
        botData[i].viral = 0;
        botData[i].lifespan = 0;
        botData[i].firewall = 0;
        for(let j = 0; j < botData.length; j++) {
            const firstBot = await BotBuilder.build(null, { bot_type: botData[i].name, item: "balanced", exp: 0, model_no: "battle test" }, "bob");
            const secondBot = await BotBuilder.build(null, { bot_type: botData[j].name, item: "balanced", exp: 0, model_no: "battle test" }, "bob");

            const firstBotObj = await new BotObj(null, firstBot);
            const secondBotObj = await new BotObj(null, secondBot);

            let results = await battleSim(firstBotObj, secondBotObj);
            botData[i].percentage += results[0];
            botData[i][results[2]] += 1;
        }

        Table.addRow(`${botData[i].name}`, `${botData[i].percentage / botData.length}%`, `${botData[i]["balanced"]}`, `${botData[i]["power"]}`, `${botData[i]["lifespan"]}`, `${botData[i]["viral"]}`, `${botData[i]["firewall"]}`);
    }

    console.log(Table.toString());

}

battleAllBots();
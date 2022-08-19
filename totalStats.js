const fs = require('fs');
const botData = JSON.parse(fs.readFileSync('./Data/Bots/botData.json'));

const totalStats = {
    "basePower": 0,
    "baseLifespan": 0,
    "baseViral": 0,
    "baseFirewall": 0,
}

for(const bot of botData) {
    totalStats.basePower += bot.basePower;
    totalStats.baseLifespan += bot.baseLifespan;
    totalStats.baseViral += bot.baseViral;
    totalStats.baseFirewall += bot.baseFirewall;
}

console.log(totalStats);
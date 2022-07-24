const { MessageActionRow, MessageButton } = require('discord.js');
const { v4: uuidv4 } = require('uuid');
const clawEmoji = `<:claw:980019643458670633>`;
const { promisify } = require('util');
const sleep = promisify(setTimeout);

const prizes = {
    "t1": 50,
    "t2": 125,
    "t3": 250
}

module.exports = {
    name: "claw",
    async execute(interaction, utils, level, difficulty, finishedEvent) {

        let gridX = 5;
        let gridY = 5;
        let grid = [];
        let score = 0;
        let turns = 10;
        let leftId = uuidv4();
        let rightId = uuidv4();
        let selectId = uuidv4();
        let finishId = uuidv4();

        // Add claw to grid
        let clawPos = {
            x: 0,
            y: 0
        }

        if(level) {
            level = level.split("x");
            gridX = parseInt(level[0]);
            gridY = parseInt(level[1]);
        }

        switch(difficulty) {
            case "Easy":
                turns = 10;
                break;
            case "Normal":
                turns = 8;
                break;
            case "Hard":
                turns = 5;
                break;
            default:
                turns = 10;
                break;
        }

        // Start with empty grid
        grid = this.generateGrid(gridX, gridY, clawPos);

        // Add necessary components
        const Status = new utils.embed(interaction, utils.user)
                .setDescription(`Press any button to start playing!\n\n**__Score:__** ${score}\n**__Moves left__**: ${turns}`)

        const Buttons = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId(leftId)
                .setLabel('Left')
                .setStyle('SECONDARY')
                .setEmoji(`◀`),
            new MessageButton()
                .setCustomId(rightId)
                .setLabel('Right')
                .setStyle('SECONDARY')
                .setEmoji(`▶`),
        );

        const Select = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId(selectId)
                .setLabel('Select')
                .setStyle('SUCCESS')
                .setEmoji('⏬'),
            new MessageButton()
                .setCustomId(finishId)
                .setLabel('Finish')
                .setStyle('DANGER')
        );

        let msg = this.makeGrid(grid);
        await interaction.editReply({ 
                content: msg,
                components: [Buttons, Select],
                embeds: [Status]
            }).catch((e) => utils.consola.error(e));
    
        const filter = i => (i.user.id === interaction.user.id && (i.customId == leftId || i.customId == rightId || i.customId == selectId || i.customId == finishId));
        const collector = interaction.channel.createMessageComponentCollector({ filter,  time: 120000, errors: ['time'] });
        
        collector.on('collect', async i => {
            await i.deferUpdate().catch(e => utils.consola.error(e));
            let newPos = { ...clawPos }
            let components = [Buttons, Select];
            let action = "";

            if(turns <= 0) {
                collector.emit(`end`);
                return;
            }

            switch(i.customId) {
                case finishId:
                    collector.emit(`end`);
                    return;
                case leftId:
                    if(clawPos.x > 0) {
                        newPos.x = clawPos.x - 1;
                        if(grid[newPos.y][newPos.x] == "x") {
                            action = "Moved to the left";
                            break;
                        }
                    }
                    return;
                case rightId:
                    if(clawPos.x < gridX - 1) {
                        newPos.x = clawPos.x + 1;
                        if(grid[newPos.y][newPos.x] == "x") {
                            action = "Moved to the right";
                            break;
                        }
                    }
                    return;
                case selectId:
                    newPos = this.clawDown(grid, clawPos, gridY);
                    components = [];
                    action = "Picking prize...";
                    if(!newPos)
                        return;
                    break;
            }

            turns--;

            grid[clawPos.y][clawPos.x] = 'x';
            grid[newPos.y][newPos.x] = 'c';
            msg = this.makeGrid(grid);
            clawPos = newPos;

            Status.setDescription(`${action}\n\n**__Score:__** ${score}\n**__Moves left__**: ${turns}`)

            await interaction.editReply({ 
                content: msg,
                components: components,
                embeds: [Status]
            }).catch((e) => utils.consola.error(e));

            if(i.customId == selectId) {
                // Get prize and determine score
                let treasureFound = grid[newPos.y + 1][newPos.x];            
                if(treasureFound == "t3")
                    await utils.dbAchievements.checkTask(interaction, utils.user.username, "Jackpot");

                score += prizes[treasureFound];
                await sleep(5000);
                Status.setDescription(`Successfully picked prize!\n\n**__Score:__** ${score}\n**__Turns left__**: ${turns}`);
                
                // Get rid of item
                grid[newPos.y + 1][newPos.x] = "x";
                msg = this.makeGrid(grid);
                
                await interaction.editReply({ 
                    content: msg,
                    components: [Buttons, Select],
                    embeds: [Status]
                }).catch((e) => utils.consola.error(e));
            }

        });

        collector.on('end', async () => {

            let parts = (score / 10) + (turns * 2);
            let won = score < 20 ? false : true;

            switch(difficulty) {
                case "Normal":
                    parts *= 2;
                    break;
                case "Hard":
                    parts *= 3;
                    break;
                default:
                    break;
            }

            finishedEvent.emit('finished', { parts: parts, won: won });

        });

    },
    clawDown(grid, clawPos, gridY) {
        let newPos = { ...clawPos };
        let x = newPos.x;
        let success = false;

        // Find the closest treasure and places claw above it
        for(let y = 0; y < gridY; y++) {
            if(grid[y][x].includes("t")) {
                newPos.y = y - 1;
                success = true;
                break;
            }
        }

        if(success)
            return newPos;

        return false;

    },
    generateGrid(gridX, gridY, clawPos) {
        let grid = [];
        let countTreasure = 0;
        let treasureProb = 0.10;

        // Add blank canvas
        for(let y = 0; y < gridY; y++) {
            grid[y] = [];
            for(let x = 0; x < gridX; x++) {
                 grid[y][x] = "x"; 
            }
        }

        // Add treasure
        while(!countTreasure) {
            countTreasure = 0;
            for(let x = 0; x < gridX; x++) {
                for(let y = gridY - 1; y > 1; y--) {
                    if(treasureProb < Math.random()) {
                        treasureProb = Math.max(0.2, (x + 1) / (gridX));
                        break;
                    }

                    let treasureChance = Math.random();
                    if(treasureChance > 0.90)
                        grid[y][x] = "t3";
                    else if(treasureChance > 0.60)
                        grid[y][x] = "t2";
                    else
                        grid[y][x] = "t1";
    
                    countTreasure++;
                    treasureProb = Math.max(0.2, (x + 1) / (gridX));
                }
            }
        }

        // Add claw
        grid[clawPos.y][clawPos.x] = "c";
        return grid;
    },
    makeGrid(grid) {
        let msg = ``;

        // Prints grid of emojis based on grid input
        for(let y = 0; y < grid.length; y++) {
            for(let x = 0; x < grid[y].length; x++) {
                switch(grid[y][x]) {
                    case 'x':
                        msg += `⬛`;
                        break;
                    case 't1':
                        msg += `🟩`;
                        break;
                    case 't2':
                        msg += `🟨`;
                        break;
                    case 't3':
                        msg += `🟧`;
                        break;
                    case 'c':
                        msg += `${clawEmoji}`;
                        break;
                    default:
                        break;
                }
            }

            msg += `\n`;
        }

        return msg;

    },
}

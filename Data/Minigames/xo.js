const { MessageActionRow, MessageButton, MessageSelectMenu } = require('discord.js');
const { v4: uuidv4 } = require('uuid');
const { promisify } = require('util');
const sleep = promisify(setTimeout);

module.exports = {
    name: "xo",
    async execute(interaction, utils, level, difficulty) {
        console.log("xo game");
        let gridX = 3;
        let gridY = 3;
        let selectXId = uuidv4();
        let selectYId = uuidv4();
        let confirmId = uuidv4();

        // Make empty grid
        let grid = this.generateGrid(gridX, gridY);
        let msg = this.makeGrid(grid);
        
        // Setup buttons and menus
        let optionsX = this.makeSelectMenu(gridX);
        let optionsY = this.makeSelectMenu(gridY);

        const Status = new utils.embed(interaction, utils.user)
            .setTitle(`Tic Tac Toe`)
            .setDescription(`Pick an X and Y co-ordinate, and press confirm.`)

        const SelectX = new MessageActionRow()
        .addComponents(
            new MessageSelectMenu()
                .setCustomId(selectXId)
                .setPlaceholder('Choose X Position')
                .addOptions([optionsX]),
        );

        const SelectY = new MessageActionRow()
        .addComponents(
            new MessageSelectMenu()
                .setCustomId(selectYId)
                .setPlaceholder('Choose Y Position')
                .addOptions([optionsY]),
        );

        const confirmButton = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId(confirmId)
                .setLabel('Confirm')
                .setStyle('SUCCESS'),
        )

        await interaction.editReply({
            content: msg,
            components: [SelectX, SelectY, confirmButton],
            embeds: [Status]
        }).catch((e) => console.log(e));

        let playX = 0;
        let playY = 0;
        let playerWon = false;
        let turns = 0;

        const filter = i => (i.user.id === interaction.user.id && (i.customId == confirmId || i.customId == selectXId || i.customId == selectYId));
        const collector = interaction.channel.createMessageComponentCollector({ filter });
        collector.on('collect', async i => {
            await i.deferUpdate()
                .catch(e => utils.consola.error(e));

            switch(i.customId) {
                case selectXId:
                    playX = i.values;
                    return;
                case selectYId:
                    playY = i.values;
                    return;
                case confirmId:
                    if(grid[playY][playX] != '-')
                        return;
                    grid[playY][playX] = 'x';
                    break;
            }

            msg = this.makeGrid(grid);
            turns++;

            let checkWon = this.checkWon(grid, 'x', playX, playY, gridX, gridY);

            // If player won, then finish
            if(checkWon) {
                playerWon = true;
                collector.emit(`end`);
                return;
            }

            playX = 0;
            playY = 0;

            Status.setDescription(`You picked [${playX + 1}, ${playY + 1}]\nNow for the opponent's turn`);

            await interaction.editReply({
                content: msg,
                components: [],
                embeds: [Status]
            }).catch((e) => console.log(e));

            // Other player finds a random move
            let otherPlay = this.enemyMove(grid, gridX, gridY);

            await sleep(5000);
            grid[otherPlay.y][otherPlay.x] = 'o';
            
            // Check if other player has won
            msg = this.makeGrid(grid);
            let checkOtherWon = this.checkWon(grid, 'o', otherPlay.x, otherPlay.y, gridX, gridY);
            if(checkOtherWon) {
                collector.emit('end');
                return;
            }

            // Display move
            Status.setDescription(`Other player picked [${otherPlay.x + 1}, ${otherPlay.y + 1}]\nPick an X and Y co-ordinate, and press confirm.`);

            await interaction.editReply({
                content: msg,
                components: [SelectX, SelectY, confirmButton],
                embeds: [Status]
            }).catch((e) => console.log(e));

        });

        collector.on('end', async () => {

            Status.setTitle(`Game Over!`)
            if(playerWon)
                Status.setDescription(`You won!\nTurns: \`${turns}\``)
            else
                Status.setDescription(`You lost...\nTurns: \`${turns}\``)
            
            await interaction.editReply({
                content: msg,
                components: [],
                embeds: [Status]
            }).catch((e) => console.log(e));
        });

    },
    generateGrid(gridX, gridY) {
        let grid = [];

        // Add blank canvas
        for(let y = 0; y < gridY; y++) {
            grid[y] = [];
            for(let x = 0; x < gridX; x++) {
                 grid[y][x] = "-"; 
            }
        }

        return grid;
    },
    makeGrid(grid) {
        let msg = ``;

        // Prints grid of emojis based on grid input
        for(let y = 0; y < grid.length; y++) {
            for(let x = 0; x < grid[y].length; x++) {
                switch(grid[y][x]) {
                    case '-':
                        msg += `⬛`;
                        break;
                    case 'x':
                        msg += `❌`;
                        break;
                    case 'o':
                        msg += `🔘`;
                        break;
                    default:
                        break;
                }
            }

            msg += `\n`;
        }

        return msg;

    },
    makeSelectMenu(numOptions) {
        let options = [];

        for(let i = 0; i < numOptions; i++) {
            options[i] = {
                "label": `${i + 1}`,
                "value": `${i}`
            }
        }
        
        return options;
    },
    // Check if player has won in any direction
    checkWon(grid, player, playX, playY, gridX, gridY) {
        let hor = this.checkHor(grid, player, gridX, playY);
        let vert = this.checkVert(grid, player, playX, gridY);
        let diag1 = this.checkDiag1(grid, player, playX, playY, gridX, gridY);
        let diag2 = this.checkDiag2(grid, player, playX, playY, gridX, gridY);

        return hor || vert || diag1 || diag2;
    },
    checkWonAll(grid, player, gridX, gridY) {
        for(let y = 0; y < gridY; y++) {
            for(let x = 0; x < gridX; x++) {
                if(this.checkWon(grid, player, x, y, gridX, gridY))
                    return true;
            }
        }

        return false;
    },
    // Check won horizontally
    checkHor(grid, player, gridX, playY) {
        let y = parseInt(playY);
        for(let x = 0; x < gridX; x++) {
            if(grid[y][x] != player)
                return false;
        }

        return true;
    },
    // Check won vertically
    checkVert(grid, player, playX, gridY) {
        let x = parseInt(playX);
        for(let y = 0; y < gridY; y++) {
            if(grid[y][x] != player)
                return false;
        }

        return true;
    },
    checkDiag1(grid, player, playX, playY, gridX, gridY) {
        let x = parseInt(playX);
        let y = parseInt(playY);
        let count = 0;

        // Check top left
        while(x >= 0 && y >= 0) {
            if(grid[y][x] != player)
                return false;

            x--;
            y--;
            count++;
        }

        x = parseInt(playX) + 1;
        y = parseInt(playY) + 1;

        // Check bottom right 
        while(x < gridX && y < gridY) {
            if(grid[y][x] != player)
                return false;
            x++;
            y++;
            count++;
        }

        if(count < Math.max(gridX, gridY))
            return false;

        return true;
    },
    checkDiag2(grid, player, playX, playY, gridX, gridY) {
        let x = parseInt(playX);
        let y = parseInt(playY);
        let count = 0;

        // Check top right (y towards 0, x towards gridX)
        while(x < gridX && y >= 0) {
            if(grid[y][x] != player)
                return false;
            x++;
            y--;
            count++;
        }

        x = parseInt(playX) - 1;
        y = parseInt(playY) + 1;

        // Check bottom left (y towards gridY, x towards 0)
        while(x >= 0 && y < gridY) {
            if(grid[y][x] != player)
                return false;
            x--
            y++;
            count++;
        }

        if(count < Math.max(gridX, gridY))
            return false;

        return true;
    },
    enemyMove(grid, gridX, gridY) {
        let newGrid = this.copyGrid(grid);

        // Make a move with random and minimax
        let move = this.randomMove(newGrid, gridX, gridY);

        let minimaxScore = this.minimax('x', newGrid, gridX, gridY, 0);

        if(minimaxScore.moveX != -1 && minimaxScore.moveY != -1) {
            move.x = minimaxScore.moveX;
            move.y = minimaxScore.moveY;
        } else {
            console.log("resorting to random");
        }

        return move;
    },
    minimax(player, grid, gridX, gridY, depth) {
      
        console.log(grid);
        let checkWon = this.checkWonAll(grid, player, gridX, gridY);
        let checkOtherWon = this.checkWonAll(grid, player == 'x' ? 'o' : 'x', gridX, gridY);
        console.log(`${player} won: ` + checkWon);
        console.log(`other won: ` + checkOtherWon + "\n\n");

        let moveX = -1;
        let moveY = -1;
        let score = -Infinity;

        // Check if either player won
        if(checkWon)
            return { score: 10 - depth };
        if(checkOtherWon)
            return { score: depth - 10 };

        // Try every possible move
        for(let y = 0; y < gridY; y++) {
            for(let x = 0; x < gridX; x++) {
                if(grid[y][x] != '-')
                    continue;

                let gridWithNewMove = this.copyGrid(grid);
                gridWithNewMove[y][x] = player;
                
                // Get score for new move
                let scoreForMove = -this.minimax(player == 'x' ? 'o' : 'x', gridWithNewMove, gridX, gridY, depth + 1).score;
                if(scoreForMove > score) {
                    score = scoreForMove;
                    moveX = x;
                    moveY = y;
                }
            }
        }

        // If no score was found, return 0
        if(moveX == -1 || moveY == -1)
            return { 
                score: 0, 
                moveX: -1, 
                moveY: -1 
            };

        console.log(`score: ${score}\nmoveX: ${moveX}\nmoveY: ${moveY}\n`)
        return {
            score: score,
            moveX: moveX,
            moveY: moveY
        };

    },
    randomMove(grid, gridX, gridY) {
        let otherPlayX, otherPlayY;
        do {
            otherPlayX = Math.floor(Math.random() * gridX);
            otherPlayY = Math.floor(Math.random() * gridY);
        } while(grid[otherPlayY][otherPlayX] != '-')

        grid[otherPlayY][otherPlayX] = 'o';

        return {
            y: otherPlayY,
            x: otherPlayX
        }
    },
    // Copy 2D array by value
    copyGrid(grid) {
        
        let newGrid = [];
        for(let i = 0; i < grid.length; i++) {
            newGrid[i] = grid[i].slice();
        }

        return newGrid;
    }
}
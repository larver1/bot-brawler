const { Events } = require("../Validation/EventNames");
const { promisify } = require("util");
const { glob } = require("glob");
const consola = require("consola");

//Glob allows you to access directories using wild-card "*"
const PG = promisify(glob);
const Ascii = require("ascii-table");

module.exports = async(client) => {
    //List all events loaded in table
    const Table = new Ascii("Events Loaded");

    //Find all events
    (await PG(`${process.cwd()}/Events/*/*.js`)).map(async (file) => {
        const event = require(file);

        //If error is erroneous/missing
        if(!Events.includes(event.name) || !event.name) {
            const L = file.split("/");
            await Table.addRow(`${event.name || "MISSING"}`, `❌ Event name is either invalid or missing: ${L[6] + `/` + L[7]}`);
            return;
        }

        //If event needs to be fired only once
        if(event.once) {
            client.once(event.name, (...args) => event.execute(...args, client));
        } else {
            client.on(event.name, (...args) => event.execute(...args, client));

        };

        await Table.addRow(event.name, '✅ SUCCESSFUL');

    });

    consola.info(Table.toString());
}

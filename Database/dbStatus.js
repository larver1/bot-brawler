const mysql = require("mysql2/promise");
const consola = require("consola");
const { Users } = require('../Database/dbObjects');
const { dbName, dbUser, dbPass } = require("../config.json");

module.exports = async(client) => {

    client.once("ready", () => {
        mysql.createConnection({
            database: dbName,
            user: dbUser,
            password: dbPass
        })
        .then(() => consola.success("Database Connected!"))
        .catch(err => consola.error(err));

        // Unpause everyone
        Users.findAll().then(function(DBUsers){
            for(let i = 0; i < DBUsers.length; i++) {
                DBUsers[i].paused = false;
                DBUsers[i].save();
            }
        });

    });

}

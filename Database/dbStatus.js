const mysql = require("mysql2/promise");
const consola = require("consola");
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
    });

}

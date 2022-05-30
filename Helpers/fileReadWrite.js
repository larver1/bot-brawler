const fs = require('fs');
const readline = require('readline');
const consola = require("consola");

module.exports = class fileReadWrite
{
	constructor(filePath)
	{
        this.fileName = filePath;
        try {
            this.checkForFile();
        } catch {
            return consola.error(`File ${filePath} not found.`);
        }
    }

    /* Returns true if file exists */
    async checkForFile()
    {
        try {
            await fs.readFileSync(`${this.fileName}`);
            return true;
        } catch (err) {
            consola.error(err);
            return false;
        }
    }

    /* Returns an array of strings from the file */
    async processLineByLine() 
    {
        if(!this.checkForFile(this.fileName)) return null;

        const fileStream = fs.createReadStream(`${this.fileName}`);
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });

        let lines = [];
        // Note: we use the crlfDelay option to recognize all instances of CR LF
        // ('\r\n') in input.txt as a single line break.

        for await (const line of rl) {
            // Each line in input.txt will be successively available here as `line`.
            lines.push(line);
        }

        return lines;

    }

    async writeToFile(data)
    {
        await fs.writeFile(`${this.fileName}`, `${data}`, function (err) {
            if (err) consola.error(err);
        });   
    }

    /* Writes to file with data at the given line number */
    async updateFileLine(lineNo, newData)
    {
        var fileToChange = await this.processLineByLine(this.fileName);
        for(var i = 0; i < fileToChange.length; i++)
        {
            if(i == lineNo)
            {
                fileToChange[i] = newData;
            }
        }

        fileToChange = fileToChange.join("\n");
        fs.writeFile(`${this.fileName}`, `${fileToChange}`, function (err) {
            if (err) return consola.error(err);
        });   

    }   

    /* Get the string at the given line number */
    async getLineNo(lineNo) {

        if(!this.checkForFile(this.fileName)) return null;
    
        const fileStream = fs.createReadStream(`${this.fileName}`);
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });
    
        let lines = [];
        // Note: we use the crlfDelay option to recognize all instances of CR LF
        // ('\r\n') in input.txt as a single line break.
    
        for await (const line of rl) {
            // Each line in input.txt will be successively available here as `line`.
            lines.push(line);
        }
    
        return lines[lineNo];
    
    }


}

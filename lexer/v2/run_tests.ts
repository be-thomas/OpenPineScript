import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { tokenize } from './lexer';
import { Token, TokenType } from './tokens';

// Path to the 'tests' folder
const testsFolder = path.join(__dirname, 'tests');

function visualizeToken(token: Token) {
    const typeDescription = chalk.blue(TokenType[token.type]); // Token type in blue
    const value = token.value !== null 
        ? chalk.green(`"${token.value}"`) // Token value in green
        : chalk.gray("<null>"); // Null value in gray
    const metadata = token.metadata
        ? ` (${chalk.yellow(`line: ${token.metadata.line}`)}, ${chalk.yellow(`column: ${token.metadata.column}`)}, ${chalk.yellow(`index: ${token.metadata.absoluteIndex}`)})`
        : chalk.red(" (no metadata)"); // Metadata in yellow or indicate missing metadata in red

    return `${chalk.bold("Token")} [type: ${typeDescription}, value: ${value}${metadata}]`;
}

// Get all files in the 'tests' folder
fs.readdir(testsFolder, (err, files) => {
    if (err) {
        console.error('Error reading directory:', err);
        return;
    }

    const pineFiles = files.filter(file => path.extname(file) === '.pine');

    // Iterate through each file
    pineFiles.forEach(file => {
        const filePath = path.join(testsFolder, file);

        // Check if it's a file (not a directory)
        fs.stat(filePath, (err, stats) => {
            if (err) {
                console.error('Error getting file stats:', err);
                return;
            }

            if (stats.isFile()) {
                // Read the file's contents
                fs.readFile(filePath, 'utf8', (err, sourceCode) => {
                    if (err) {
                        console.error('Error reading file:', filePath, err);
                        return;
                    }

                    // Retain the base name and change the extension to .lex
                    const newFilePath = path.join(
                        path.dirname(filePath),
                        path.basename(filePath, path.extname(filePath)) + '.json'
                    );

                    const output = tokenize(sourceCode);
                    console.log(`#############  ${path.basename(filePath)}, Pinescript version = ${output.directives.version}  ################`)
                    console.log(output.tokens.map(visualizeToken).join("\n"))
                    fs.writeFile(newFilePath, JSON.stringify(output), (err) => {
                        if (err) {
                            console.error('Error writing to file:', err);
                        } else {
                            console.log(`Data written to file: ${newFilePath}`);
                        }
                    });
                    
                    console.log("\n\n\n")
                });
            }
        });
    });
});


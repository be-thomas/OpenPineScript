import {Token, TokenType} from "./tokens";
import { SearchTreeNode } from "./searchtree";
import { literalsSearchTree } from "./literals";
import {keywordsSearchTree} from "./keywords";
import { Directives } from "./directives";


function matchLongest(sourceCode: string, start: number, tree: SearchTreeNode<Token>): Token|null {
    let currentNode: SearchTreeNode<Token> = tree;
    let longestMatch: Token | null = null;
    let currentIndex: number = start;

    while (currentNode) {
        // Check if the current node has a value (potential token match)
        if (currentNode.value) {
            longestMatch = currentNode.value;
        }

        // Check if there's a next character to traverse
        if (currentIndex >= sourceCode.length) break;

        const char = sourceCode[currentIndex];
        currentNode = currentNode.children[char];
        currentIndex++;
    }

    return longestMatch; // Return the longest matching token, or null if no match
}

const ALPHABETS_REGEX = /[a-zA-Z]+/y;
// Corrected ID_REGEX: Only matches a single identifier. 
// The '.' token should be handled by the literalsSearchTree.
const ID_REGEX = /[a-zA-Z_][a-zA-Z_0-9]*/y; 
/*
This is not being used in the parser, also this will cause clash
with COLOR_LITERAL as that also starts with a hashtag

const ID_EX_REGEX = /([a-zA-Z_#])(\.?([a-zA-Z_#0-9]+\.)*[a-zA-Z_#0-9]+)?/y;
*/
const COLOR_LITERAL1_REGEX = /#[0-9a-fA-F]{6}/y;
const COLOR_LITERAL2_REGEX = /#[0-9a-fA-F]{8}/y;
const FLOAT_LITERAL_REGEX = /(?:\.\d+(?:[eE][+-]?\d+)?|\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/y;
const INT_LITERAL_REGEX = /[0-9]+/y;
const STR_LITERAL_REGEX = /(?:"(?:\\.|[^\\\n"])*"|'(?:\\.|[^\\\n'])*')/y;


function regexTest(sourceCode: string, start: number, regex: RegExp) {
    regex.lastIndex = start;
    let result = regex.exec(sourceCode);
    if(!result) return null;
    return result[0];
}

function consumeIdentifier(sourceCode: string, start: number): Token|null {
    let result = regexTest(sourceCode, start, ID_REGEX)
    if(!result) return null;
    const identifier: string = result;
    const token = matchLongest(identifier, 0, keywordsSearchTree);
    if(token) return token;
    return {value: identifier, type: TokenType.ID};
}

function consumeLiteralValues(sourceCode: string, start: number): Token|null {
    // Re-ordered to check most specific patterns first.

    // COLOR_LITERAL check (8-digit first)
    const color_literal2_result = regexTest(sourceCode, start, COLOR_LITERAL2_REGEX);
    if(color_literal2_result) return {value: color_literal2_result, type: TokenType.COLOR_LITERAL};
    
    const color_literal1_result = regexTest(sourceCode, start, COLOR_LITERAL1_REGEX);
    if(color_literal1_result) return {value: color_literal1_result, type: TokenType.COLOR_LITERAL};
    
    // FLOAT_LITERAL check (must be before INT)
    const float_literal_result = regexTest(sourceCode, start, FLOAT_LITERAL_REGEX);
    if(float_literal_result) {
        // Prevent matching an int if float regex matches only int
        if (!float_literal_result.includes('.') && !float_literal_result.includes('e') && !float_literal_result.includes('E')) {
             // Let INT_LITERAL handle this
        } else {
            return {value: float_literal_result, type: TokenType.FLOAT_LITERAL};
        }
    }

    // INT_LITERAL check
    const int_literal_result = regexTest(sourceCode, start, INT_LITERAL_REGEX);
    if(int_literal_result) {
        // Check if it's actually part of a float that was missed
         if (start + int_literal_result.length < sourceCode.length && sourceCode[start + int_literal_result.length] === '.') {
            // This is a float, let the float regex catch it on a re-check if needed, or fix float regex
         } else {
             return {value: int_literal_result, type: TokenType.INT_LITERAL};
         }
    }
    
    // Re-check float if int was skipped because of a following dot
    if (float_literal_result && !int_literal_result) {
        return {value: float_literal_result, type: TokenType.FLOAT_LITERAL};
    }


    // STR_LITERAL check
    if(['"', "'"].includes(sourceCode.charAt(start))) {
        const str_literal_result = regexTest(sourceCode, start, STR_LITERAL_REGEX);
        if(!str_literal_result)
            throw new Error(`Expected an ending ${sourceCode.charAt(start)}`);
        return {value: str_literal_result, type: TokenType.STR_LITERAL};
    }
    return null;
}


// This handleLineEnd function is CORRECT.
function handleLineEnd(tokens: Token[], lineEndToken: Token) {
    const lastToken = tokens.length > 0 ? tokens[tokens.length - 1] : null;

    if (!lastToken || lastToken.type === TokenType.LEND || lastToken.type === TokenType.EMPTY_LINE) {
        // Previous line was also empty, or this is the first line.
        // We only want one EMPTY_LINE token.
        if (!lastToken || lastToken.type === TokenType.LEND) {
             tokens.push({value: lineEndToken.value, metadata: lineEndToken.metadata, type: TokenType.EMPTY_LINE});
        }
        // If last token was already EMPTY_LINE, do nothing.
    
    } else if (lastToken.type === TokenType.INDENT || lastToken.type === TokenType.LBEG) {
        // The line contained only indentation. This is an EMPTY_LINE.
        // CRITICAL: We DO NOT pop the LBEG/INDENT tokens.
        tokens.push({value: lineEndToken.value, metadata: lineEndToken.metadata, type: TokenType.EMPTY_LINE});
    
    } else {
        // The line had content.
        tokens.push(lineEndToken);
    }
    return tokens;
}

function skipTillLineEnd(sourceCode: string, start: number) {
    for(let j=start; j<sourceCode.length; j++) {
        const _char = sourceCode[j];
        if(_char === '\n' || _char === '\r') {
            return j - 1; // Return the index of the character BEFORE the newline
        }
    }
    return sourceCode.length - 1; // Return the last index of the string
}

function skipWhiteSpace(sourceCode: string, start: number) {
    for(let j=start; j<sourceCode.length; j++) {
        const _char = sourceCode[j];
        if(_char !== ' ' && _char !== '\t')
            return j;
    }
    return sourceCode.length;
}

export function tokenize(sourceCode: string, skip_second_pass:boolean = false): {tokens: Token[], directives: Directives} {
    let tokens = new Array<Token>();
    const directives: Directives = {};
    let lineNo = 1;
    let lastLineEndIndex = 0;

    for(let i=0; i<sourceCode.length; i++) {
        let char: string = sourceCode[i];
        let metadata: Token['metadata'] = {line: lineNo, column: i-lastLineEndIndex, absoluteIndex: i};

        // Automatically add LBEG token (Line-begin token)
        if(i === 0 || (tokens.length > 0 && [TokenType.LEND, TokenType.EMPTY_LINE].includes(tokens[tokens.length-1].type)))
            tokens.push({value: null, type: TokenType.LBEG, metadata})

        // Handle Indentation-case
        if(tokens.length > 0 && tokens[tokens.length-1].type === TokenType.LBEG) {
            if(char === '\t') {
                tokens.push({ value: ' ', type: TokenType.INDENT, metadata });
                continue;
            } else if(char === ' ') {
                let spacesCount = 1;
                for(let j=i+1; j<sourceCode.length; j++) {
                    if(sourceCode[j] === ' ') {
                        spacesCount++;
                    } else {
                        break;
                    }
                }
                if(spacesCount % 4 === 0) {
                    const indentsCount = spacesCount / 4;
                    for(let j=0; j<indentsCount; j++)
                        tokens.push({ value: '    ', type: TokenType.INDENT, metadata });
                    i += spacesCount - 1;
                    continue;
                } else {
                    // if(tokens.length > 0 && tokens[tokens.length-1].type === TokenType.LBEG)
                    //     tokens.pop();
                    i += spacesCount - 1;
                    tokens.push({ value: null, type: TokenType.LINE_CONTINUATION, metadata })
                    continue;
                }
            }
        }

        // Skip comments & handle compiler declarations
        if(char === '/' && sourceCode.length >= i+1 && sourceCode[i+1] === '/') {
            if(sourceCode.length >= i+3 && sourceCode[i+2] === '@') {
                // it's an @ directive, eg: //@version=3, //@type
                const directive_name = regexTest(sourceCode, i+3, ALPHABETS_REGEX);
                if(directive_name === 'version') {
                    const _i = skipWhiteSpace(sourceCode, i+3+7);
                    const _check = sourceCode?.[_i];
                    if(_check === '=') {
                        const __i = skipWhiteSpace(sourceCode, _i+1);
                        const int_match = regexTest(sourceCode, __i, INT_LITERAL_REGEX);
                        if(int_match) {
                            directives.version = parseInt(int_match);
                        }
                    }
                }
            } else if(sourceCode.length >= i+3 && sourceCode[i+2] === '#') {
                // it's a # directive, eg: //#region, //#endregion
                
            }
            // Set i to the char before the newline, so the next loop iteration handles the newline
            i = skipTillLineEnd(sourceCode, i+2); 
            continue;
        }

        // Handle whitespace & Line Numbers
        if(char === ' ') {
            continue;
        } else if(char === '\n') {
            lineNo++;
            lastLineEndIndex = i+1;
            tokens = handleLineEnd(tokens, {value: '\n', type: TokenType.LEND, metadata})
            continue;
        } else if(char === '\r') {
            if(sourceCode.length >= i+1 && sourceCode[i+1] === '\n') {
                i+=1;
                lastLineEndIndex = i+2;
                tokens = handleLineEnd(tokens, {value: '\r\n', type: TokenType.LEND, metadata})
            } else {
                lastLineEndIndex = i+1;
                tokens = handleLineEnd(tokens, {value: '\r', type: TokenType.LEND, metadata})
            }
            lineNo++;
            continue;
        }

        // Extract Identifier/Keyword
        let token = consumeIdentifier(sourceCode, i);
        if(token) {
            tokens.push({...token, metadata});
            i += (token.value?.length || 0) - 1;
            continue;
        }

        // Consume Literal Values
        token = consumeLiteralValues(sourceCode, i);
        if(token) {
            tokens.push({...token, metadata});
            i += (token.value?.length || 0) - 1;
            continue;
        }


        token = matchLongest(sourceCode, i, literalsSearchTree);
        if(token) {
            // console.log("Literal match: ", token);
            tokens.push({...token, metadata});
            i += (token.value?.length || 0) - 1;
        } else {
            throw new Error(`Unexpected character: ${sourceCode[i]}, line: ${lineNo}, index: ${i}, ${sourceCode.charCodeAt(i)}`);
        }
    }

    if(!directives.version) {
        directives.version = 1;
    }

    // <--- FIX: This is the final, corrected second-pass logic
    if(!skip_second_pass) {
        // Post-processing to handle BEGIN, END, PLEND & LINE_CONTINUATION tokens
        const newTokens: Token[] = [];
        let lastLineIndentationLevel = 0;
        let lastLineLEND: Token|null = null;
        
        let i = 0;
        while (i < tokens.length) {
            const token = tokens[i];

            if (token.type === TokenType.LBEG) {
                let indentsCount = 0;
                let j = i + 1; // Look ahead past LBEG
                while(j < tokens.length && tokens[j].type === TokenType.INDENT) {
                    indentsCount++;
                    j++;
                }
                
                const nextToken = (j < tokens.length) ? tokens[j] : null;

                // Check if the line is empty (next token is LEND or EMPTY_LINE)
                if (nextToken && (nextToken.type === TokenType.LEND || nextToken.type === TokenType.EMPTY_LINE)) {
                    // --- This is an EMPTY line ---
                    
                    // Process indentation change
                    if (indentsCount < lastLineIndentationLevel) {
                        const metadata = token.metadata;
                        const diff = lastLineIndentationLevel - indentsCount;
                        for(let k=0; k<diff; k++) {
                            newTokens.push({ value: null, metadata, type: TokenType.END });
                            newTokens.push({ value: null, metadata, type: TokenType.PLEND });
                        }
                    }
                    // Note: We don't emit BEGIN for an empty line, even if indent increases
                    
                    lastLineIndentationLevel = indentsCount;
                    
                    // Push the EMPTY_LINE token itself
                    newTokens.push(nextToken);
                    if (nextToken.type === TokenType.LEND) {
                        lastLineLEND = nextToken;
                    }
                    
                    i = j + 1; // Consume LBEG, INDENTs, and the LEND/EMPTY_LINE
                    continue;

                } else {
                    // --- This is a CONTENT line ---

                    // Process indentation change
                    if (indentsCount > lastLineIndentationLevel) {
                        newTokens.push({value: null, metadata: token.metadata, type: TokenType.BEGIN});
                    } else if (indentsCount < lastLineIndentationLevel) {
                        const metadata = lastLineLEND?.metadata || token.metadata;
                        const diff = lastLineIndentationLevel - indentsCount;
                        for(let k=0; k<diff; k++) {
                            newTokens.push({ value: null, metadata, type: TokenType.END });
                            newTokens.push({ value: null, metadata, type: TokenType.PLEND });
                        }
                    }
                    lastLineIndentationLevel = indentsCount;
                    
                    // Push LBEG (but NOT the INDENTs)
                    newTokens.push(token); // push LBEG
                    
                    // <-- FIX: The loop that pushed INDENT tokens was REMOVED here.
                    
                    i = j; // Consume LBEG and INDENTs, loop will continue from content
                    continue;
                }
            } 
            
            if (token.type === TokenType.LEND) {
                // This LEND was not part of an empty line (e.g., from first line), just push it
                lastLineLEND = token;
                newTokens.push(token);
            } else if(token.type === TokenType.LINE_CONTINUATION) {
                const tokensToRemove = [TokenType.LEND, TokenType.LBEG, TokenType.INDENT, TokenType.EMPTY_LINE] as TokenType[];
                while(newTokens.length > 0 && tokensToRemove.includes(newTokens[newTokens.length - 1].type)) {
                    newTokens.pop();
                }
                // Do not push the LINE_CONTINUATION token
            } else if (token.type !== TokenType.INDENT && token.type !== TokenType.EMPTY_LINE) {
                 // Push all other tokens (content)
                 // INDENT and EMPTY_LINE are handled by LBEG block
                newTokens.push(token);
            }
            
            i++; // Move to the next token
        }
        
        // Add implicit END tokens for any remaining indentation at the end of the file
        if (lastLineIndentationLevel > 0) {
            const lastToken = newTokens[newTokens.length - 1];
            const metadata = lastToken?.metadata || {line: lineNo, column: 0, absoluteIndex: sourceCode.length};
            for (let j = 0; j < lastLineIndentationLevel; j++) {
                newTokens.push({ value: null, metadata, type: TokenType.END });
                newTokens.push({ value: null, metadata, type: TokenType.PLEND });
            }
        }

        return {tokens:newTokens, directives};
    }

    return {tokens, directives};
}
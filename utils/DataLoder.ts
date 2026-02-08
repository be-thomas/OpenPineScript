import fs from 'fs';

export function loadCsv(path: string) {
    const content = fs.readFileSync(path, 'utf8');
    const lines = content.trim().split('\n');
    const headers = lines[0].split(',');

    // Map the rows to OHLC objects
    return lines.slice(1).map(line => {
        const values = line.split(',');
        return {
            date: values[0],
            open: parseFloat(values[1]),
            high: parseFloat(values[2]),
            low: parseFloat(values[3]),
            close: parseFloat(values[4]),
            volume: parseFloat(values[5]),
            // We can also store the 'mavg' from the CSV to verify our engine!
            expectedMavg: parseFloat(values[8]) 
        };
    });
}

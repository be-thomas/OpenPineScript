export const PREFIX = "opsv2_";

export function removePrefix(str: string) {
  if (str.startsWith(PREFIX)) {
    return str.slice(PREFIX.length);
  } else {
    return str;
  }
}

export function extractFunctionName(id: string): string {
    const spiltIdx = id.indexOf("@");
    const fname = removePrefix(spiltIdx !== -1 ? id.substring(0, spiltIdx) : id); 
    return fname;
}

export function val(x: any): any {
    if (x !== null && x !== undefined && typeof x.valueOf === 'function') {
        return x.valueOf();
    }
    return x;
}

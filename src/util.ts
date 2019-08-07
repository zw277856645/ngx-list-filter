export function getType(v: any) {
    return Object.prototype.toString.call(v);
}

export function isObject(v: any) {
    return getType(v) === '[object Object]';
}

export function isNullOrUndefined(v: any) {
    return v === null || v === undefined;
}

export function isPrimitive(v: any) {
    return (typeof v !== 'object' && typeof v !== 'function') || v === null;
}

export function isEmptyString(v: any) {
    return typeof v === 'string' && v.trim().length === 0;
}

export function isStringAndNumber(a: any, b: any) {
    return (typeof a === 'string' && typeof b === 'number') || (typeof a === 'number' && typeof b === 'string');
}

export function clone(obj: any) {
    if (!obj) {
        return obj;
    }

    let str = JSON.stringify(obj);
    if (str) {
        return JSON.parse(str);
    }

    return obj;
}
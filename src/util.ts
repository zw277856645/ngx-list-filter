export function isObject(v: any) {
    return v !== null && typeof v === 'object' && !Array.isArray(v);
}

export function isNullOrUndefined(v: any) {
    return v === null || v === undefined;
}

export function isEmptyString(v: any) {
    return typeof v === 'string' && v.trim().length === 0;
}

export function isEmpty(v: any) {
    return isNullOrUndefined(v) || isEmptyString(v);
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

export type ValueGetter = (obj: any, key: string) => any;

export function valueGetter(obj: any, key: string) {
    if (key.includes('.')) {
        let keyArr = key.split('.'), sub = obj;
        for (let k of keyArr) {
            sub = sub[ k ];
        }

        return sub;
    }

    return obj[ key ];
}

export function convert2Array(a: any) {
    let rows = [];

    for (let key in a) {
        if (a.hasOwnProperty(key)) {
            rows.push({ [ key ]: a[ key ] });
        }
    }

    return rows;
}
export class ListFilterConfig {

    // 异步流默认抖动时间
    debounceTime?: number;

    // 是否排除null、undefined
    nullOrUndefinedExclude?: boolean;

    // 是否排除空字符串
    emptyStringExclude?: boolean;

    // 是否排除空数组，或元素全为空的数组
    emptyArrayExclude?: boolean;

    // 取值器。默认支持点记法(a.b.c)
    valueGetter?: (obj: any, key: string) => any;
}
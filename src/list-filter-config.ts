export class ListFilterConfig {

    // 异步流默认抖动时间
    debounceTime?: number;

    // 正则匹配默认标志
    regFlags?: string;

    // 取值器。默认支持点记法(a.b.c)
    valueGetter?: (obj: any, key: string) => any;
}
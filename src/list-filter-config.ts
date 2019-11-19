export class ListFilterConfig {

    // 正则匹配默认标志
    regFlags?: string;

    // 取值器。默认支持点记法(a.b.c)
    valueGetter?: (obj: any, key: string) => any;
}
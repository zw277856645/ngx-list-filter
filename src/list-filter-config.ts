export class ListFilterConfig {

    // 异步流默认抖动时间
    debounceTime?: number;

    // 部分匹配正则表达式默认标志
    regFlags?: string;

    // 完全匹配正则表达式默认标志
    fullMatchRegFlags?: string;

    // true 为严格比较(===)，false 为松比较(==)
    // 严格比较时，若数据类型不一样，将忽略比较操作符，永远返回 false
    strictMatch?: boolean;

    // 是否开启数字转化为字符串。当数字同字符串匹配时有用，开启后数字可匹配局部数字
    enableDigit2String?: boolean;

    // 是否排除null
    nullExclude?: boolean;

    // 是否排除undefined
    undefinedExclude?: boolean;

    // 是否排除空字符串
    emptyStringExclude?: boolean;
}
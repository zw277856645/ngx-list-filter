import { Inject, Injectable, InjectionToken, Optional, Pipe, PipeTransform } from '@angular/core';
import { ListFilterConfig } from './list-filter-config';
import { isEmpty, isObject, isPrimitiveArray, nullValue, valueGetter } from './util';
import { LogicOperatorHandler } from './logic-operator-handler';

export const LIST_FILTER_CONFIG = new InjectionToken<ListFilterConfig>('list_filter_config');

/**
 * 列表过滤，类似 mongodb 查询语法
 *
 * 支持功能：
 * 01）全局参数配置
 * 02）与($and)，或($or)，非或($nor)，非($not)
 * 03）<($lt)，<=($lte)，>($gt)，>=($gte)
 * 04）在指定范围之内($in)，不在指定范围之内($nin)
 * 05）范围($between)
 * 06）相等比较($eq)
 * 07）不相等($neq)
 * 08）深度相等比较($deepEquals)
 * 09）属性值存不为 null、undefined、空字符串、空数组($exists)
 * 10）正则($reg)
 * 11）日期在之前($before)
 * 12）日期在之后($after)
 * 13）数组包含某值($contains)
 * 14）数组包含全部($all)
 * 15）数组包含任意($any)
 * 16）数组长度或对象属性个数值($size)
 * 17）取模($mod)
 * 18）嵌入对象匹配，使用点记法(a.b.c)
 * 19）数组内对象匹配($elemMatch)
 * 20）自定义判断逻辑($cb)
 */

/**
 * @dynamic
 *
 * ng-packagr 的 tsconfig.json 配置 strictMetadataEmit 会禁止 static 方法使用 lambda 表达式，使用此标记解除编译错误
 */
@Injectable({
    providedIn: 'root'
})
@Pipe({
    name: 'listFilter'
})
export class ListFilterPipe implements PipeTransform {

    regFlags = 'i';
    valueGetter = valueGetter;

    private logicHandler: LogicOperatorHandler;

    constructor(@Optional() @Inject(LIST_FILTER_CONFIG) config: ListFilterConfig) {
        Object.assign(this, config);
        this.logicHandler = new LogicOperatorHandler(this.regFlags, this.valueGetter);
    }

    transform(list: any[], filter: any) {
        if (Array.isArray(list) && !isEmpty(filter)) {
            // 去除空查询条件
            let parsedFilter = ListFilterPipe.deleteNullConstraints(filter);

            if (!isEmpty(parsedFilter)) {
                return list.filter(v => this.logicHandler.match(v, parsedFilter));
            }
        }

        return list;
    }

    private static deleteNullConstraints(constraint: any): any {
        let copy = null;

        if (Array.isArray(constraint)) {
            if (!isPrimitiveArray(constraint)) {
                for (let c of constraint) {
                    let ret = this.deleteNullConstraints(c);
                    if (ret !== null) {
                        if (!copy) {
                            copy = [];
                        }

                        copy.push(ret);
                    }
                }
            } else if (!nullValue(constraint)) {
                copy = constraint;
            }
        } else if (isObject(constraint)) {
            if (constraint instanceof RegExp || constraint instanceof Date) {
                copy = constraint;
            } else {
                for (let k of Object.keys(constraint)) {
                    let ret = this.deleteNullConstraints(constraint[ k ]);
                    if (ret !== null) {
                        if (!copy) {
                            copy = {};
                        }

                        copy[ k ] = ret;
                    }
                }
            }
        } else if (!nullValue(constraint)) {
            copy = constraint;
        }

        return copy;
    }

}

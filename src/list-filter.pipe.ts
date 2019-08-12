import { Inject, Injectable, InjectionToken, Optional, Pipe, PipeTransform } from '@angular/core';
import { combineLatest, Observable } from 'rxjs';
import { debounceTime, map, shareReplay, startWith } from 'rxjs/operators';
import { async2Observable, deepExtend, uuid } from 'cmjs-lib';
import { ListFilterConfig } from './list-filter-config';
import { clone, isEmpty, isNullOrUndefined, isObject, valueGetter } from './util';
import { LogicOperatorHandler } from './logic-operator-handler';

export const LIST_FILTER_CONFIG = new InjectionToken<ListFilterConfig>('list_filter_config');

/**
 * 列表过滤，类似 mongodb 查询语法
 *
 * 支持功能：
 * 01）全局参数配置
 * 02）支持异步流 Promise/Observable/EventEmitter，并增加 debounceTime
 * 03）与($and)，或($or)，非或($nor)，非($not)
 * 04）<($lt)，<=($lte)，>($gt)，>=($gte)
 * 05）在指定范围之内($in)，不在指定范围之内($nin)
 * 06）范围($between)
 * 07）相等比较($eq)
 * 08）不相等($neq)
 * 09）深度相等比较($deepEquals)
 * 10）属性值不为undefined($exists)
 * 11）正则($reg)
 * 12）日期在之前($before)
 * 13）日期在之后($after)
 * 14）数组包含某值($contains)
 * 15）数组包含全部($all)
 * 16）数组包含任意($any)
 * 17）数组长度或对象属性个数值($size)
 * 18）取模($mod)
 * 19）嵌入对象匹配，使用点记法(a.b.c)
 * 20）数组内对象匹配($elemMatch)
 * 21）自定义判断逻辑($cb)
 */
@Injectable({
    providedIn: 'root'
})
@Pipe({
    name: 'listFilter'
})
export class ListFilterPipe implements PipeTransform {

    debounceTime = 400;
    regFlags = 'i';
    valueGetter = valueGetter;

    private asyncStreams: Array<Observable<any>>;
    private filterImage: any;
    private logicHandler: LogicOperatorHandler;

    constructor(@Optional() @Inject(LIST_FILTER_CONFIG) config: ListFilterConfig) {
        Object.assign(this, config);
        this.logicHandler = new LogicOperatorHandler(this.regFlags, this.valueGetter);
    }

    transform(list: any[], filter: any) {
        if (Array.isArray(list) && list.length && !isEmpty(filter)) {
            if (isNullOrUndefined(this.asyncStreams)) {
                // 第一次执行保存异步流引用，创建 filter 去除异步流后的镜像副本，异步流会被特殊占位符替代
                let [ asyncs, image ] = ListFilterPipe.getAsyncsAndCreateFilterImage(filter);
                this.asyncStreams = asyncs;
                this.filterImage = image;
            }

            // 含有异步监听器
            if (this.asyncStreams.length) {
                return combineLatest(this.asyncStreams).pipe(
                    debounceTime(this.debounceTime),
                    map((mapArray: any[]) => {
                        let parsedFilter = clone(this.filterImage);

                        // 继承非异步流参数
                        parsedFilter = ListFilterPipe.extendStaticParams(parsedFilter, filter);

                        // 异步流占位符替换为真实数据
                        mapArray.forEach(map => {
                            parsedFilter = ListFilterPipe.replaceFilterImage(parsedFilter, map);
                        });

                        return list.filter(v => this.logicHandler.match(v, filter));
                    })
                );
            } else {
                return list.filter(v => this.logicHandler.match(v, filter));
            }
        }

        return list;
    }

    private static getAsyncsAndCreateFilterImage(obj: any) {
        let asyncs: Array<Observable<any>> = [];
        let image: any;

        if (isObject(obj) && !(obj instanceof Promise || obj instanceof Observable)) {
            image = {};

            for (let k of Object.keys(obj)) {
                if (obj[ k ] instanceof Promise || obj[ k ] instanceof Observable) {
                    image[ k ] = this.generateKey();
                    asyncs.push(this.generateObservable(obj[ k ], image[ k ]));
                } else if (isObject(obj[ k ]) || Array.isArray(obj[ k ])) {
                    let [ asyncsOuter, imageOuter ] = this.getAsyncsAndCreateFilterImage(obj[ k ]);
                    image[ k ] = imageOuter;
                    asyncs.push(...asyncsOuter);
                } else {
                    image[ k ] = obj[ k ];
                }
            }
        } else if (Array.isArray(obj)) {
            image = [];

            for (let v of obj) {
                if (v instanceof Promise || v instanceof Observable) {
                    let k = this.generateKey();
                    image.push(k);
                    asyncs.push(this.generateObservable(v, k));
                } else if (isObject(v) || Array.isArray(v)) {
                    let [ asyncsOuter, imageOuter ] = this.getAsyncsAndCreateFilterImage(v);
                    image.push(imageOuter);
                    asyncs.push(...asyncsOuter);
                } else {
                    image.push(v);
                }
            }
        } else {
            if (obj instanceof Promise || obj instanceof Observable) {
                image = this.generateKey();
                asyncs.push(this.generateObservable(obj, image));
            } else {
                image = obj;
            }
        }

        return [ asyncs, image ];
    }

    private static generateKey() {
        return '__' + uuid(8) + '__';
    }

    private static generateObservable(stream: Observable<any> | Promise<any>, key: string) {
        return async2Observable(stream).pipe(
            startWith(null),
            map(value => ({ key, value })),
            shareReplay(1)
        );
    }

    private static extendStaticParams(target: any, src: any) {
        if (src instanceof Promise || src instanceof Observable) {
            return target;
        }

        return deepExtend(src, target);
    }

    private static replaceFilterImage(target: any, map: { key: string, value: any }) {
        if (isObject(target)) {
            for (let k of Object.keys(target)) {
                if (target[ k ] === map.key) {
                    target[ k ] = map.value;
                } else if (isObject(target[ k ]) || Array.isArray(target[ k ])) {
                    this.replaceFilterImage(target[ k ], map);
                }
            }
        } else if (Array.isArray(target)) {
            for (let i = 0, len = target.length; i < len; i++) {
                if (target[ i ] === map.key) {
                    target[ i ] = map.value;
                } else if (isObject(target[ i ]) || Array.isArray(target[ i ])) {
                    this.replaceFilterImage(target[ i ], map);
                }
            }
        } else if (target === map.key) {
            return map.value;
        }

        return target;
    }

}

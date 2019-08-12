//import {
//    Inject, Injectable, InjectionToken, Optional, Pipe, PipeTransform
//} from '@angular/core';
//import { combineLatest, merge, Observable, Subject, Subscription } from 'rxjs';
//import { debounceTime, defaultIfEmpty, finalize, map, shareReplay, startWith } from 'rxjs/operators';
//import { async2Observable, deepExtend, uuid } from 'cmjs-lib';
//import { ListFilterConfig } from './list-filter-config';
//import { clone, isEmpty, isEmptyString, isNullOrUndefined, isObject, isPrimitive, isStringAndNumber } from './util';
//
///**
// * 规则：
// * [logic] listValue + filter
// *
// * PS：
// * 当比较对象为objectValue和value且都为字符串时，判断是否包含
// * 当比较对象为arrayValue和value且都为字符串时，判断是否完全相等
// *
// *
// * [any] undefined + any -> false
// * [any] any + undefined -> true
// *
// * [any] primitive + primitive -> 基本类型比较相等，字符串判断包含
// * ex：[1,2,3,4] listFilter 2 -> [2]
// * ex：['abc','cg','yu'] listFilter 'c' -> ['abc','cg']
// *
// * [any] primitive + object -> true，没有可比性
// *
// * [any] primitive + array -> 判断数组是否包含该值
// * ex：[1,2,3,4] listFilter [1,4,6] -> [1,4]
// * ex：['abc','cg','yu',12] listFilter ['c','yu',12,9] -> ['yu',12]
// *
// * [any] object + primitive -> 判断对象中是否有值等于或包含该值(根据对象值类型深度比较)
// * ex：[{name:'zhangsan',age:12},{name:'wangwu',age:27}] listFilter 'wang' -> [{name:'wangwu',age:27}]
// * ex：[{name:'zhangsan',age:12},{name:'wangwu',age:27}] listFilter 27 -> [{name:'wangwu',age:27}]
// * ex：[{name:'zhangsan',age:12},{name:'wangwu',age:27}] listFilter 'an' -> [{name:'zhangsan',age:12},{name:'wangwu',age:27}]
// * ex：[{address:{road:'abc',street:'hjk'}}] listFilter 'b' -> [{address:{road:'abc',street:'hjk'}}]
// *
// * [or] object + object -> 判断源对象至少有一个值与目标对象的值相等或包含(按键所处路径比较)
// * ex：[{name:'zs',age:12},{name:'lisi',age:13}] listFilter {name:'li',age:12} -> [{name:'zs',age:12},{name:'lisi',age:13}]
// * ex：[{address:{road:'abc',street:'hjk'}}] listFilter {road:'ab'} -> []
// * ex：[{address:{road:'abc',street:'hjk'}}] listFilter {address:{road:'ab'}} -> [{address:{road:'abc',street:'hjk'}}]
// *
// * [and] object + object -> 判断源对象含有或相等所有目标对象的值(按键所处路径比较)
// * ex：[{name:'zs',age:12},{name:'lisi',age:13}] listFilter {name:'li',age:12} -> []
// * ex：[{name:'zs',age:12},{name:'lisi',age:13}] listFilter {name:'li',age:13} -> [{name:'lisi',age:13}]
// *
// * [any] object + array -> true，没有可比性
// *
// * [any] array + primitive -> 判断数组是否包含该值
// * ex：[[1,2],[2,3],[6,7]] listFilter 2 -> [[1,2],[2,3]]
// * ex：[['ab','bcd'],['cd','af'],[{name:'cd'}]] listFilter 'cd' -> [['cd','af']]
// *
// * [any] array + object -> true，没有可比性
// *
// * [any] array + array -> 判断源数组是否包含目标数组(数组值深度比较)
// * ex：[[1,2,3],[3,4],[1,3,8]] listFilter [3,1] -> [[1,2,3],[1,3,8]]
// * ex：[[{name:'zhangsan'},12],[{name:'lisi'},12]] listFilter [{name:'lisi'},12] -> [[{name:'lisi'},12]]
// */
//
//export const LIST_FILTER_CONFIG = new InjectionToken<ListFilterConfig>('list_filter_config');
//
///**
// * 列表过滤，类似 mongodb 查询语法
// *
// * 支持功能：
// * 01）全局参数配置
// * 02）支持异步流 Promise/Observable/EventEmitter，并增加 debounceTime
// * 03）与，或($or)
// * 04）字符串默认是正则匹配，如需全等比较，使用 $fullMatch
// * 05）<($lt)，<=($lte)，>($gt)，>=($gte)
// * 06）在指定范围之内($in)，不在指定范围之内($nin)
// * 07）范围($range)
// * 08）数组包含指定值(string)，全部包含($all)，包含任意一个($any)
// * 09）数组个数值或个数范围($size)
// * 10）数组内对象匹配($elemMatch)
// * 11）嵌入对象匹配，使用点记法(a.b.c)
// */
//@Injectable({
//    providedIn: 'root'
//})
//@Pipe({
//    name: 'listFilter'
//})
//export class ListFilterPipe implements PipeTransform {
//
//    // 默认配置，可被全局配置覆盖
//    debounceTime: number = 400;
//    regFlags: string = 'i';
//    fullMatchRegFlags: string = 'i';
//    strictMatch = false;
//    enableDigit2String = true;
//    nullExclude = true;
//    undefinedExclude = true;
//    emptyStringExclude = true;
//
//    // 原始类型比较操作符 - 单个值
//    private static readonly SINGLE_COMPARE_OPERATORS = [ '$fullMatch', '$lt', '$lte', '$gt', '$gte' ];
//
//    // 原始类型比较操作符 - 数组
//    private static readonly ARRAY_COMPARE_OPERATORS = [ '$in', '$nin', '$range' ];
//
//    // 原始类型比较操作符
//    private static readonly COMPARE_OPERATORS = [
//        ...ListFilterPipe.SINGLE_COMPARE_OPERATORS, ...ListFilterPipe.ARRAY_COMPARE_OPERATORS
//    ];
//
//    private asyncStreams: Array<Observable<any>>;
//    private filterImage: any;
//
//    constructor(@Optional() @Inject(LIST_FILTER_CONFIG) config: ListFilterConfig) {
//        Object.assign(this, config);
//    }
//
//    transform(list: any, filter: any) {
//        if (Array.isArray(list) && list.length && !isEmpty(filter)) {
//            if (isNullOrUndefined(this.asyncStreams)) {
//                // 第一次执行保存异步流引用，创建 filter 去除异步流后的镜像副本，异步流会被特殊占位符替代
//                let [ asyncs, image ] = ListFilterPipe.getAsyncsAndCreateFilterImage(filter);
//                this.asyncStreams = asyncs;
//                this.filterImage = image;
//            }
//
//            // 含有异步监听器
//            if (this.asyncStreams.length) {
//                return combineLatest(this.asyncStreams).pipe(
//                    debounceTime(this.debounceTime),
//                    map((mapArray: any[]) => {
//                        let parsedFilter = clone(this.filterImage);
//
//                        // 继承非异步流参数
//                        parsedFilter = ListFilterPipe.extendStaticParams(parsedFilter, filter);
//
//                        // 异步流占位符替换为真实数据
//                        mapArray.forEach(map => {
//                            parsedFilter = ListFilterPipe.replaceFilterImageBak(parsedFilter, map);
//                        });
//
//                        return this.doTransform(list, parsedFilter);
//                    })
//                );
//            } else {
//                return this.doTransform(list, filter);
//            }
//        }
//
//        return list;
//    }
//
//    private doTransform(list: any, filter: any) {
//        /**
//         * filter 是原始类型，深度匹配所有属性
//         *
//         * 1.filter = primitive
//         * 2.filter = { '$fullMatch': primitive }
//         */
//        if (isPrimitive(filter) || ListFilterPipe.isSinglePrimitiveObject(filter)) {
//            return list.filter((src: any) => this.compareDeep(src, filter));
//        }
//
//        return list;
//    }
//
//    private compareDeep(srcProp: any, filterProp: any) {
//        if (isPrimitive(srcProp)) {
//            return this.comparePrimitive(srcProp, filterProp);
//        } else if (Array.isArray(srcProp)) {
//
//        } else if (isObject(srcProp)) {
//
//        }
//    }
//
//    private comparePrimitive(srcProp: any, filterProp: any) {
//        if (srcProp === null) {
//            return !this.nullExclude;
//        } else if (srcProp === undefined) {
//            return !this.undefinedExclude;
//        } else if (isEmptyString(srcProp)) {
//            return !this.emptyStringExclude;
//        }
//
//        if (isPrimitive(filterProp)) {
//            if (
//                (this.enableDigit2String && isStringAndNumber(srcProp, filterProp))
//                || (typeof srcProp === 'string' && typeof filterProp === 'string')
//            ) {
//                return new RegExp(String(filterProp).trim(), this.regFlags || '').test(srcProp);
//            } else {
//                return this.strictMatch ? srcProp === filterProp : srcProp == filterProp;
//            }
//        } else {
//            let operator = Object.keys(filterProp)[ 0 ];
//            let value = filterProp[ operator ];
//
//            // 忽略不符合使用规则的情况
//            if (isObject(value)
//                || (!isPrimitive(value) && ListFilterPipe.SINGLE_COMPARE_OPERATORS.indexOf(operator) >= 0)
//                || (!Array.isArray(value) && ListFilterPipe.ARRAY_COMPARE_OPERATORS.indexOf(operator) >= 0)) {
//                return true;
//            }
//
//            if (isEmpty(value)) {
//                return true;
//            } else if (this.strictMatch && (typeof srcProp !== typeof value)) {
//                return false;
//            } else {
//                try {
//                    switch (operator) {
//                        case '$fullMatch':
//                            if (
//                                (this.enableDigit2String && isStringAndNumber(srcProp, value))
//                                || (typeof srcProp === 'string' && typeof value === 'string')
//                            ) {
//                                return new RegExp(`^\\s*${String(value).trim()}\\s*$`, this.fullMatchRegFlags || '')
//                                    .test(srcProp);
//                            } else {
//                                return this.strictMatch ? srcProp === value : srcProp == value;
//                            }
//                        case '$lt':
//                            return srcProp < value;
//                        case  '$lte':
//                            return srcProp <= value;
//                        case '$gt':
//                            return srcProp > value;
//                        case '$gte':
//                            return srcProp >= value;
//                        case '$in':
//                            return (value as any[]).indexOf(srcProp) >= 0;
//                        case '$nin':
//                            return (value as any[]).indexOf(srcProp) < 0;
//                        case '$range':
//                            return srcProp >= value[ 0 ] && srcProp <= value[ 1 ];
//                    }
//                } catch (e) {
//                    // 某些类型不能自动转化的比较会抛异常，比如 1 < Symbol()，此类情形不处理返回 true
//                    return true;
//                }
//            }
//        }
//    }
//
//    /*transform(list: any, filter: any, logic: 'or' | 'and' = 'or') {
//       if (Array.isArray(list) && !ListFilterPipe.isNullOrUndefined(filter)) {
//           return list.filter((v: any) => ListFilterPipe.compareAnys(v, filter, logic));
//       }
//
//       return list;
//   }
//
//   private static compareAnys(v: any, filter: any, logic: any) {
//       if (ListFilterPipe.isNullOrUndefined(v)) {
//           return false;
//       } else if (ListFilterPipe.isPrimitive(v)) {
//           if (ListFilterPipe.isNullOrUndefined(filter)) {
//               return true;
//           } else if (ListFilterPipe.isPrimitive(filter)) {
//               return ListFilterPipe.comparePrimitives(v, filter);
//           } else if (isRealObject(filter)) {
//               return true;
//           } else if (Array.isArray(filter)) {
//               return ListFilterPipe.comparePrimitiveAndArray(filter, v);
//           }
//       } else if (isRealObject(v)) {
//           if (ListFilterPipe.isNullOrUndefined(filter)) {
//               return true;
//           } else if (ListFilterPipe.isPrimitive(filter)) {
//               return ListFilterPipe.comparePrimitiveAndObjectDeep(v, filter);
//           } else if (isRealObject(filter)) {
//               return ListFilterPipe.compareObjects(v, filter, logic);
//           } else if (Array.isArray(filter)) {
//               return true;
//           }
//       } else if (Array.isArray(v)) {
//           if (ListFilterPipe.isNullOrUndefined(filter)) {
//               return true;
//           } else if (ListFilterPipe.isPrimitive(filter)) {
//               return ListFilterPipe.comparePrimitiveAndArray(v, filter);
//           } else if (isRealObject(filter)) {
//               return true;
//           } else if (Array.isArray(filter)) {
//               return ListFilterPipe.compareArrays(v, filter);
//           }
//       }
//
//       return v === filter;
//   }
//
//   private static comparePrimitives(src: any, tar: any, fullMatch: boolean = false): boolean {
//       if (!fullMatch && typeof src === 'string' && typeof tar === 'string') {
//           return src.toLowerCase().includes(tar.toLowerCase());
//       }
//
//       return src === tar;
//   }
//
//   private static comparePrimitiveAndObjectDeep(obj: { [ k: string ]: any }, primitive: any): boolean {
//       let value;
//       for (let v in obj) {
//           value = obj[ v ];
//
//           if (ListFilterPipe.isNullOrUndefined(value)) {
//               continue;
//           }
//           if (ListFilterPipe.isPrimitive(value) && this.comparePrimitives(value, primitive)) {
//               return true;
//           }
//           if (isRealObject(value) && this.comparePrimitiveAndObjectDeep(value, primitive)) {
//               return true;
//           }
//           if (Array.isArray(value) && this.comparePrimitiveAndArrayDeep(value, primitive)) {
//               return true;
//           }
//       }
//
//       return false;
//   }
//
//   private static comparePrimitiveAndArray(array: any[], primitive: any): boolean {
//       return array.length > 0 ? array.indexOf(primitive) >= 0 : true;
//   }
//
//   private static comparePrimitiveAndArrayDeep(array: any[], primitive: any): boolean {
//       for (let value of array) {
//           if (ListFilterPipe.isNullOrUndefined(value)) {
//               continue;
//           }
//           if (ListFilterPipe.isPrimitive(value) && this.comparePrimitives(value, primitive, true)) {
//               return true;
//           }
//           if (isRealObject(value) && this.comparePrimitiveAndObjectDeep(value, primitive)) {
//               return true;
//           }
//           if (Array.isArray(value) && this.comparePrimitiveAndArrayDeep(value, primitive)) {
//               return true;
//           }
//       }
//
//       return false;
//   }
//
//   private static compareObjects(src: { [ k: string ]: any }, tar: { [ k: string ]: any }, logic: any): boolean {
//       if (logic === 'or') {
//           let emptyNum = 0, allNum = 0;
//           for (let k in tar) {
//               allNum++;
//               if (ListFilterPipe.isNullOrUndefined(src[ k ]) || ListFilterPipe.isNullOrUndefined(tar[ k ])
//                   || isEmptyArray(src[ k ]) || isEmptyArray(tar[ k ])) {
//                   emptyNum++;
//                   continue;
//               }
//               if ((k in src) && this.compareAnys(src[ k ], tar[ k ], logic)) {
//                   return true;
//               }
//           }
//
//           return emptyNum === allNum;
//       } else {
//           let allHas = true, emptyNum = 0, allNum = 0;
//           for (let k in tar) {
//               allNum++;
//               if (ListFilterPipe.isNullOrUndefined(src[ k ]) || ListFilterPipe.isNullOrUndefined(tar[ k ])
//                   || isEmptyArray(src[ k ]) || isEmptyArray(tar[ k ])) {
//                   emptyNum++;
//                   continue;
//               }
//               if (!(k in src) || !this.compareAnys(src[ k ], tar[ k ], logic)) {
//                   allHas = false;
//                   break;
//               }
//           }
//
//           return emptyNum === allNum ? true : allHas;
//       }
//   }
//
//   private static compareArrays(src: any[], tar: any[]): boolean {
//       if (src.length < tar.length) {
//           return false;
//       }
//
//       out: for (let t of tar) {
//           if (ListFilterPipe.isNullOrUndefined(t)) {
//               continue;
//           }
//           for (let s of src) {
//               if (ListFilterPipe.isNullOrUndefined(s)) {
//                   continue;
//               }
//               if (isEqual(t, s)) {
//                   continue out;
//               }
//           }
//
//           return false;
//       }
//
//       return true;
//   }
//
//
//
//   */
//
//    private static getAsyncsAndCreateFilterImage(obj: any) {
//        let asyncs: Array<Observable<any>> = [];
//        let image: any;
//
//        if (isObject(obj) && !(obj instanceof Promise || obj instanceof Observable)) {
//            image = {};
//
//            for (let k of Object.keys(obj)) {
//                if (obj[ k ] instanceof Promise || obj[ k ] instanceof Observable) {
//                    image[ k ] = this.generateKey();
//                    asyncs.push(this.generateObservable(obj[ k ], image[ k ]));
//                } else if (isObject(obj[ k ]) || Array.isArray(obj[ k ])) {
//                    let [ asyncsOuter, imageOuter ] = this.getAsyncsAndCreateFilterImage(obj[ k ]);
//                    image[ k ] = imageOuter;
//                    asyncs.push(...asyncsOuter);
//                } else {
//                    image[ k ] = obj[ k ];
//                }
//            }
//        } else if (Array.isArray(obj)) {
//            image = [];
//
//            for (let v of obj) {
//                if (v instanceof Promise || v instanceof Observable) {
//                    let k = this.generateKey();
//                    image.push(k);
//                    asyncs.push(this.generateObservable(v, k));
//                } else if (isObject(v) || Array.isArray(v)) {
//                    let [ asyncsOuter, imageOuter ] = this.getAsyncsAndCreateFilterImage(v);
//                    image.push(imageOuter);
//                    asyncs.push(...asyncsOuter);
//                } else {
//                    image.push(v);
//                }
//            }
//        } else {
//            if (obj instanceof Promise || obj instanceof Observable) {
//                image = this.generateKey();
//                asyncs.push(this.generateObservable(obj, image));
//            } else {
//                image = obj;
//            }
//        }
//
//        return [ asyncs, image ];
//    }
//
//    private static generateKey() {
//        return '__' + uuid(8) + '__';
//    }
//
//    private static generateObservable(stream: Observable<any> | Promise<any>, key: string) {
//        return async2Observable(stream).pipe(
//            startWith(null),
//            map(value => ({ key, value })),
//            shareReplay(1)
//        );
//    }
//
//    private static extendStaticParams(target: any, src: any) {
//        if (src instanceof Promise || src instanceof Observable) {
//            return target;
//        }
//
//        return deepExtend(src, target);
//    }
//
//    private static replaceFilterImageBak(target: any, map: { key: string, value: any }) {
//        if (isObject(target)) {
//            for (let k of Object.keys(target)) {
//                if (target[ k ] === map.key) {
//                    target[ k ] = map.value;
//                } else if (isObject(target[ k ]) || Array.isArray(target[ k ])) {
//                    this.replaceFilterImageBak(target[ k ], map);
//                }
//            }
//        } else if (Array.isArray(target)) {
//            for (let i = 0, len = target.length; i < len; i++) {
//                if (target[ i ] === map.key) {
//                    target[ i ] = map.value;
//                } else if (isObject(target[ i ]) || Array.isArray(target[ i ])) {
//                    this.replaceFilterImageBak(target[ i ], map);
//                }
//            }
//        } else if (target === map.key) {
//            return map.value;
//        }
//
//        return target;
//    }
//
//    private static isSinglePrimitiveObject(v: any) {
//        return isObject(v)
//            && Object.keys(v).length === 1
//            && this.COMPARE_OPERATORS.indexOf(Object.keys(v)[ 0 ].toLowerCase()) >= 0;
//    }
//
//}

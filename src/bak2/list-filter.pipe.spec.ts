//import { ListFilterPipe } from './list-filter.pipe';
//import { ListFilterConfig } from './list-filter-config';
//
//describe('list filter pipe', () => {
//    let config: ListFilterConfig;
//    let pipe: ListFilterPipe;
//
//    beforeEach(() => {
//        config = new ListFilterConfig();
//        pipe = new ListFilterPipe(config);
//    });
//
//    describe('测试 comparePrimitive 方法（srcProp 是原始类型）', () => {
//        let caller: Function;
//
//        beforeEach(() => caller = spyOn(pipe, 'comparePrimitive').and.callThrough());
//
//        it('srcProp 是 null、undefined、空字符串，返回值根据配置决定', () => {
//            expect(caller.call(pipe, null, {})).toBeFalsy();
//            expect(caller.call(pipe, undefined, {})).toBeFalsy();
//            expect(caller.call(pipe, '', {})).toBeFalsy();
//
//            expect(caller.call({ nullExclude: false }, null, {})).toBeTruthy();
//            expect(caller.call({ undefinedExclude: false }, undefined, {})).toBeTruthy();
//            expect(caller.call({ emptyStringExclude: false }, '', {})).toBeTruthy();
//        });
//
//        describe('filterProp 是原始类型', () => {
//            it('字符串和字符串，使用正则匹配', () => {
//                expect(caller.call(pipe, 'ab', 'a')).toBeTruthy();
//                expect(caller.call(null, 'ab', 'c')).toBeFalsy();
//            });
//
//            it('enableDigit2String = true & 数字和字符串，使用正则匹配', () => {
//                expect(caller.call(pipe, 12, '1')).toBeTruthy();
//                expect(caller.call(pipe, 12, '3')).toBeFalsy();
//
//                expect(caller.call(pipe, '12a', 1)).toBeTruthy();
//                expect(caller.call(pipe, '12a', 3)).toBeFalsy();
//            });
//
//            describe('enableDigit2String = false & 其他情况', () => {
//                beforeEach(() => pipe.enableDigit2String = false);
//
//                it('strictMatch = false，使用 ==', () => {
//                    expect(caller.call(pipe, 0, 1)).toBeFalsy();
//                    expect(caller.call(pipe, 0, 0)).toBeTruthy();
//                    expect(caller.call(pipe, 0, Symbol())).toBeFalsy();
//                    expect(caller.call(pipe, 0, NaN)).toBeFalsy();
//
//                    expect(caller.call(pipe, 0, '0')).toBeTruthy();
//                    expect(caller.call(pipe, 0, false)).toBeTruthy();
//                    expect(caller.call(pipe, '0', false)).toBeTruthy();
//                    expect(caller.call(pipe, 1, true)).toBeTruthy();
//                    expect(caller.call(pipe, '1', true)).toBeTruthy();
//                });
//
//                describe('strictMatch = true，使用 ===', () => {
//                    beforeEach(() => pipe.strictMatch = true);
//
//                    it('部分严格比较不成立的情况', () => {
//                        expect(caller.call(pipe, 0, '0')).toBeFalsy();
//                        expect(caller.call(pipe, 0, false)).toBeFalsy();
//                        expect(caller.call(pipe, '0', false)).toBeFalsy();
//                        expect(caller.call(pipe, 1, true)).toBeFalsy();
//                        expect(caller.call(pipe, '1', true)).toBeFalsy();
//                    });
//                });
//            });
//        });
//
//        describe('filterProp 只有一个比较操作符的对象', () => {
//            it('值为不符合使用规则的情况，返回 true', () => {
//                expect(caller.call(pipe, {}, { '$lt': {} })).toBeTruthy();
//                expect(caller.call(pipe, {}, { '$lt': [] })).toBeTruthy();
//                expect(caller.call(pipe, {}, { '$in': 1 })).toBeTruthy();
//            });
//
//            it('值为空，返回 true', () => {
//                expect(caller.call(pipe, {}, { '$lt': null })).toBeTruthy();
//                expect(caller.call(pipe, {}, { '$lt': undefined })).toBeTruthy();
//                expect(caller.call(pipe, {}, { '$lt': '' })).toBeTruthy();
//            });
//
//            describe('严格模式', () => {
//                beforeEach(() => pipe.strictMatch = true);
//
//                it('类型不同，返回 false', () => {
//                    expect(caller.call(pipe, 1, { '$lt': true })).toBeFalsy();
//                    expect(caller.call(pipe, 1, { '$lt': '1' })).toBeFalsy();
//                });
//            });
//
//            describe('其他情况根据操作符比较', () => {
//                describe('$fullMatch', () => {
//                    it('enableDigit2String = true & 数字和字符串或字符串和字符串', () => {
//                        expect(caller.call(pipe, 12, { '$fullMatch': '1' })).toBeFalsy();
//                        expect(caller.call(pipe, ' 12 ', { '$fullMatch': 12 })).toBeTruthy();
//                        expect(caller.call(pipe, 12, { '$fullMatch': ' 12 ' })).toBeTruthy();
//                        expect(caller.call(pipe, 'abc', { '$fullMatch': 'AbC' })).toBeTruthy();
//                    });
//
//                    it('比较对象不是字符串和数字时，退化为 === 或 == 比较，由 strictMatch 配置决定', () => {
//                        expect(caller.call(pipe, 1, { '$fullMatch': true })).toBeTruthy();
//                        expect(caller.call(pipe, 0, '0')).toBeTruthy();
//                    });
//                });
//
//                it('$lt / $gt', () => {
//                    expect(caller.call(pipe, 5, { '$lt': 7 })).toBeTruthy();
//                    expect(caller.call(pipe, 5, { '$lt': '7' })).toBeTruthy();
//                    expect(caller.call(pipe, 5, { '$lt': 5 })).toBeFalsy();
//                    expect(caller.call(pipe, 0, { '$lt': true })).toBeTruthy();
//                });
//
//                it('$lte / $gte', () => {
//                    expect(caller.call(pipe, 5, { '$lte': 5 })).toBeTruthy();
//                    expect(caller.call(pipe, 5, { '$lte': 4 })).toBeFalsy();
//                });
//
//                it('$in / $nin', () => {
//                    expect(caller.call(pipe, 5, { '$in': [ 3, 5, 8 ] })).toBeTruthy();
//                    expect(caller.call(pipe, 5, { '$in': [ 9, 10 ] })).toBeFalsy();
//
//                    expect(caller.call(pipe, 5, { '$nin': [ 3, 5, 8 ] })).toBeFalsy();
//                    expect(caller.call(pipe, 5, { '$nin': [ 9, 10 ] })).toBeTruthy();
//                });
//
//                it('$range', () => {
//                    expect(caller.call(pipe, 5, { '$range': [ 5, 10 ] })).toBeTruthy();
//                    expect(caller.call(pipe, 5, { '$range': [ 8, 10 ] })).toBeFalsy();
//                });
//
//                it('无法比较抛异常的情况返回 true', () => {
//                    expect(caller.call(pipe, 5, { '$lt': Symbol() })).toBeTruthy();
//                });
//            });
//        });
//    });
//
//    describe('数据测试', () => {
//        describe('srcProp 是原始类型，filterProp 是原始类型', () => {
//            let data: any[];
//
//            beforeEach(() => data = [ undefined, null, '', 12, '12', false, true ]);
//
//            it('非严格模式，排除空值，允许数字转字符串', () => {
//                expect(pipe.transform(data, 2)).toEqual([ '12' ]);
//                expect(pipe.transform(data, '2')).toEqual([ 12, '12' ]);
//                expect(pipe.transform(data, 0)).toEqual([ false ]);
//                expect(pipe.transform(data, 1)).toEqual([ '12', true ]);
//            });
//
//            describe('严格模式，包含空值，禁止数字转字符串', () => {
//                beforeEach(() => {
//                    pipe.strictMatch = true;
//                    pipe.nullExclude = false;
//                    pipe.undefinedExclude = false;
//                    pipe.emptyStringExclude = false;
//                    pipe.enableDigit2String = false;
//                });
//
//                it('相同数据测试', () => {
//                    expect(pipe.transform(data, 2)).toEqual([ undefined, null, '' ]);
//                    expect(pipe.transform(data, '2')).toEqual([ undefined, null, '', '12' ]);
//                    expect(pipe.transform(data, 0)).toEqual([ undefined, null, '' ]);
//                    expect(pipe.transform(data, 1)).toEqual([ undefined, null, '' ]);
//                });
//            });
//        });
//    });
//
//});
import { ListFilterPipe } from './list-filter.pipe';
import { ListFilterConfig } from './list-filter-config';
import { data } from './data';
import { Subject } from 'rxjs';

describe('list filter pipe', () => {
    let config: ListFilterConfig;
    let pipe: ListFilterPipe;

    beforeEach(() => {
        config = new ListFilterConfig();
        pipe = new ListFilterPipe(config);
    });

    describe('测试 comparePrimitive 方法（srcProp 是原始类型）', () => {
        let caller: Function;

        beforeEach(() => caller = spyOn(pipe, 'comparePrimitive').and.callThrough());

        it('srcProp 是 null、undefined、空字符串，返回值根据配置决定', () => {
            expect(caller.call(pipe, null, {})).toBeFalsy();
            expect(caller.call(pipe, undefined, {})).toBeFalsy();
            expect(caller.call(pipe, '', {})).toBeFalsy();

            expect(caller.call({ nullExclude: false }, null, {})).toBeTruthy();
            expect(caller.call({ undefinedExclude: false }, undefined, {})).toBeTruthy();
            expect(caller.call({ emptyStringExclude: false }, '', {})).toBeTruthy();
        });

        describe('filterProp 是原始类型', () => {
            it('字符串和字符串，使用正则匹配', () => {
                expect(caller.call(pipe, 'ab', 'a')).toBeTruthy();
                expect(caller.call(null, 'ab', 'c')).toBeFalsy();
            });

            it('enableDigit2String = true & 数字和字符串，使用正则匹配', () => {
                expect(caller.call(pipe, 12, '1')).toBeTruthy();
                expect(caller.call(pipe, 12, '3')).toBeFalsy();

                expect(caller.call(pipe, '12a', 1)).toBeTruthy();
                expect(caller.call(pipe, '12a', 3)).toBeFalsy();
            });

            describe('enableDigit2String = false & 其他情况', () => {
                beforeEach(() => pipe.enableDigit2String = false);

                it('strictMatch = false，使用 ==', () => {
                    expect(caller.call(pipe, 0, 1)).toBeFalsy();
                    expect(caller.call(pipe, 0, 0)).toBeTruthy();
                    expect(caller.call(pipe, 0, Symbol())).toBeFalsy();
                    expect(caller.call(pipe, 0, NaN)).toBeFalsy();

                    expect(caller.call(pipe, 0, '0')).toBeTruthy();
                    expect(caller.call(pipe, 0, false)).toBeTruthy();
                    expect(caller.call(pipe, '0', false)).toBeTruthy();
                    expect(caller.call(pipe, 1, true)).toBeTruthy();
                    expect(caller.call(pipe, '1', true)).toBeTruthy();
                });

                describe('strictMatch = true，使用 ===', () => {
                    beforeEach(() => pipe.strictMatch = true);

                    it('部分严格比较不成立的情况', () => {
                        expect(caller.call(pipe, 0, '0')).toBeFalsy();
                        expect(caller.call(pipe, 0, false)).toBeFalsy();
                        expect(caller.call(pipe, '0', false)).toBeFalsy();
                        expect(caller.call(pipe, 1, true)).toBeFalsy();
                        expect(caller.call(pipe, '1', true)).toBeFalsy();
                    });
                });
            });
        });
    });

    describe('filter 是原始类型，执行 compareDeep 方法', () => {
        let caller: Function;

        beforeEach(() => caller = spyOn(pipe, 'compareDeep'));

        it('filter 是原始类型', () => {
            pipe.transform(data, 23);
            expect(caller).toHaveBeenCalled();
        });

        it('filter 是只具有单个比较操作符的对象', () => {
            pipe.transform(data, { '$gt': 1 });
            expect(caller).toHaveBeenCalled();
        });

        it('filter 是对象', () => {
            pipe.transform(data, { age: 19 });
            expect(caller).not.toHaveBeenCalled();
        });

        it('filter 是含多个比较操作符的对象', () => {
            pipe.transform(data, { '$gt': 1, '$fullMatch': 'n' });
            expect(caller).not.toHaveBeenCalled();
        });

        it('filter 不是比较操作符', () => {
            pipe.transform(data, { '$or': 1 });
            expect(caller).not.toHaveBeenCalled();
        });
    });

    describe('filter 含有异步流测试', () => {
        let filter: any;
        let nameSubject: Subject<any>;
        let ageSubject: Subject<any>;
        let lovesSubject: Subject<any>;

        beforeEach(() => {
            nameSubject = new Subject();
            ageSubject = new Subject();
            lovesSubject = new Subject();

            filter = {
                //'$or': [
                //    { name: nameSubject.asObservable() },
                //    { age: ageSubject.asObservable() }
                //],
                loves: lovesSubject.asObservable()
            };

            filter = lovesSubject.asObservable();
        });

        it('', () => {
            pipe.transform(data, filter).subscribe();
            nameSubject.next('1');
            ageSubject.next(2);
            lovesSubject.next('a');

            setTimeout(() => {
                nameSubject.next('11');
                ageSubject.next(22);
                lovesSubject.next('aa');
            }, 500);
        });
    });

});
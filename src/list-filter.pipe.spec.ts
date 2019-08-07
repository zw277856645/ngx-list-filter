import { ListFilterConfig, ListFilterPipe } from './list-filter.pipe';

describe('list filter pipe', () => {
    let config: ListFilterConfig;
    let pipe: ListFilterPipe;

    const list = [
        {
            name: '张三',
            age: 12,
            addr: {
                street: '南京路',
                code: '25号'
            },
            man: true,
            loves: [ '苹果', '橘子' ]
        },
        {
            name: '翠花',
            age: 28,
            addr: {
                street: '北京路',
                code: '1223号'
            },
            man: true,
            loves: [ '苹果', '栗子', '桃子' ]
        }
    ];

    beforeEach(() => {
        config = new ListFilterConfig();
        pipe = new ListFilterPipe(config);
    });

    describe('测试 isPrimitive 方法', () => {
        let caller: Function;

        beforeEach(() => caller = spyOn(ListFilterPipe, 'isPrimitive').and.callThrough());

        it('所有原始类型返回 true，其他返回 false', () => {
            expect(caller.call(null, 1)).toBeTruthy();
            expect(caller.call(null, 'any')).toBeTruthy();
            expect(caller.call(null, null)).toBeTruthy();
            expect(caller.call(null, undefined)).toBeTruthy();
            expect(caller.call(null, false)).toBeTruthy();
            expect(caller.call(null, Symbol())).toBeTruthy();
            expect(caller.call(null, NaN)).toBeTruthy();

            expect(caller.call(null, {})).toBeFalsy();
            expect(caller.call(null, [])).toBeFalsy();
            expect(caller.call(null, /any/)).toBeFalsy();
        });
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
            pipe.transform(list, 23);
            expect(caller).toHaveBeenCalled();
        });

        it('filter 是只具有单个比较操作符的对象', () => {
            pipe.transform(list, { '$gt': 1 });
            expect(caller).toHaveBeenCalled();
        });

        it('filter 是对象', () => {
            pipe.transform(list, { age: 19 });
            expect(caller).not.toHaveBeenCalled();
        });

        it('filter 是含多个比较操作符的对象', () => {
            pipe.transform(list, { '$gt': 1, '$fullMatch': 'n' });
            expect(caller).not.toHaveBeenCalled();
        });

        it('filter 不是比较操作符', () => {
            pipe.transform(list, { '$or': 1 });
            expect(caller).not.toHaveBeenCalled();
        });
    });

});
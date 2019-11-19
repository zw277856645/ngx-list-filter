import { ListFilterPipe } from './list-filter.pipe';
import { TestBed } from '@angular/core/testing';
import { ListFilterModule } from './list-filter.module';
import { EventEmitter } from '@angular/core';
import { data, data_0, data_1, data_2, data_3, data_4, data_5 } from './data';

describe('list filter pipe', () => {
    let pipe: ListFilterPipe;

    beforeEach(() => {
        TestBed.configureTestingModule({ imports: [ ListFilterModule ] });
        pipe = TestBed.get(ListFilterPipe);
    });

    describe('test extendStaticParams', () => {
        let caller: Function;

        beforeEach(() => caller = spyOn(ListFilterPipe, 'extendStaticParams').and.callThrough());

        it('test extendStaticParams', () => {
            let target: any = {
                    age: null,
                    sex: null,
                    father: 'zhang san',
                    name: {
                        $reg: 'name',
                        likes: {
                            $all: 'xxx'
                        }
                    },
                    loves: [ 1, 'xxx', null, { $in: 'hh' } ]
                },
                src: any = {
                    age: 123,
                    sex: undefined,
                    father: null,
                    name: {
                        $reg: new EventEmitter(),
                        likes: {
                            $all: new EventEmitter()
                        }
                    },
                    loves: [ 2, 'yyy', new EventEmitter(), { $in: new EventEmitter() } ]
                };

            caller.call(ListFilterPipe, target, src);
            expect(target).toEqual({
                age: 123,
                sex: undefined,
                father: null,
                name: {
                    $reg: 'name',
                    likes: {
                        $all: 'xxx'
                    }
                },
                loves: [ 2, 'yyy', null, { $in: 'hh' } ]
            });
        });
    });

    describe('test deleteNullConstraints', () => {
        let caller: Function;

        beforeEach(() => caller = spyOn(ListFilterPipe, 'deleteNullConstraints').and.callThrough());

        it('test deleteNullConstraints', () => {
            expect(caller.call(
                ListFilterPipe,
                {
                    $or: {
                        age: { $gt: 228, $lt: null },
                        name: null
                    },
                    $and: [
                        { age: { $gt: null } },
                        { name: null }
                    ],
                    sex: null,
                    loves: {
                        $in: [],
                        $eleMatch: {
                            age: { $gt: 228, $lt: null },
                            name: null,
                            $nor: {
                                sex: null,
                                desc: 'aa',
                                loves: [ null ],
                                label: {
                                    $lt: null
                                }
                            }
                        }
                    },
                    age: {
                        $between: [ null, 12 ],
                        $in: [ null, undefined ]
                    }
                }
            )).toEqual(
                {
                    $or: {
                        age: { $gt: 228 }
                    },
                    loves: {
                        $eleMatch: {
                            age: { $gt: 228 },
                            $nor: {
                                desc: 'aa',
                            }
                        }
                    },
                    age: {
                        $between: [ null, 12 ]
                    }
                }
            );
        });
    });

    describe('比较操作符', () => {
        it('查询条件为空时，返回所有', () => {
            expect(pipe.transform(data, { age: { $lt: undefined }, name: null })).toEqual(data);
            expect(pipe.transform(data, { loves: { $in: [] } })).toEqual(data);
            expect(pipe.transform(data, { loves: { $nin: null } })).toEqual(data);
            expect(pipe.transform(data, { name: { $not: { $exists: null } } })).toEqual(data);
            expect(pipe.transform(data, { families: { $elemMatch: { age: { $gt: null } } } })).toEqual(data);
            expect(pipe.transform(data, { $or: { age: { $lt: null }, id: null } })).toEqual(data);
            expect(pipe.transform(data, { $not: { age: { $lt: null } } })).toEqual(data);
        });

        it('$lt、$lte、$gt、$gte', () => {
            expect(pipe.transform(data, { age: { $lt: 28 } })).toEqual([ data_0, data_4, data_5 ]);
            expect(pipe.transform(data, { age: { $lte: '28' } })).toEqual([ data_0, data_1, data_4, data_5 ]);
        });

        it('$in、$nin', () => {
            expect(pipe.transform(data, { age: { $in: [ 28, '77', 200 ] } })).toEqual([ data_1, data_2 ]);
            expect(pipe.transform(data, { name: { $nin: [ '张三', '李四', '王五', null ] } }))
                .toEqual([ data_1, data_3 ]);

            expect(pipe.transform(data, { loves: [ '苹果' ] }))
                .toEqual([ data_0, data_1 ], '筛选值为数组时，省略操作符默认为 $in');
            expect(pipe.transform(data, { loves: { $in: [ '苹果' ] } })).toEqual([ data_0, data_1 ]);
            expect(pipe.transform(data, { loves: { $in: [ '苹果', '橘子' ] } }))
                .toEqual([ data_0, data_1, data_3, data_4, data_5 ]);
        });

        it('$between', () => {
            expect(pipe.transform(data, { age: { $between: [ '28', 100 ] } }) as any[]).toEqual([ data_2, data_3 ]);
        });

        it('$eq，与没有操作符等效', () => {
            expect(pipe.transform(data, { name: '张三' })).toEqual([ data_0 ]);
            expect(pipe.transform(data, { name: { $eq: '张三' } })).toEqual([ data_0 ]);
            expect(pipe.transform(data, { name: { $eq: '张' } })).toEqual([], '非正则匹配');

            expect(pipe.transform(data, { age: 28 }) as any[]).toEqual([ data_1 ]);
            expect(pipe.transform(data, { age: { $eq: '28' } })).toEqual([ data_1 ]);

            expect(pipe.transform(data, { loves: '苹果' })).toEqual([ data_0, data_1 ]);
            expect(pipe.transform(data, { loves: { $eq: '苹果' } })).toEqual([ data_0, data_1 ]);
            expect(pipe.transform(data, { loves: { $in: [ '苹果' ] } })).toEqual([ data_0, data_1 ]);
            expect(pipe.transform(data, { loves: { $contains: '苹果' } })).toEqual([ data_0, data_1 ]);

            expect(pipe.transform(data, { date: '2019/8/12 1:34:55' })).toEqual([ data_0, data_1 ]);
            expect(pipe.transform(data, { date: new Date('2019/8/12 1:34:55') })).toEqual([ data_0, data_1 ]);
            expect(pipe.transform(data, { date: Date.parse('2019/8/12 1:34:55') })).toEqual([ data_0, data_1 ]);
        });

        it('$neq', () => {
            expect(pipe.transform(data, { age: { $neq: 12 } })).toEqual([ data_1, data_2, data_3 ]);

            expect(pipe.transform(data, { loves: { $neq: '橘子' } })).toEqual([ data_1, data_2 ]);
            expect(pipe.transform(data, { loves: { $nin: [ '橘子' ] } })).toEqual([ data_1, data_2 ]);
            expect(pipe.transform(data, { loves: { $not: { $contains: '橘子' } } })).toEqual([ data_1, data_2 ]);
        });

        it('$deepEquals', () => {
            expect(pipe.transform(data,
                { addr: { $deepEquals: { street: '南京路', code: '25号', rooms: [ 12, 23 ] } } }
            )).toEqual([ data_0 ]);
        });

        it('$exists', () => {
            expect(pipe.transform(data, { name: { $exists: true } }))
                .toEqual([ data_0, data_1, data_2 ]);
            expect(pipe.transform(data, { name: { $exists: false } }))
                .toEqual([ data_3, data_4, data_5 ]);

            expect(pipe.transform(data, { 'addr.rooms': { $exists: true } })).toEqual([ data_0 ]);
            expect(pipe.transform(data, { 'addr.rooms': { $exists: false } }))
                .toEqual([ data_1, data_2, data_3, data_4, data_5 ]);
        });

        it('$reg，默认忽略大小写', () => {
            expect(pipe.transform(data, { id: /ab/ })).toEqual([ data_0 ]);
            expect(pipe.transform(data, { id: { $reg: /ab/ } })).toEqual([ data_0, data_1 ]);
            expect(pipe.transform(data, { id: { $reg: 'ab' } })).toEqual([ data_0, data_1 ]);
            expect(pipe.transform(data, { id: { $reg: 'ab', $flags: 'i' } })).toEqual([ data_0, data_1 ]);
        });

        it('$before、$after', () => {
            expect(pipe.transform(data, { date: { $before: '2019/8/1 12:00:00' } })).toEqual([ data_2, data_3 ]);
            expect(pipe.transform(data, { date: { $after: '2019/8/5 12:00:00' } }))
                .toEqual([ data_0, data_1, data_4, data_5 ]);
        });

        it('$contains', () => {
            expect(pipe.transform(data, { loves: '苹果' })).toEqual([ data_0, data_1 ]);
            expect(pipe.transform(data, { loves: { $contains: '苹果' } })).toEqual([ data_0, data_1 ]);
        });

        it('$all', () => {
            expect(pipe.transform(data, { loves: { $all: [ '苹果', '橘子' ] } })).toEqual([ data_0 ]);
        });

        it('$any', () => {
            expect(pipe.transform(data, { loves: { $any: [ '苹果', '栗子' ] } })).toEqual([ data_0, data_1 ]);
        });

        it('$size', () => {
            expect(pipe.transform(data, { loves: { $size: 2 } })).toEqual([ data_0 ]);
            expect(pipe.transform(data, { addr: { $size: 3 } })).toEqual([ data_0 ]);
        });

        it('$mod', () => {
            expect(pipe.transform(data, { age: { $mod: [ 2, 1 ] } })).toEqual([ data_2 ]);
        });

        it('点记法，深度属性查找', () => {
            expect(pipe.transform(data, { 'addr.code': { $reg: '5' } })).toEqual([ data_0 ]);
            expect(pipe.transform(data, { 'addr.rooms': { $contains: 12 } })).toEqual([ data_0 ]);
        });

        it('$elemMatch', () => {
            expect(pipe.transform(data, { families: { $elemMatch: { age: { $gt: 70 } } } })).toEqual([ data_0 ]);
            expect(pipe.transform(data, { families: { $elemMatch: { 'addr.rooms': 122 } } }))
                .toEqual([ data_0, data_1 ]);
        });

        it('$cb', () => {
            expect(pipe.transform(data, { families: { $cb: (v: any[]) => v && v.length } }))
                .toEqual([ data_0, data_1 ]);
        });
    });

    describe('顶层 - 逻辑操作符', () => {
        it('$or', () => {
            expect(pipe.transform(data, { $or: { age: { $lt: 28 }, id: /ab/i } }))
                .toEqual([ data_0, data_1, data_4, data_5 ]);
            expect(pipe.transform(data, { $or: [ { age: { $lt: 28 } }, { id: /ab/i } ] }))
                .toEqual([ data_0, data_1, data_4, data_5 ]);
        });

        it('$nor', () => {
            expect(pipe.transform(data, { $nor: { age: { $lt: 28 }, id: /ab/i } })).toEqual([ data_2, data_3 ]);
            expect(pipe.transform(data, { $nor: [ { age: { $lt: 28 } }, { id: /ab/i } ] })).toEqual([ data_2, data_3 ]);
        });

        it('$and，与没有操作符等效', () => {
            expect(pipe.transform(data, { age: { $lt: 28 }, id: /ab/i })).toEqual([ data_0 ]);
            expect(pipe.transform(data, { $and: { age: { $lt: 28 }, id: /ab/i } })).toEqual([ data_0 ]);
            expect(pipe.transform(data, { $and: [ { age: { $lt: 28 } }, { id: /ab/i } ] })).toEqual([ data_0 ]);
        });

        it('$not', () => {
            expect(pipe.transform(data, { $not: { age: { $lt: 28 } } })).toEqual([ data_1, data_2, data_3 ]);
        });
    });

    describe('具体属性 - 逻辑操作符', () => {
        it('$or', () => {
            expect(pipe.transform(data, { age: { $or: { $lt: 28, $gt: 50 } } }))
                .toEqual([ data_0, data_2, data_4, data_5 ]);
            expect(pipe.transform(data, { age: { $or: [ { $lt: 28 }, { $gt: 50 } ] } }))
                .toEqual([ data_0, data_2, data_4, data_5 ]);
        });

        it('$nor', () => {
            expect(pipe.transform(data, { age: { $nor: { $lt: 28, $gt: 50 } } })).toEqual([ data_1, data_3 ]);
            expect(pipe.transform(data, { age: { $nor: [ { $lt: 28 }, { $gt: 50 } ] } })).toEqual([ data_1, data_3 ]);
        });

        it('$and，与没有操作符等效', () => {
            expect(pipe.transform(data, { age: { $gt: 28, $lt: 50 } })).toEqual([ data_3 ]);
            expect(pipe.transform(data, { age: { $and: { $gt: 28, $lt: 50 } } })).toEqual([ data_3 ]);
            expect(pipe.transform(data, { age: { $and: [ { $gt: 28 }, { $lt: 50 } ] } })).toEqual([ data_3 ]);
        });

        it('$not', () => {
            expect(pipe.transform(data, { age: { $not: { $lt: 28 } } })).toEqual([ data_1, data_2, data_3 ]);
        });
    });

    it('混合', () => {
        expect(pipe.transform(data, { $not: { age: { $and: { $gt: 28, $lt: 50 } } } }))
            .toEqual([ data_0, data_1, data_2, data_4, data_5 ]);

        expect(pipe.transform(data, { $not: { $or: { age: { $gt: 28 }, id: /ab/i } } })).toEqual([ data_4, data_5 ]);
        expect(pipe.transform(data, { $nor: { age: { $gt: 28 }, id: /ab/i } })).toEqual([ data_4, data_5 ]);

        expect(pipe.transform(data,
            {
                $or: {
                    families: {
                        $elemMatch: {
                            age: { $gt: 70 },
                            'addr.rooms': { $contains: 122 }
                        }
                    },
                    age: { $and: { $gte: 28, $lte: 50 } },
                    $and: [
                        { man: true },
                        { loves: { $any: [ '苹果', '橘子' ] } }
                    ]
                }
            }
        )).toEqual([ data_0, data_1, data_3, data_5 ]);
    });

});
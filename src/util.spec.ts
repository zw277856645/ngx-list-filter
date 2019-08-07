import { isPrimitive } from './util';

describe('测试 isPrimitive 方法', () => {
    it('所有原始类型返回 true，其他返回 false', () => {
        expect(isPrimitive(1)).toBeTruthy();
        expect(isPrimitive('any')).toBeTruthy();
        expect(isPrimitive(null)).toBeTruthy();
        expect(isPrimitive(undefined)).toBeTruthy();
        expect(isPrimitive(false)).toBeTruthy();
        expect(isPrimitive(Symbol())).toBeTruthy();
        expect(isPrimitive(NaN)).toBeTruthy();

        expect(isPrimitive({})).toBeFalsy();
        expect(isPrimitive([])).toBeFalsy();
        expect(isPrimitive(/any/)).toBeFalsy();
    });
});
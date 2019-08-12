import { isEmpty } from './util';
import { LogicOperatorHandler } from './logic-operator-handler';

declare var _: any;

export class CompareOperatorHandler {

    constructor(private logicHandler: LogicOperatorHandler) {
    }

    match(value: any, constraint: any) {
        if (constraint === value) {
            return true;
        } else if (constraint instanceof RegExp) {
            return this.$regex(value, constraint);
        } else if (Array.isArray(constraint)) {
            return this.$in(value, constraint);
        } else if (constraint && typeof constraint === 'object') {
            if (constraint instanceof Date) {
                return this.$eq(value, constraint.getTime());
            } else {
                if (constraint.$regex) {
                    return this.$regex(value, new RegExp(constraint.$regex, constraint.$options));
                }

                for (let key in constraint) {
                    if (constraint.hasOwnProperty(key)) {
                        if (!this[ key ]) {
                            return this.$eq(value, constraint);
                        } else if (!this[ key ](value, constraint[ key ])) {
                            return false;
                        }
                    }
                }

                return true;
            }
        } else if (Array.isArray(value)) {
            for (let v of value) {
                if (this.$eq(v, constraint)) {
                    return true;
                }
            }

            return false;
        } else if (isEmpty(constraint)) {
            return this.$null(value);
        } else {
            return this.$eq(value, constraint);
        }
    }

    $cb(value: any, constraint: Function) {
        return constraint(value);
    }

    $null(values: any) {
        if (isEmpty(values)) {
            return true;
        } else if (Array.isArray(values)) {
            for (let v of values) {
                if (!this.$null(v)) {
                    return false;
                }
            }

            return true;
        } else {
            return false;
        }
    }

    $eq(value: any, constraint: any) {
        if (value === constraint) {
            return true;
        } else if (Array.isArray(value)) {
            for (let v of value) {
                if (this.$eq(v, constraint)) {
                    return true;
                }
            }

            return false;
        } else if (isEmpty(constraint)) {
            return this.$null(value);
        } else if (isEmpty(value)) {
            return false;
        } else if (value instanceof Date) {
            if (constraint instanceof Date) {
                return value.getTime() === constraint.getTime();
            } else if (typeof constraint === 'number') {
                return value.getTime() === constraint;
            } else if (typeof constraint === 'string') {
                return value.getTime() === (new Date(constraint)).getTime();
            }
        } else {
            return value == constraint;
        }
    }

    $exists(value: any, constraint: any) {
        return (value !== undefined) == (constraint && true);
    }

    $deepEquals(value: any, constraint: any) {
        if (typeof _ === 'undefined' || typeof _.isEqual === 'undefined') {
            return JSON.stringify(value) === JSON.stringify(constraint);
        } else {
            return _.isEqual(value, constraint);
        }
    }

    $neq(values: any, constraint: any) {
        return !this.match(values, constraint);
    }

    $or(values: any, constraint: any) {
        if (!Array.isArray(values)) {
            values = [ values ];
        }

        for (let v of values) {
            for (let c of constraint) {
                if (this.match(v, c)) {
                    return true;
                }
            }
        }

        return false;
    }

    $nor(values: any, constraint: any) {
        return !this.$or(values, constraint);
    }

    $and(values: any, constraint: any) {
        if (!Array.isArray(constraint)) {
            throw new Error('$and operator needs array of constraint objects');
        }

        for (let c of constraint) {
            if (!this.match(values, c)) {
                return false;
            }
        }

        return true;
    }

    $in(values: any, constraint: any) {
        if (!Array.isArray(constraint)) {
            throw new Error('$in requires an array operand');
        }

        if (!Array.isArray(values)) {
            values = [ values ];
        }

        for (let v of values) {
            for (let c of constraint) {
                if (constraint.indexOf(v) >= 0 || this.match(v, c)) {
                    return true;
                }
            }
        }

        return false;
    }

    $nin(values: any, constraint: any) {
        return !this.$in(values, constraint);
    }

    $elemMatch(values: any, constraint: any) {
        for (let v of values) {
            if (this.logicHandler.match(v, constraint)) {
                return true;
            }
        }

        return false;
    }

    $contains(values: any[], constraint: any) {
        return values.indexOf(constraint) >= 0;
    }

    $regex(values: any, constraint: RegExp) {
        if (Array.isArray(values)) {
            for (let v of values) {
                if (constraint.test(v)) {
                    return true;
                }
            }
        } else {
            return constraint.test(values);
        }
    }

    $gte(values: any, ref: any) {
        return !this.$null(values) && values >= CompareOperatorHandler.resolve(ref);
    }

    $gt(values: any, ref: any) {
        return !this.$null(values) && values > CompareOperatorHandler.resolve(ref);
    }

    $lt(values: any, ref: any) {
        return !this.$null(values) && values < CompareOperatorHandler.resolve(ref);
    }

    $lte(values: any, ref: any) {
        return !this.$null(values) && values <= CompareOperatorHandler.resolve(ref);
    }

    $before(values: any, ref: any) {
        if (typeof ref === 'string') {
            ref = Date.parse(ref);
        }
        if (typeof values === 'string') {
            values = Date.parse(values);
        }

        return this.$lte(values, ref);
    }

    $after(values: any, ref: any) {
        if (typeof ref === 'string') {
            ref = Date.parse(ref);
        }
        if (typeof values === 'string') {
            values = Date.parse(values);
        }

        return this.$gte(values, ref);
    }

    $all(values: any, constraint: any) {
        if (!Array.isArray(constraint)) {
            throw new Error('$all requires an array operand');
        }

        if (!Array.isArray(values)) {
            values = [ values ];
        }

        for (let c of constraint) {
            if (!this.$eq(values, c)) {
                return false;
            }
        }

        return true;
    }

    $any(values: any, constraint: any) {
        if (!Array.isArray(constraint)) {
            throw new Error('$any requires an array operand');
        }

        if (!Array.isArray(values)) {
            values = [ values ];
        }

        for (let c of constraint) {
            if (this.$eq(values, c)) {
                return true;
            }
        }

        return false;
    }

    $size(values: any, ref: any) {
        return (typeof values === 'object' && (values.length === ref || Object.keys(values).length === ref));
    }

    $mod(values: any, ref: any) {
        return values % ref[ 0 ] === ref[ 1 ];
    }

    $between(values: any, ref: any) {
        return this.match(values, { $gt: ref[ 0 ], $lt: ref[ 1 ] });
    }

    private static resolve(ref: any) {
        if (typeof ref === 'object') {
            if (ref[ '$date' ]) {
                return Date.parse(ref[ '$date' ]);
            }
        }

        return ref;
    }
}
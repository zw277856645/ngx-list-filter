import { isObject, nullValue } from './util';
import { LogicOperatorHandler } from './logic-operator-handler';

declare var _: any;

export class CompareOperatorHandler {

    constructor(private logicHandler: LogicOperatorHandler) {
    }

    match(value: any, constraint: any) {
        if (constraint === value) {
            return true;
        } else if (constraint instanceof RegExp) {
            return this.$reg(value, constraint);
        } else if (Array.isArray(constraint)) {
            return this.$in(value, constraint);
        } else if (isObject(constraint)) {
            if (constraint instanceof Date) {
                return this.$eq(value, constraint.getTime());
            } else {
                if (constraint.$reg) {
                    return this.$reg(
                        value,
                        new RegExp(constraint.$reg, constraint.$flags || this.logicHandler.regFlags)
                    );
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
        } else {
            return this.$eq(value, constraint);
        }
    }

    $gte(value: any, ref: any) {
        return !nullValue(value) && value >= ref;
    }

    $gt(value: any, ref: any) {
        return !nullValue(value) && value > ref;
    }

    $lt(value: any, ref: any) {
        return !nullValue(value) && value < ref;
    }

    $lte(value: any, ref: any) {
        return !nullValue(value) && value <= ref;
    }

    $in(value: any, constraint: any) {
        if (!Array.isArray(constraint)) {
            throw new Error('$in requires an array operand');
        }

        if (!Array.isArray(value)) {
            value = [ value ];
        }

        for (let v of value) {
            for (let c of constraint) {
                if (constraint.indexOf(v) >= 0 || this.match(v, c)) {
                    return true;
                }
            }
        }

        return false;
    }

    $nin(value: any, constraint: any) {
        return !this.$in(value, constraint);
    }

    $between(value: any, ref: any) {
        if (!Array.isArray(ref)) {
            throw new Error('$between operator needs array of constraint objects');
        }

        return this.match(value, { $gt: ref[ 0 ], $lt: ref[ 1 ] });
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
        } else if (value instanceof Date) {
            if (constraint instanceof Date) {
                return value.getTime() === constraint.getTime();
            } else if (typeof constraint === 'number') {
                return value.getTime() === constraint;
            } else if (typeof constraint === 'string') {
                return value.getTime() === (new Date(constraint)).getTime();
            }
        } else {
            // tslint:disable-next-line:triple-equals
            return value == constraint;
        }
    }

    $neq(value: any, constraint: any) {
        return !this.$eq(value, constraint);
    }

    $deepEquals(value: any, constraint: any) {
        if (nullValue(value)) {
            return false;
        } else {
            if (typeof _ === 'undefined' || typeof _.isEqual === 'undefined') {
                return JSON.stringify(value) === JSON.stringify(constraint);
            } else {
                return _.isEqual(value, constraint);
            }
        }
    }

    $exists(value: any, constraint: any) {
        return !nullValue(value) === (constraint && true);
    }

    $reg(value: any, constraint: RegExp) {
        if (Array.isArray(value)) {
            for (let v of value) {
                if (constraint.test(v)) {
                    return true;
                }
            }
        } else {
            return constraint.test(value);
        }
    }

    $before(value: any, ref: any) {
        return this.$lte(CompareOperatorHandler.resolveDate(value), CompareOperatorHandler.resolveDate(ref));
    }

    $after(value: any, ref: any) {
        return this.$gte(CompareOperatorHandler.resolveDate(value), CompareOperatorHandler.resolveDate(ref));
    }

    $contains(value: any, constraint: any) {
        return !nullValue(value) && value.indexOf(constraint) >= 0;
    }

    $all(value: any, constraint: any) {
        if (!Array.isArray(constraint)) {
            throw new Error('$and operator needs array of constraint objects');
        }

        for (let c of constraint) {
            if (!this.match(value, c)) {
                return false;
            }
        }

        return true;
    }

    $any(value: any, constraint: any) {
        if (!Array.isArray(constraint)) {
            throw new Error('$any operator needs array of constraint objects');
        }

        for (let c of constraint) {
            if (this.match(value, c)) {
                return true;
            }
        }

        return false;
    }

    $size(value: any, ref: any) {
        return (typeof value === 'object' && (value.length === ref || Object.keys(value).length === ref));
    }

    $mod(value: any, ref: any) {
        return !nullValue(value) && (value % ref[ 0 ] === ref[ 1 ]);
    }

    $elemMatch(value: any, constraint: any) {
        for (let v of (value || [])) {
            if (this.logicHandler.match(v, constraint)) {
                return true;
            }
        }

        return false;
    }

    $cb(value: any, constraint: Function) {
        return constraint(value);
    }

    $not(value: any, constraint: any) {
        return !this.match(value, constraint);
    }

    $or(value: any, constraint: any) {
        return this.logicHandler.$or.call(this, value, constraint);
    }

    $nor(value: any, constraint: any) {
        return !this.$or(value, constraint);
    }

    $and(value: any, constraint: any) {
        return this.logicHandler.$and.call(this, value, constraint);
    }

    private static resolveDate(value: any) {
        if (typeof value === 'string') {
            return Date.parse(value);
        } else if (value instanceof Date) {
            return value.getTime();
        } else {
            return value;
        }
    }

}
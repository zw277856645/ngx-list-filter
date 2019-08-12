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
            return this.$reg(value, constraint);
        } else if (Array.isArray(constraint)) {
            return this.$in(value, constraint);
        } else if (constraint && typeof constraint === 'object') {
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
        } else if (isEmpty(constraint)) {
            return this.null(value);
        } else {
            return this.$eq(value, constraint);
        }
    }

    $gte(values: any, ref: any) {
        return !this.null(values) && values >= ref;
    }

    $gt(values: any, ref: any) {
        return !this.null(values) && values > ref;
    }

    $lt(values: any, ref: any) {
        return !this.null(values) && values < ref;
    }

    $lte(values: any, ref: any) {
        return !this.null(values) && values <= ref;
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

    $between(values: any, ref: any) {
        return this.match(values, { $gt: ref[ 0 ], $lt: ref[ 1 ] });
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
            return this.null(value);
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
            // tslint:disable-next-line:triple-equals
            return value == constraint;
        }
    }

    $neq(values: any, constraint: any) {
        return !this.match(values, constraint);
    }

    $deepEquals(value: any, constraint: any) {
        if (typeof _ === 'undefined' || typeof _.isEqual === 'undefined') {
            return JSON.stringify(value) === JSON.stringify(constraint);
        } else {
            return _.isEqual(value, constraint);
        }
    }

    $exists(value: any, constraint: any) {
        return (value !== undefined) === (constraint && true);
    }

    $reg(values: any, constraint: RegExp) {
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

    $before(values: any, ref: any) {
        return this.$lte(CompareOperatorHandler.resolveDate(values), CompareOperatorHandler.resolveDate(ref));
    }

    $after(values: any, ref: any) {
        return this.$gte(CompareOperatorHandler.resolveDate(values), CompareOperatorHandler.resolveDate(ref));
    }

    $contains(values: any[], constraint: any) {
        if (values && !Array.isArray(values)) {
            throw new Error('$contains requires an array operand');
        }

        return (values || []).indexOf(constraint) >= 0;
    }

    $all(values: any, constraint: any) {
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

    $any(values: any, constraint: any) {
        if (!Array.isArray(constraint)) {
            throw new Error('$any operator needs array of constraint objects');
        }

        for (let c of constraint) {
            if (this.match(values, c)) {
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

    $elemMatch(values: any, constraint: any) {
        for (let v of (values || [])) {
            if (this.logicHandler.match(v, constraint)) {
                return true;
            }
        }

        return false;
    }

    $cb(value: any, constraint: Function) {
        return constraint(value);
    }

    $not(values: any, constraint: any) {
        return !this.match(values, constraint);
    }

    $or(values: any, constraint: any) {
        return this.logicHandler.$or.call(this, values, constraint);
    }

    $nor(values: any, constraint: any) {
        return !this.$or(values, constraint);
    }

    $and(values: any, constraint: any) {
        return this.logicHandler.$and.call(this, values, constraint);
    }

    private null(values: any) {
        if (isEmpty(values)) {
            return true;
        } else if (Array.isArray(values)) {
            for (let v of values) {
                if (!this.null(v)) {
                    return false;
                }
            }

            return true;
        } else {
            return false;
        }
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
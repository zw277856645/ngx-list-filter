import { Inject, Injectable, Optional } from '@angular/core';
import { ListFilterConfig } from './list-filter-config';
import { LIST_FILTER_CONFIG } from './list-filter.pipe';
import { isEmpty, isEmptyString, isNullOrUndefined, isObject } from './util';

@Injectable()
export class CompareOperatorHandler {

    nullOrUndefinedExclude = true;
    emptyStringExclude = true;
    emptyArrayExclude = true;

    constructor(@Optional() @Inject(LIST_FILTER_CONFIG) config: ListFilterConfig) {
        Object.assign(this, config);
    }

    match(value: any, constraint: any, parentKey: string) {
        if (constraint === value) {
            return true;
        } else if (constraint instanceof RegExp) {
            return this.$regex(value, constraint);
        } else if (Array.isArray(constraint)) {
            return this.$in(value, constraint);
        } else if (isObject(constraint)) {
            if (constraint instanceof Date) {
                return this.$eq(value, constraint.getTime());
            } else {
                if (constraint.$regex) {
                    if (constraint.$regex instanceof RegExp) {
                        return this.$regex(value, constraint.$regex);
                    } else {
                        return this.$regex(value, new RegExp(constraint.$regex, constraint.$options || 'i'));
                    }
                }

                for (let key in constraint) {
                    if (!this[ key ]) {
                        return this.$eq(value, constraint);
                    } else if (!this[ key ](value, constraint[ key ], parentKey)) {
                        return false;
                    }
                }

                return true;
            }
        } else if (Array.isArray(value)) {
            for (var i = 0; i < value.length; i++) {
                if (this.$eq(value[ i ], constraint)) {
                    return true;
                }
            }
            return false;
        } else if (isEmpty(constraint)) {
            return this.emptyByConfig(value);
        } else {
            return this.$eq(value, constraint);
        }
    }

    $cb(value, constraint, parentKey) {
        return constraint(value);
    }

    $eq(value: any, constraint: any) {
        //if (isNullOrUndefined(value)) {
        //    return !this.nullOrUndefinedExclude;
        //} else if (isEmptyString(value)) {
        //    return !this.emptyStringExclude;
        //} else

        if (constraint === value) {
            return true;
        } else if (Array.isArray(value)) {
            for (let v of value) {
                if (this.$eq(v, constraint)) {
                    return true;
                }
            }

            return false;
        } else if (isEmpty(constraint) || isEmpty(value)) {
            return this.emptyByConfig(value);
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

    $exists(value, constraint, parentKey) {
        return (value != undefined) == (constraint && true);
    }

    $deepEquals(value, constraint) {
        if (typeof _ == 'undefined' || typeof _.isEqual == 'undefined') {
            return JSON.stringify(value) == JSON.stringify(constraint); //
        } else {
            return _.isEqual(value, constraint);
        }
    }

    $not(values, constraint) {
        return !this._satisfies(values, constraint);

    }

    $ne(values, constraint) {
        return !this._satisfies(values, constraint);
    }

    $nor(values, constraint, parentKey) {
        return !this.$or(values, constraint, parentKey);
    }

    $and(values, constraint, parentKey) {

        if (!Array.isArray(constraint)) {
            throw new Error('Logic $and takes array of constraint objects');
        }
        for (var i = 0; i < constraint.length; i++) {
            var res = this._satisfies(values, constraint[ i ], parentKey);
            if (!res) {
                return false;
            }
        }
        return true;
    }

    $or(values, constraint, parentKey) {

        if (!Array.isArray(values)) {
            values = [ values ];
        }

        for (var v = 0; v < values.length; v++) {
            for (var i = 0; i < constraint.length; i++) {
                if (this._satisfies(values[ v ], constraint[ i ], parentKey)) {
                    return true;
                }
            }
        }

        return false;
    }

    $in(values, constraint) {
        if (!Array.isArray(constraint)) {
            throw new Error('$in requires an array operand');
        }
        var result = false;
        if (!Array.isArray(values)) {
            values = [ values ];
        }
        for (var v = 0; v < values.length; v++) {
            var val = values[ v ];
            for (var i = 0; i < constraint.length; i++) {
                if (constraint.indexOf(val) >= 0 || this._satisfies(val, constraint[ i ])) {
                    result = true;
                    break;
                }
            }
        }

        return result;
    }

    $likeI(values, constraint) {
        return values.toLowerCase().indexOf(constraint) >= 0;
    }

    $like(values, constraint) {
        return values.indexOf(constraint) >= 0;
    }

    $startsWith(values, constraint) {
        if (!values) {
            return false;
        }
        return values.startsWith(constraint);
    }

    $endsWith(values, constraint) {
        if (!values) {
            return false;
        }
        return values.endsWith(constraint);
    }

    $elemMatch(values, constraint, parentKey) {
        for (var i = 0; i < values.length; i++) {
            if (Query.lhs._rowsatisfies(values[ i ], constraint)) {
                return true;
            }
        }
        return false;
    }

    $contains(values, constraint) {
        return values.indexOf(constraint) >= 0;
    }

    $nin(values, constraint) {
        return !this.$in(values, constraint);
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

    $gte(values, ref) {
        return !this.$null(values) && values >= this.resolve(ref);
    }

    $gt(values, ref) {
        return !this.$null(values) && values > this.resolve(ref);
    }

    $lt(values, ref) {
        return !this.$null(values) && values < this.resolve(ref);
    }

    $lte(values, ref) {
        return !this.$null(values) && values <= this.resolve(ref);
    }

    $before(values, ref) {
        if (typeof ref === 'string') {
            ref = Date.parse(ref);
        }
        if (typeof values === 'string') {
            values = Date.parse(values);
        }
        return this.$lte(values, ref);
    }

    $after(values, ref) {
        if (typeof ref === 'string') {
            ref = Date.parse(ref);
        }
        if (typeof values === 'string') {
            values = Date.parse(values);
        }

        return this.$gte(values, ref);
    }

    $type(values, ref) {
        return typeof values == ref;
    }

    $all(values, ref) {
        throw new Error('$all not implemented');
    }

    $size(values, ref) {
        return (typeof values == 'object' && (values.length == ref || Object.keys(values).length == ref));
    }

    $mod(values, ref) {
        return values % ref[ 0 ] == ref[ 1 ];
    }

    $between(values, ref) {
        return this._satisfies(values, { $gt: ref[ 0 ], $lt: ref[ 1 ] });
    }

    resolve(ref) {
        if (typeof ref === 'object') {
            if (ref[ '$date' ]) {
                return Date.parse(ref[ '$date' ]);
            }
        }
        return ref;
    }

    private emptyByConfig(value: any) {
        if (isNullOrUndefined(value)) {
            return !this.nullOrUndefinedExclude;
        } else if (isEmptyString(value)) {
            return !this.emptyStringExclude;
        } else if (Array.isArray(value)) {
            if (!value.length) {
                return !this.emptyArrayExclude;
            } else {
                for (let v of value) {
                    if (!this.emptyByConfig(v)) {
                        return false;
                    }
                }

                return !this.emptyArrayExclude;
            }
        }

        return true;
    }
}
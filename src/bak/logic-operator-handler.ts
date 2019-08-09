import { Injectable } from '@angular/core';
import { objectify, ValueGetter } from './util';
import { CompareOperatorHandler } from './compare-operator-handler';

@Injectable()
export class LogicOperatorHandler {

    constructor(private compareHandler: CompareOperatorHandler) {
    }

    match(row: any[], constraints: any, getter: ValueGetter) {
        for (let key in constraints) {
            if (constraints.hasOwnProperty(key)) {
                if (this[ key ]) {
                    if (!this[ key ](row, constraints[ key ], getter)) {
                        return false;
                    }
                } else {
                    let val = getter(row, key);
                    let res = this.compareHandler.match(val, constraints[ key ], key);

                    if (!res) {
                        return false;
                    }
                }
            }
        }

        return true;
    }

    $not(row: any[], constraint: any, getter: ValueGetter) {
        return !this.match(row, constraint, getter);
    }

    $or(row: any[], constraint: any, getter: ValueGetter) {
        if (!Array.isArray(constraint)) {
            constraint = objectify(constraint);
        }

        for (let i = 0; i < constraint.length; i++) {
            if (this.match(row, constraint[ i ], getter)) {
                return true;
            }
        }

        return false;
    }

    $nor(row: any[], constraint: any, getter: ValueGetter) {
        return !this.$or(row, constraint, getter);
    }

    $and(row: any[], constraint: any, getter: ValueGetter) {
        if (!Array.isArray(constraint)) {
            constraint = objectify(constraint);
        }

        for (let i = 0; i < constraint.length; i++) {
            if (!this.match(row, constraint[ i ], getter)) {
                return false;
            }
        }

        return true;
    }
}
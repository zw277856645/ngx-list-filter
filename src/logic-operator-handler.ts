import { objectify, ValueGetter } from './util';
import { CompareOperatorHandler } from './compare-operator-handler';

export class LogicOperatorHandler {

    private compareHandler = new CompareOperatorHandler(this);

    constructor(private valueGetter: ValueGetter) {
    }

    match(row: any[], constraints: any) {
        for (let key in constraints) {
            if (constraints.hasOwnProperty(key)) {
                if (this[ key ]) {
                    if (!this[ key ](row, constraints[ key ])) {
                        return false;
                    }
                } else {
                    let val = this.valueGetter(row, key);
                    let res = this.compareHandler.match(val, constraints[ key ]);

                    if (!res) {
                        return false;
                    }
                }
            }
        }

        return true;
    }

    $not(row: any[], constraint: any) {
        return !this.match(row, constraint);
    }

    $or(row: any[], constraint: any) {
        if (!Array.isArray(constraint)) {
            constraint = objectify(constraint);
        }

        for (let c of constraint) {
            if (this.match(row, c)) {
                return true;
            }
        }

        return false;
    }

    $nor(row: any[], constraint: any) {
        return !this.$or(row, constraint);
    }

    $and(row: any[], constraint: any) {
        if (!Array.isArray(constraint)) {
            constraint = objectify(constraint);
        }

        for (let c of constraint) {
            if (!this.match(row, c)) {
                return false;
            }
        }

        return true;
    }
}
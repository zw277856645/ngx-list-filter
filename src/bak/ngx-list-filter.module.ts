import { NgModule } from '@angular/core';
import { ListFilterPipe } from './list-filter.pipe';
import { LogicOperatorHandler } from './logic-operator-handler';
import { CompareOperatorHandler } from './compare-operator-handler';

@NgModule({
    declarations: [
        ListFilterPipe
    ],
    exports: [
        ListFilterPipe
    ],
    providers: [
        LogicOperatorHandler,
        CompareOperatorHandler
    ]
})
export class NgxListFilterModule {
}
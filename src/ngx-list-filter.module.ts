import { NgModule } from '@angular/core';
import { ListFilterPipe } from './list-filter.pipe';

@NgModule({
    declarations: [
        ListFilterPipe
    ],
    exports: [
        ListFilterPipe
    ]
})
export class NgxListFilterModule {
}
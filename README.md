# angular 列表过滤管道
类似 mongodb 查询语法，使用示例如下
``` html
<ng-container *ngFor="let rec of list | listFilter:queryObject"></ng-container>
```

## ✨ 插件特性
- 全局参数配置
- 支持异步流 Promise/Observable/EventEmitter，并增加 debounceTime
- 与($and)，或($or)，非或($nor)，非($not)
- <($lt)，<=($lte)，>($gt)，>=($gte)
- 在指定范围之内($in)，不在指定范围之内($nin)
- 范围($between)
- 相等比较($eq)
- 不相等($neq)
- 深度相等比较($deepEquals)
- 属性值不为undefined($exists)
- 正则($reg)
- 日期在之前($before)
- 日期在之后($after)
- 数组包含某值($contains)
- 数组包含全部($all)
- 数组包含任意($any)
- 数组长度或对象属性个数值($size)
- 取模($mod)
- 嵌入对象匹配，使用点记法(a.b.c)
- 数组内对象匹配($elemMatch)
- 自定义判断逻辑($cb)

## 📦 安装
> npm install ngx-list-filter --save

## 🔨 使用
#### 引入module
``` js
import { NgxListFilterModule } from 'ngx-list-filter';

@NgModule({
    imports: [
        NgxListFilterModule
    ]
})
export class AppModule {
}
```

## 🎨 API

#### 1. 全局参数配置
可在 module 中配置全局参数，使用示例如下
``` js
@NgModule({
    ...
    providers: [
        ...
        {
            provide: LIST_FILTER_CONFIG,
            useValue: {
                debounceTime: 300,
                regFlags: 'gmi',
                valueGetter: (obj: any, key: string) => obj[key]
            }
        }
    ]
})
export class XxxModule {
}
```

##### debounceTime
异步流抖动时间(ms)，默认值`400`

##### regFlags
正则匹配标志，默认值`i`

##### valueGetter
取值器，根据该方法获取 key 对应的 value。默认支持点记法(a.b.c)

#### 2. 支持异步流（Promise/Observable/EventEmitter）
可减少触发查询的次数，节省性能，使用示例如下
``` html
<input type="text" [(ngModel)]="xxx" #ctrl="ngModel">

<ng-container *ngFor="let rec of list | listFilter:{name:ctrl.valueChanges}"></ng-container>
```

#### 3. $and、$or、$nor、$not

##### a）最外层(尚没有具体属性)逻辑连接
``` html
<!--
下面三种方式等效

注意:
1. $and 可省略，默认没有操作符连接的情况就是 $and
2. 多个查询属性之间的逻辑连接可用对象 {prop1:..., prop2:..., ...}，也可用数组 [{prop1:...}, {prop2:...}, ...]
-->
<ng-container *ngFor="let rec of list | listFilter:{age:{$lt:30}, name:{$reg:'xxx'}}"></ng-container>
<ng-container *ngFor="let rec of list | listFilter:{$and:{age:{$lt:30}, name:{$reg:'xxx'}}}"></ng-container>
<ng-container *ngFor="let rec of list | listFilter:{$and:[{age:{$lt:30}}, {name:{$reg:'xxx'}}]}"></ng-container>
```

##### b）某具体属性下的逻辑连接
``` html
<!--
下面三种方式等效

注意:
1. $and 可省略，默认没有操作符连接的情况就是 $and
2. 多个过滤条件之间的逻辑连接可用对象 {query1:..., query2:..., ...}，也可用数组 [{query1:...}, {query2:...}, ...]
-->
<ng-container *ngFor="let rec of list | listFilter:{age:{$gt:30, $lt:80}}"></ng-container>
<ng-container *ngFor="let rec of list | listFilter:{age:{$and:{{$gt:30}, {$lt:80}}}"></ng-container>
<ng-container *ngFor="let rec of list | listFilter:{age:{$and:[{$gt:30}, {$lt:80}]}}"></ng-container>
```

#### $lt、$lte、$gt、$gte
``` html
<ng-container *ngFor="let rec of list | listFilter:{age:{$gte:30, $lte:80}}"></ng-container>
```

#### $in、$nin

##### a）指定值在指定范围之内
``` html
<!-- age 是原始类型 -->
<ng-container *ngFor="let rec of list | listFilter:{age:{$in:[28, 30, 60]}}"></ng-container>
```

##### b）指定数组包含指定范围内的值
``` html
<!-- likes 是数组类型，注意只要数组包含任意一个筛选值即可，与 $any 操作符同效 -->
<ng-container *ngFor="let rec of list | listFilter:{likes:{$in:['apple', 'banana']}}"></ng-container>
```

#### $between
``` html
<ng-container *ngFor="let rec of list | listFilter:{age:{$between:[20, 40]}}"></ng-container>
```

#### $eq、$neq
``` html
<!--
下面两种方式等效

注意:
1. $eq 可省略，默认没有操作符的情况就是 $eq
2. 采用的是相等比较(==)，类型不同时会自动转换，比如字符串和数字比较时会先转化为字符串。字符串如果需要部分匹配，请使用正则操作符 $reg
-->
<ng-container *ngFor="let rec of list | listFilter:{name:'xxx'}"></ng-container>
<ng-container *ngFor="let rec of list | listFilter:{name:{$eq:'xxx'}}"></ng-container>
```

$eq 也可用于数组，但是只能使用一个原始类型的值，数组类型无效，功能等效于操作符 $contains

``` html
<!-- 下面三种方式等效，推荐使用 $contains，使语义更明确 -->
<ng-container *ngFor="let rec of list | listFilter:{likes:'apple'}"></ng-container>
<ng-container *ngFor="let rec of list | listFilter:{likes:{$eq:'apple'}}"></ng-container>
<ng-container *ngFor="let rec of list | listFilter:{likes:{$contains:'apple'}}"></ng-container>

<!-- 此使用方式无效，请使用数组相关的操作符 -->
<ng-container *ngFor="let rec of list | listFilter:{likes:{$eq:['apple', 'banana']}}"></ng-container>
```

#### $deepEquals
深度比较对象，如果系统已加载了`lodash`或`underscore`库，将使用它们的`isEqual`方法，否则简单使用`JSON.stringify`比较序列化后的字符串是否相等



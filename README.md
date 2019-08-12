# angular 列表过滤器
类似 mongodb 查询语法

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

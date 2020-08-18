# 谈谈计算属性的实现方案

## 前言

使用过vue的读者应该知道这两个计算属性：`computed`、`watch`。不了解的读者也没关系，我举个例子就明白了。

很多时候，我们会存在一个数据依赖另一个数据变化而变化的情况。比如：name = firstName + lastName。我们只定义了firstName和lastName，而name通过前者计算得出。当其中任意数据发生变化，name都是会跟随着变化的。

从上面的例子也可以看出，计算属性是非常好用的特性，而小程序却没有实现这个特性。因此，本文将探讨一下在小程序上实现计算属性的方案。

## 差异

在讲具体方案之前，先讲一下小程序与vue在数据声明上的差异：

### 数据初始化

小程序不需要将所有的数据都在data中声明，在`wxml`中如果遇到没声明好的数据，就是默认的undefined。而vue则需要在data函数里提前声明所有的数据。

### 触发渲染

之所以会有这样的数据初始化差异，是因为vue是真正的响应式框架。当我们给任意声明的data赋值时，都会触发页面渲染。而小程序则需要手动调用`setData`函数才会触发页面渲染。

### data类型

vue要求data必须是函数，并直接返回一个对象，而小程序的data则是一个简单的对象。

> 小程序比较像是react和vue的结合体，可以在小程序上很多地方看到两个框架的影子。

## 代码用例

后文均以该代码为基础举例：

```js
Page({
    data: {
        firstName: 'Lebron',
        lastName: 'James'
    },
    computed: {
        name() {
            return this.data.firstName + this.data.lastName;
        }
    },
})
```

## 响应式对象

众所周知，vue的响应式机制是依靠ES5的以下新特性实现的：

```js
Object.defineProperty(obj, prop, descriptor)
```

通过这个特性，可以监听到对象属性值的读取、赋值操作。因此在vue的初始化阶段，会使用`Object.definedProperty`将data的每个属性变成响应式对象：

```js
Object.defineProperty(this, 'firstName', {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter() {
        // 监听读取
    },
    set: function reactiveSetter() {
        // 监听赋值
    }
})
```

因此，所有没在data里声明的数据，都不能成为响应式的数据。

当计算属性依赖不是响应式数据时，由于无法监听到数据发生变化，就会导致数据计算错误。

所以，若要实现计算属性，需要加以限制：**全部数据最要都在data预先声明。**

## 依赖收集

以前面的代码为例，`name`是依赖`firstName`和`lastName`的。因此需要提供一种机制来收集两者之间的依赖关系，大致思路如下：
- 将`computed.name`这个函数设置成`this.data.name`的`getter`函数
- 因此读取`name`的值时，就会触发`firstName`和`lastName`的`getter`函数
- 所以在`getter`函数里设置相关的依赖收集函数即可

## 派发更新

导致更新的原因只有一个，就是有数据的值发生变更。因此派发更新的机制是利用`setter`函数来实现的。

## 最终方案

。。。持续更新
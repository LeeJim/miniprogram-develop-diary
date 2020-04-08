# 组件封装的思考

## 前言

在小程序开发的早期，是没有 **自定义组件(component)**，仅有 **自定义模板(template)** 的。最早接触到组件开发还是在使用 `React`、`Vue` 框架的时候，熟悉以上两个框架的读者，对小程序的组件应该会有熟悉的感觉，机制和写法差不多

## 为什么要有组件？

对于这个问题，很多人的第一反应也许是：代码复用

的确，代码复用是组件的核心职责，但它还有更大的使命：性能

因为通过组件封装，可以将页面拆分成多个组件，因此较大粒度的页面就被拆分成粒度较小的组件。当一些数据发生变更导致页面变化时，就只需要重新渲染包含该数据的组件即可，而不用渲染整个页面，从而达到了提高渲染性能的效果

![](images/components/components-graph.png)

## 生命周期

在 `Vue` 中，每个页面是一个 `Vue` 实例，而组件又是可复用的 `Vue` 实例，因此可以理解成，页面和组件是相同的生命周期

而小程序就将页面和组件拆分成两个类：`Page` 和 `Component`，因此接收的生命周期函数也是不一样的。比如，`Page` 接收的是：`onLoad`、`onShow`、`onReady`等函数，而 `Component` 则接收 `created`、`attached`、`ready` 等函数

> 命名风格都不一致，真是让人头大

![](images/components/miniprogram-lifecycle.png)

## 数据传递

### Vue

`Vue` 的组件间数据传递的机制是这样的：父组件通过`property`传递数据给子组件，而子组件通过事件通知的形式传递数据给父组件

在页面包含的组件结构还比较简单的时候，这样的机制还是比较好用的。但是，随着业务的复杂度逐渐上升，组件嵌套的层数递增，会出现数据层层传递的困境

为了解决这个问题，`Vue` 推出了 `Vuex` 这样的状态管理工具，集中式存储、管理应用的所有组件的状态。并提出了“单向数据流”的理念：

![](images/components/vuex.png)

### 小程序

小程序同样有类似的机制，`property`和事件。此外还提供了获取 **子组件实例** 的方法：`selectComponent()` 和  定义组件间关系的字段 `relations`

其中常用的就是获取子组件实例，比如:

```html
<parent-component>
    <child-component id="child"></child-component>
</parent-component>
```

此时，在`parent-component`组件中可以直接获取`child-component`的实例：

```js
Component({
    attached() {
        let $child = this.selectComponent('#child')

        // $child.doSomeThing()
    }
})
```

## 实战

### 背景

> 制作一个 **对话框(modal)** 组件

也许有的读者会感到困惑，官方不是有提供`wx.showModal`API可以直接用吗，为什么要重复造轮子

其实，当你的产品想要结合`Modal`和`Button`的`open-type`能力时，你就会明白重复造轮子的必要性以及`wx.showModal`的局限性。

### 属性定义

对话框的常见属性可以参考`wx.showModal`

除此以外，其中关键的一个属性就是 表示对话框当前的显示状态：`visible`

此时，有两种选择，第一种是将这个变量存在页面上，通过`property`传递给`Modal`组件；另外一种，就是作为`Modal`组件`data`中的一员

# 小程序框架设计

## 前言

其实说是框架设计，有点“夸大其词”。

实际上是，将在开发当中遇到的问题，统一抽象，通过全局封装的方式解决。而这样封装处理，就称为了我所称的“框架”。

## 封装Page

对小程序的`Page`进行封装，是一个框架的基础，也是解决许多通用问题的利刃。

如每个页面都需要设置分享`onShareAppMessage`，而分享信息大概率是一致的，那么应该如果有效地处理呢？我想到的最佳实践就是封装`Page`。

一种方案是，通过`Page`来定义一个新的`Page`，如：`JPage`，然后每个页面不再使用`Page`注册页面，而是使用`JPage`。

还有一种更好的方案，也是我所采取的方案：**劫持Page**。以至于不用改变每个页面的注册方式：

```js
// app.js

let realPage = Page
Page = function Page(obj) {
    let defaultPageConfig = {
        onShareAppMessage() {
            return {
                title: '这里有很多有趣的壁纸',
                path: `/pages/index/index`,
                imageUrl: 'http://resoure.africans.cn/1.jpg',
            }
        }
    }
    return realPage({ ...defaultPageConfig, ...obj })
}
```

这样封装，我们后续可以做很多优化，如抽象通用的方法，举个例子：

如果使用过 **云开发** 的读者，应该知道 **获取集合** 的步骤是这样的：

```js
let db = wx.cloud.database()
let table = db.collection('wallpapers')
```

可以将这个 获取集合 的方法抽象成这样:

```js
let getTable = (tableName) => {
    let db = wx.cloud.database()
    return db.collection(tableName)
}
```

将这个方法放在`defaultPageConfig`里，以后每个页面都可以这样获取集合：

```js
this.getTable('wallpapers')
```

## 环境

每个小程序都有三种版本：开发版、体验版、正式版。

往往我们会有这样的需要，如不同环境请求不同的服务器。那我们要如何区分这些环境呢？

微信官网提供了 [wx.getAccountInfoSync](https://developers.weixin.qq.com/miniprogram/dev/api/open-api/account-info/wx.getAccountInfoSync.html)，为了避免在`Page`对象里冗余太多信息，因此`env`添加至`App`：

```js
App({
    env: (function() {
        let { miniProgram } = wx.getAccountInfoSync()
        return miniProgram.envVersion
    }())
})
```

> 需要注意的是，该API仅支持基础库2.2.2以上版本，以下版本目前没有解决方案


后续可以这样使用：

```js
let app = getApp()
console.log(app.env) // develop
```
## 设备信息

由于每个用户进入小程序之后，设备信息不可能发生变更。

但在每个`Page`都封装这个信息会有点冗余，因此可以放进`App`里：

```js
App({
    getSystemInfo() {
        let info = wx.getSystemInfoSync()

        this.getSystemInfo = () => info
        return info
    }
})
```

> 采用了缓存的机制，第一次调用时，调用`getSystemInfoSync`获取，第二次就直接返回缓存的设备信息了
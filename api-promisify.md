# API Promise化

## 前言

众所周知，前端一大坑就是回调函数。

相信很多人是从`async/await`的温柔乡，掉到小程序重新写回调的大坑里的。

由于开发者工具新增了 [增强编译](https://developers.weixin.qq.com/miniprogram/dev/devtools/codecompile.html) 从而原生支持了`async\await`，避免了我们仍需通过webpack等第三方打包工具实现。因此我们需要做的就是将官方API的 **异步调用** 方式改成 **Promise的方式** 即可。

## 分析

大致上可以有两种思路，第一种就是，逐个函数封装：

```js
let promisify = (func) => {
    return args => new Promise((resolve, reject) => {
        func(Object.assign(args, {
            success: resolve,
            fail: reject
        }))
    })
}

let _login = promisify(wx.login) // 将wx.login转成Promise形式的方法

_login().then(res => console.log)
```

这种方式比较麻烦，每次调用都需要手动转换。

第二种就类似`Page`封装那样，劫持`wx`对象，进行全局统一封装：

劫持`wx`对象之前，需要分析清楚哪些是函数，哪些函数是异步而不是同步的，大致可以如下处理：

- 同步方法是以`Sync`结尾的
- 通过`typeof`判断是否为函数

> 由于劫持wx是一个很危险的动作，并且以上判断方式并不是准确的。因此如果你想在生产上使用，请谨慎。

## 实践

由于前文已封装好`promisify`，那么剩余的工作就是将`wx`内所有的异步函数逐个调用`promisify`转换即可：

```js
// promisify.js

let originalWX = wx
let props = Object.keys(wx)

for (let name of props) {
    let fn = props[name]

    if (typeof fn === 'function' && !name.endsWith('Sync')) {
        wx[name] = promisify(wx[name])
    }
}
```

由于这种方式比较粗暴，会存在误判的情况，因此建议不劫持`wx`对象，而是通过`wx`对象生成一个全新的`jwx`挂载到全局对象`global`上：

```js
let props = Object.keys(wx)
let jwx = {}

for (let name of props) {
    let fn = props[name]

    if (typeof fn === 'function' && !name.endsWith('Sync')) {
        jwx[name] = promisify(wx[name])
    }
}

global.jwx = jwx
```

> 另外需要注意的是，开发者工具记得打开 **增强编译**

## 后续

由于发现了微信官方也提供了一个 [API Promise化](https://developers.weixin.qq.com/miniprogram/dev/extended/utils/api-promise.html) 的工具类库，因此增加了本章节。

通过阅读源代码，发现官方的工具类库提供两个方法：`promisify` 和 `promisifyAll`

其中`promisify`与前文的同名方法是几乎一致的。而`promisifyAll`则是接收两个参数，第一个是被封装的对象，第二个则是封装之后的对象，如下使用将和前文我提到的封装方式类似：

```js
import { promisifyAll } from 'miniprogram-api-promise';

promisifyAll(wx, jwx)
```

> 另外还有一点需要提到的是，官方这个工具类库，判断是否为异步函数的方式是枚举。会存在遗漏新API的可能。
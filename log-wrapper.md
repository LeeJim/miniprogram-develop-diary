# 日志的巧妙封装

## 前言

日常开发中，通过`console.log`打印日志，是常用的debug方式。

但，当小程序上线之后，用户通过`console.log`打印的日志，我们是无法获取的，因此这样的方式只适合调试阶段使用。本章节将通过一种巧妙的封装，让我们可以远程获取用户的控制台输出。

## 数据上报

想要实现远程获取用户的控制台输出，需要做的是数据上报。

但如果要自己实现一个后端服务，这就不太合理了。熟悉小程序开发的读者，应该知道存在这个接口：[wx.reportMonitor(数据上报)](https://developers.weixin.qq.com/miniprogram/dev/api/open-api/report/wx.reportMonitor.html)。

但使用过的人就知道，这个接口并不是设计来上报日志信息的，而是上报运营数据的。

## 实时日志

常关注小程序更新动态的可能才会这个新特性，我也是无意间发现的。

从基础库2.7.1开始支持的新特性，符合我们的需要。

通过 [wx.getRealtimeLogManager()](https://developers.weixin.qq.com/miniprogram/dev/framework/realtimelog/) 生成一个`log`对象，和我们的`console`有点类似，支持`info()`、`warn()`、`error()`。由于需要考虑兼容性，因此官方的示例是这样的：

```js
var log = wx.getRealtimeLogManager ? wx.getRealtimeLogManager() : null

module.exports = {
  info() {
    if (!log) return
    log.info.apply(log, arguments)
  },
  warn() {
    if (!log) return
    log.warn.apply(log, arguments)
  },
  error() {
    if (!log) return
    log.error.apply(log, arguments)
  }
}
```

## 实践

经过我多年的开发经验总结得出：在开发阶段，允许控制台的输出是为了方便开发者debug；而上线之后是需要避免控制台输出的，以防泄露代码信息。

因此我们可以进行如下封装：

```js
// log.js

let { miniProgram } = wx.getAccountInfoSync()
let env = miniProgram.envVersion
let log = wx.getRealtimeLogManager ? wx.getRealtimeLogManager() : null

if (env === 'develop' && log) {
    console.log = function() {
        log.info.apply(log, arguments)
    }

    console.info = function() {
        log.info.apply(log, arguments)
    }

    console.warn = function() {
        log.warn.apply(log, arguments)
    }

    console.error = function() {
        log.error.apply(log, arguments)
    }
}
```

## 总结

通过以上封装，既可以保证开发阶段的调试，又可以避免在线上环境仍然在控制台输出敏感信息。

另外还可以帮助开发者快捷地排查问题，定位问题。
# 挖掘数据

## 前言

当决定要爬取一个网站的数据时，需要先研究下网站的实现机制，也可以在网上搜索一下，会有许多爬虫的心得分享。

## 技术方案

由于我习惯于使用`JavaScript`，因此它是本次开发的主力语言。

由于知乎做了反爬虫机制，因此不能简单地发送`request`然后解析`HTML`从而完成数据的采集。

我采用的方案是，使用`Headless Browser(无头浏览器)`，模拟用户操作，从而采集相关的数据。

而`Headless Browser`中，最著名的就是`Headless Chrome`，最重要的是，这个团队还发行了`Node.js`版本：[Puppeteer](https://www.npmjs.com/package/puppeteer)，这也是我最终采用的工具。

![](https://user-images.githubusercontent.com/10379601/29446482-04f7036a-841f-11e7-9872-91d1fc2ea683.png)

## 登录检验

由于知乎在登录校验这里，增加了常见的图形验证码等方案，因此这块将会消耗太多时间。所以我的解决方案是，手动通过浏览器登录知乎，然后将`cookie`复制出来，在`puppeteer`复用即可。

> 由于知乎的登录态维持较长，因此这个方案也还可以接受

后续有时间，将回过头来完善这部分内容。

## 实践

### 安装

```bash
npm i puppeteer -S
```

> 由于GreatWall的原因，你会发现这样，是无法下载的。

尝试过很多种方式，比如手动安装`puppeteer`依赖的`Chromium`，结果手动下载也不行。

比如使用淘宝的`cnpm`，的确可以下载成功，但是启动的时候发现会有报错，这就又踏出了另外一个坑了。

最后找到了一个完美方案：仅设置`puppeteer`的下载镜像，仍然使用`npm`下载。

```bash
npm config set puppeteer_download_host=https://npm.taobao.org/mirrors
```

## 启动

```js
const puppeteer = require('puppeteer');
 
(async () => {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  await page.goto('https://zhihu.com')
  await page.screenshot({path: 'example.png'}) // 截图
 
  await browser.close()
})()
```

由于是`headless`，因此你无法知道自己是否进入了正确的页面。

通过截图来查看，是一个比较简单而有效的方式。

### 复用cookie

由于从浏览器复制出来的`cookie`是字符串类型，而`puppeteer`需要的是对象类型。

```js
let cookieStr = '' // 这里是从知乎上复制过来的cookie

let cookies = cookieStr.split(';').map(pair => {
    item = item.trim()
    let idx = item.indexOf('=')
    let name = item.slice(0, idx)
    let value = item.slice(idx + 1)
    return { name, value, domain: 'www.zhihu.com' }
})
```

可以使用`page.setCookie`来设置`cookie`

```js
await page.setCookie(...cookies)
```

## 模拟用户操作

前文提到过，知乎的数据是异步加载的，需要滑动页面至底部才会加载，因此这里需要模拟滑动页面：

通过`page.evaluate`方法，可以在浏览器执行`js`，如向下滑动10px：

```js
await page.evaluate(() => {
    window.scrollTo(0, 10)
})
```

为了模拟得更像一个人的操作，所以是滑动之间，等待几十毫秒，大致如下：

```js
for (let i = 0; i < 3; i++) {
    await page.evaluate(i => {
        window.scrollTo(0, i * 30)
    }, i)
    await page.waitFor(50 + i * 10)
}
```

由于页面加载需要一定的时间，而无法得知具体的时间，因此可以使用`page.waitFor`，可以传入选择器，表示等待至该选择器出现。

## 总结

本文讲述了挖掘知乎数据中，遇到的问题以及解决方案。思路和做法都是比较直观的，如果有什么错误的地方，欢迎指正。

完整代码可以查看code目录下的`fetch-data.js`。
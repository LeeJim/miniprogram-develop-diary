const puppeteer = require('puppeteer')
let fs = require('fs')

(async () => {
    const browser = await puppeteer.launch()
    const page = await browser.newPage()

    let baseUrl = 'https://www.zhihu.com'
    let cookieStr = ''

    let cookies = cookieStr.split(';').map(pair => {
        item = item.trim()
        let idx = item.indexOf('=')
        let name = item.slice(0, idx)
        let value = item.slice(idx + 1)
        return { name, value, domain: 'www.zhihu.com' }
    })

    await page.setCookie(...cookies)
    await page.goto(baseUrl + '/search?q=%E5%A3%81%E7%BA%B8&type=topic', { waitUntil: 'networkidle2' })

    await page.waitFor('div.SearchResult-Card')

    for (let i = 0; i < 3; i++) {
        await page.evaluate(i => {
            window.scrollTo(0, i * 30)
        }, i)
        await page.waitFor(50 + i * 10)
    }
    await page.screenshot({ path: 'screenshot.png' })

    // 收集topic数据
    let topic = await page.evaluate(() => {
        let res = []
        let ds = document.querySelectorAll('.SearchResult-Card')
        for (let item of ds) {
            let topicLink = item.querySelector('.TopicLink').href
            let id = topicLink.slice(topicLink.lastIndexOf('/') + 1)
            let title = item.querySelector('.Highlight').textContent
            let desc = item.querySelector('.SearchItem-meta').textContent
            let [focus, question, top] = Array.from(item.querySelectorAll('.Search-statusLink')).map(item => ({
                link: item.href,
                text: item.textContent
            }))

            res.push({ id, title, desc, focus, question, top })
        }
        return res
    })

    console.log(topic[0])

    fs.writeFileSync('./topic.json', JSON.stringify(topic))

    // 进入精华内容
    let top = {}
    for (let t of topic) {
        await page.waitFor(500)
        await page.goto(t.top.link, { waitUntil: 'networkidle2' })
        await page.waitFor('div.AnswerItem')

        await page.screenshot({ path: `screenshot/topic-${t.id}.png` })
        let count = (await page.$$('.AnswerItem')).length
        let list = []
        console.log(count)


        while (count <= 100) {
            list = await page.evaluate(() => {
                window.scrollTo(0, document.body.scrollHeight - (500, Math.random() * 100))
                let list = document.querySelectorAll('.AnswerItem')
                if (list < 100) return list.length
                return Array.from(list).map(item => {
                    let zop = JSON.parse(item.dataset.zop)
                    let info = JSON.parse(item.dataset.zaExtraModule)
                    let author = {
                        name: zop.authorName || '',
                        avatar: item.querySelector('.AuthorInfo-avatar').src
                    }
                    return {
                        author,
                        id: info.card.content.token,
                        upvoteNum: info.card.content.upvote_num,
                        commentNum: info.card.content.comment_num
                    }
                })
            })
            count = typeof list === 'number' ? list : list.length
            await page.waitFor(100 + Math.random() * 200)
        }

        top[t.id] = list
    }

    fs.writeFileSync('./top.json', JSON.stringify(top))

    await browser.close()
})()

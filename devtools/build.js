const fs = require('fs-extra')
const path = require('path')
const cp = require('child_process')
const execSh = require('exec-sh').promise
const { createSitemap } = require('sitemaps')
const RSS = require('rss')

async function main() {
    process.chdir("..")
    const OUT = path.normalize("_out")

    if (!fs.existsSync(OUT)) {
        fs.mkdirSync(OUT)
    } else {
        const stats = fs.lstatSync(OUT)
        if (!stats.isDirectory()) {
            console.log(`${OUT} is not a directory, aborting`)
            process.exit(1)
        } else {
            const files = fs.readdirSync(OUT)
            for (const f of files) {
                if (!f.startsWith('.')) {
                    fs.removeSync(path.join(OUT, f), {force: true, recursive: true})
                }
            }
        }
    }

    await execSh('npx sass ./static/scss/styles.scss:./static/css/styles.css --style compressed')
    await execSh(
        `constexprjs --input=. --output=_out --entry /index.html --jobcount 12 --depfile devtools/deps.json --literal-tag style --literal-tag prog ${process.argv.slice(2).join(' ')} `,
        {},
    )
    const config = JSON.parse(fs.readFileSync('collections/config.json'))
    const deps = JSON.parse(fs.readFileSync('devtools/deps.json'))
    const posts = JSON.parse(fs.readFileSync('collections/posts.json'))
    createSitemap({
        filePath: '_out/sitemap.xml',
        urls: deps.allResults.map(
            res => {
                const path = res.output
                const parts = res.output.split('/')
                return {
                    loc: `${config.url}${path}`,
                    priority: 1 - (parts.length - 1) * 0.1
                }
            }
        )
    })
    const feed = new RSS({
        title: 'Sagar Tiwari\'s blog',
        feed_url: `${config.url}/rss.xml`,
        site_url: `${config.url}`,
        image_url: `${config.url}/favicon.ico`,
        pubDate: posts.map((p) => p.date).reduce((a, b) => a > b ? a : b),
    })
    for (let post of posts) {
        feed.item({
            title: post.title,
            description: post.description,
            url: `${config.url}${post.url}`,
            categories: post.tags,
            date: new Date(post.date),
        })
    }
    fs.writeFileSync('_out/rss.xml', feed.xml({indent: true}))
}

main()
    .then(() => process.exit(0))
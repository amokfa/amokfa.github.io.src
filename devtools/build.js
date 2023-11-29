const fs = require('fs-extra')
const path = require('path')
const cp = require('child_process')
const execSh = require('exec-sh').promise
const { createSitemap } = require('sitemaps')

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
        `constexprjs ${process.argv.slice(2).join(' ')} --input=. --output=_out --entry /index.html --jobcount 12 --depfile devtools/deps.json --literal-tag style --literal-tag prog`,
        {},
    )
    const config = JSON.parse(fs.readFileSync('collections/config.json'))
    const deps = JSON.parse(fs.readFileSync('devtools/deps.json'))
    const now = new Date()
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
}


main()
    .then(() => process.exit(0))
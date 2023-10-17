const fs = require('fs-extra')
const path = require('path')
const cp = require('child_process')
const execSh = require('exec-sh').promise

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

    const sass_task = execSh('npx sass ./static/scss/styles.scss:./static/css/styles.css --style compressed')
    const website_task = execSh(
        `constexprjs ${process.argv.slice(2).join(' ')} --input=. --output=_out --entry /index.html --jobcount 4 --depfile devtools/deps.json --verbose`,
        {},
    )

    await Promise.all([sass_task, website_task])
}


main()
    .then(() => process.exit(0))
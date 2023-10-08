const fs = require('fs-extra')
const path = require('path')
const cp = require('child_process')
const execSh = require('exec-sh').promise

async function main() {
    process.chdir("..")
    const OUT = path.normalize("_out")

    fs.removeSync(OUT)
    fs.mkdirSync(OUT)

    const sass_task = execSh('npx sass ./static/scss/styles.scss:./static/css/styles.css --style compressed')
    const website_task = execSh(
        `constexprjs ${process.argv.slice(2).join(' ')} --input=. --output=_out --entry /index.html --jobcount 4 --depfile devtools/deps.json --verbose`,
        {},
    )

    await Promise.all([sass_task, website_task])
}


main()
    .then(() => process.exit(0))
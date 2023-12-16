const execSh = require('exec-sh').promise
const open = require('open')

async function main() {
    const server_task = execSh('npx http-server -s -p 1750 ..')
    const sass_task = execSh('npx sass --watch ../static/scss/styles.scss:../static/css/styles.css --no-source-map')
    setTimeout(() => {
        open("http://localhost:1750")
    }, 1000)
    await Promise.all([sass_task, server_task])
}

main()
    .then(() => process.exit(0))

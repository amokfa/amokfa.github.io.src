async function evalConstexpr(path) {
    window._ConstexprJS_.addExclusion(path)
    let t = await fetch(path)
        .then((res) => res.text())
    eval(t)
}

let PageResources
async function fetchResources() {
    return {
        mainCss: await fetch('/static/css/styles.css').then(res => res.text()),
    }
}

async function site_global_rendering() {
    await evalConstexpr('/static/js/constexpr/lib.js')
    await evalConstexpr('/static/js/constexpr/react.js')
    await evalConstexpr('/static/js/constexpr/react-dom.js')
    PageResources = React.createContext()
    window.e = React.createElement
    await renderBody()
    await populateHead()
}

async function renderBody() {
    // const pageContent = document.body
    // document.body = document.createElement('body')
    const newBody = document.createElement('body')
    newBody.setAttribute('render_date', `${new Date()}`)
    newBody.classList.add('light')

    ReactDOM.createRoot(newBody)
        .render(e(
            PageResources.Provider,
            { value: await fetchResources() },
            e(Page, { newBody }, null)
        ))
    document.body = newBody
}
async function populateHead() {}

function Page() {
    return e(
        React.Fragment,
        {},
        e(
            PageResources.Consumer, null,
            context => e('style', {}, context.mainCss)
        ),
        e('img', { src: '/static/img/bg.webp', className: 'bg', id: 'main_bg', loading: 'lazy' }),
        e(ViewBgBtn),
        e(LeftSidebar),
        e(PageContent),
        e(RightSidebar),
    )
}

function ViewBgBtn() {
    return e(
        'div',
        { id: 'view_bg_btn' },
        e('div', { id: 'screen_img' })
    )
}

function LeftSidebar() {
    return e(
        'div',
        { id: 'left-sidebar' }
    )
}
function RightSidebar() {
    return e(
        'div',
        { id: 'right-sidebar' }
    )
}
function PageContent() {
    return e(
        'div',
        { id: 'body_wrapper' },
        e(
            'header', {}
        ),
        e('article', {}),
        e('footer', {})
    )
}
async function evalConstexpr(path) {
    window._ConstexprJS_.addExclusion(path)
    let t = await fetch(path)
        .then((res) => res.text())
    eval(t)
}

let PageResources
let NewBody

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
    NewBody = document.createElement('body')
    NewBody.setAttribute('render_date', `${new Date()}`)
    NewBody.classList.add('light')

    ReactDOM.createRoot(NewBody)
        .render(e(
            PageResources.Provider,
            {value: await fetchResources()},
            e(Page, {}, null)
        ))
}

async function populateHead() {
}

function Page() {
    React.useEffect(() => {
        document.body = NewBody
    }, []);
    return e(
        React.Fragment,
        {},
        e(
            PageResources.Consumer, null,
            context => e('style', {}, context.mainCss)
        ),
        e('img', {src: '/static/img/bg.webp', className: 'bg', id: 'main_bg', loading: 'lazy'}),
        e(ViewBgBtn),
        e(LeftSidebar),
        e(PageContent),
        e(RightSidebar),
    )
}

function ViewBgBtn() {
    return e(
        'div',
        {id: 'view_bg_btn'},
        e('div', {id: 'screen_img'})
    )
}

function LeftSidebar() {
    let marks
    if (document.querySelector('article').children[0].tagName === 'H2') {
        marks = []
    } else {
        marks = ['Top']
    }
    marks.push(...Array.from(document.querySelectorAll('article h2'))
        .map(el => el.textContent))
    return e(
        'div',
        {id: 'left-sidebar', style: {display: marks.length === 1 ? 'none' : null}},
        e(
            'div',
            {className: 'dialog'},
            e(
                'div',
                {className: 'heading'},
                'Settings'
            ),
            e(
                'ol',
                {className: 'content'},
                marks.map(
                    mark => e(
                        'li',
                        {key: mark},
                        e(
                            'a',
                            {href: `#${mark}`},
                            mark
                        )
                    )
                ),
            ),
            e(
                'img',
                {className: 'open', alt: 'open left sidebar', src: '/static/img/icons/swipe.svg'}
            ),
            e(
                'img',
                {className: 'close', alt: 'close left sidebar', src: '/static/img/icons/swipe.svg'}
            ),
        )
    )
}

function RightSidebar() {
    return e(
        'div',
        {id: 'right-sidebar'},
        e(
            'div',
            {className: 'dialog'},
            e(
                'div',
                {className: 'heading'},
                'Settings'
            ),
            e(
                'div',
                {className: 'content'},
                e(
                    'button',
                    {},
                    'Subscribe'
                ),
                e(
                    'div',
                    {id: 'toggle_theme_wrapper'},
                    e(
                        'div',
                        {id: 'toggle_theme'}
                    )
                )
            ),
            e(
                'img',
                {className: 'open', alt: 'open right sidebar', src: '/static/img/icons/swipe.svg'}
            ),
            e(
                'img',
                {className: 'close', alt: 'close right sidebar', src: '/static/img/icons/swipe.svg'}
            ),
        )
    )
}

function PageContent() {
    return e(
        'div',
        {id: 'body_wrapper'},
        e(
            'header', {}
        ),
        e('article', {}),
        e('footer', {})
    )
}
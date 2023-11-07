async function evalConstexpr(path) {
    window._ConstexprJS_.addExclusion(path)
    let t = await fetch(path)
        .then((res) => res.text())
    eval(t)
}

let PageResources
let NewBody

async function fetchResources() {
    let res = {
        mainCss: await fetch('/static/css/styles.css').then(res => res.text()),
        cfg: await fetch('/collections/config.json')
            .then(res => res.json()),
        posts: await fetch('/collections/posts.json')
            .then(res => res.json()),
        nav: await fetch('/collections/nav.json')
            .then(res => res.json()),
        projects: await fetch('/collections/projects.json')
            .then(res => res.json())
    };
    res.thisPost = res.posts.filter(p => p.url === document.location.pathname)[0]
    if (res.thisPost) {
        res.title = res.thisPost.title
    } else {
        res.title = ''
    }
    return res
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
    NewBody.classList.add('dark')

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
            PageResources.Consumer, {},
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
    let marks = []
    try {
        if (document.querySelector('article').children[0].tagName !== 'H2') {
            marks = ['Top']
        }
    } catch (e) {}
    marks.push(...Array.from(document.querySelectorAll('article h2'))
        .map(el => el.textContent))
    return e(
        'div',
        {id: 'left-sidebar'},
        e(
            'div',
            {className: 'dialog', style: {display: marks.length === 1 ? 'none' : null}},
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
        PageResources.Consumer,
        {},
        context => e(
            'div',
            {id: 'body_wrapper'},
            e(
                'header', {},
                e(
                    'nav', {},
                    context.nav
                        .map(item => e(
                            'a', {href: item.href},
                            item.name
                        ))
                ),
                e('h1', {id: 'main_title'}, context.thisPost ? context.thisPost.title : null),
            ),
            e('article', {}),
            e(
                'footer', {},
                e(
                    'div', {className: 'links'},
                    e(
                        'div', {className: 'social'},
                        e(
                            'div', {className: 'footer-title'},
                            'Share this page'
                        ),
                        e('a', {
                            className: 'svg-icon twitter',
                            rel: 'noopener',
                            title: 'twitter',
                            target: '_blank',
                            href: `https://twitter.com/share?text=${context.title}&url=${context.cfg.url + window.location.pathname}`
                        }),
                        e('a', {
                            className: 'svg-icon facebook',
                            rel: 'noopener',
                            title: 'facebook',
                            target: '_blank',
                            href: `https://www.facebook.com/sharer.php?u=${context.cfg.url + window.location.pathname}`
                        }),
                        e('a', {
                            className: 'svg-icon reddit',
                            rel: 'noopener',
                            title: 'reddit',
                            target: '_blank',
                            href: `https://www.reddit.com/submit?title=${context.title}&url=${context.cfg.url + window.location.pathname}`
                        }),
                        e('a', {
                            className: 'svg-icon hn',
                            rel: 'noopener',
                            title: 'hacker news',
                            target: '_blank',
                            href: `https://news.ycombinator.com/submitlink?t=${context.title}&u=${context.cfg.url + window.location.pathname}`
                        }),
                    )
                )
            )
        )
    )
}
async function evalConstexpr(path) {
    window._ConstexprJS_.addExclusion(path)
    let t = await fetch(path)
        .then((res) => res.text())
    eval(t)
}

let PageResources
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
    res.thisPost = res.posts.find(p => p.url === document.location.pathname)
    if (res.thisPost) {
        res.title = res.thisPost.title
    } else {
        let navItem = res.nav.find(n => n.href === document.location.pathname)
        if (navItem) {
            res.title = navItem.name
        } else {
            res.title = ''
        }
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
    document.body.setAttribute('render_date', `${new Date()}`)
    document.body.classList.add('dark')

    const newBody = document.createElement('div')
    newBody.setAttribute('id', 'body_wrapper')
    document.body.prepend(newBody)
    ReactDOM.createRoot(newBody)
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
        document.querySelector('body > article').remove()
        window._ConstexprJS_.compile()
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

function titleToId(title) {
    return title.toLowerCase()
        .replaceAll(' ', '_')
        .replace(/[^\w]/g, '')
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
                            {href: `#${titleToId(mark)}`},
                            mark
                        )
                    )
                ),
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
}

function PageContent() {
    return e(
        PageResources.Consumer,
        {},
        context => e(
            'div',
            {id: 'page_content'},
            e(
                'header', {},
                e(
                    'nav', {},
                    context.nav
                        .map(item => e(
                            'a', {href: item.href, key: item.href, className: item.href === window.location.pathname ? 'current' : ''},
                            item.name
                        ))
                ),
                e('h1', {id: 'main_title'}, context.thisPost ? context.thisPost.title : null),
            ),
            e(Article, {}),
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

function Article() {
    let currentContent = [...document.querySelector('article').children]
    if (currentContent[0].tagName !== 'H2') {
        currentContent.unshift(make_element(`<h2 style="display: none;">Top</h2>`))
    }
    const headerIdxs = []
    currentContent.forEach((el, idx) => {
        if (el.nodeName === 'H2') {
            headerIdxs.push(idx)
        }
    })
    const sections = []
    for (let i=0; i<headerIdxs.length; i++) {
        sections.push({
            id: titleToId(currentContent[headerIdxs[i]].textContent),
            ref: React.createRef(),
            elements: currentContent.slice(headerIdxs[i], headerIdxs[i+1] || 1000000),
        })
    }
    React.useEffect(() => {
        for (let section of sections) {
            for (let el of section.elements) {
                section.ref.current.appendChild(el)
            }
        }
    }, [])
    return e(
        'article', {},
        sections.map(
            ({id, ref}) => e(
                'section', {id: id, key: id, ref},
            )
        )
    )
}
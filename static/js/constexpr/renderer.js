// Fetch a script, eval it, and exclude it from resources
async function evalConstexpr(path) {
    window._ConstexprJS_.addExclusion(path)
    let t = await fetch(path)
        .then((res) => res.text())
    eval(t)
}

// All site configuration is loaded here
// This is provided using a context to react code to render the website
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
    // Load all necessary javascript
    await evalConstexpr('/static/js/constexpr/lib.js')
    await evalConstexpr('/static/js/constexpr/react.js')
    await evalConstexpr('/static/js/constexpr/react-dom.js')

    PageResources = React.createContext()
    window.e = React.createElement

    const resources = await fetchResources()
    // * Renders overall layout of the website (using ReactJS)
    await renderBody(resources)
    // * Renders latex, graphs, syntax highlighting, etc
    await Promise.all([literal_links(), render_latex(), render_graphviz(), syntax_highlight()])

    // * Adds necessary info to head (title, meta, etc)
    await populateHead(resources)

    // * Adds runtime bootstrap hooks
    addRuntimeBootstrapHook({
        src: '/static/js/dynamic-pre.js',
        early: true
    })
    addRuntimeBootstrapHook({
        src: '/static/js/dynamic-post.js'
    })
    addRuntimeBootstrapHook({
        src: '/static/js/mtm.js',
    })
}

async function renderBody(resources) {
    document.body.setAttribute('render_date', `${new Date()}`)
    document.body.classList.add('dark')

    const newBody = document.createElement('div')
    newBody.setAttribute('id', 'body_wrapper')
    document.body.prepend(newBody)

    // Wait until react is done rendering the page and then return
    await new Promise((resolve) => {
        ReactDOM.createRoot(newBody)
            .render(e(
                PageResources.Provider,
                {value: resources},
                e(Page, {pageHasRendered: () => resolve()}, null)
            ))
    })
}

async function populateHead(resources) {
    document.head.appendChild(
        make_element(
            `<meta charset="UTF-8">`
        )
    )
    document.head.appendChild(
        make_element(
            `<link rel="icon" href="/favicon.ico" sizes="32x32" type="image/x-icon">`
        )
    )
    window._ConstexprJS_.addDependency('/favicon.ico')
    document.head.appendChild(
        make_element(
            `<meta name="viewport" content="width=device-width, min-width=600, initial-scale=1, minimum-scale=1">`
        )
    )
    document.head.appendChild(
        make_element(
            `<style>${await fetch('/static/css/styles.css')
                .then(res => res.text())}</style>`
        )
    )
    document.head.appendChild(
        make_element(
            `<link rel="preconnect" href="https://fonts.gstatic.com">`
        )
    )
    if (resources.thisPost) {
        document.head.appendChild(
            make_element(
                `<meta name="description" content="${resources.thisPost.description}">`
            )
        )
        document.head.appendChild(
            make_element(
                `<meta name="keywords" content="${resources.thisPost.tags.join(',')}">`
            )
        )
    }
    document.head.appendChild(
        make_element(`<title>${resources.title}</title>`)
    )

    // hide dynamic controls if JS disabled
    document.head.appendChild(
        make_element(`
      <noscript>
        <style>
          #left-sidebar .open, #left-sidebar .close, #right-sidebar .open, #right-sidebar .close, #right-sidebar #toggle_theme_wrapper, #view_bg_btn {
            display: none;
          } 
        </style>
      </noscript>
      `)
    )
}

function Page({ pageHasRendered }) {
    React.useEffect(() => {
        // not needed since it's contents have been rendered in react app
        // See `Article` react component below
        document.querySelector('body > article').remove()
        pageHasRendered()
    }, []);
    return e(
        React.Fragment,
        {},
        e(
            PageResources.Consumer, {},
            // <style>[All necessary css</style>
            // Essential embedded in HTML instead of <link rel="stylesheet"> for performance
            context => e('style', {}, context.mainCss)
        ),
        e('img', {src: '/static/img/bg.webp', className: 'bg', id: 'main_bg', loading: 'lazy'}),
        e(ViewBgBtn),
        e(LeftSidebar),
        e(PageContent),
        e(RightSidebar),
        // All the non-essential css is loaded here after the page has loaded
        e('div', {id: 'post_load_css'})
    )
}

function ViewBgBtn() {
    return e(
        'div',
        {id: 'view_bg_btn'},
        e('div', {id: 'screen_img'})
    )
}

// Used in table of content
// Article is split into sections at every heading
// Each section has an id based on section heading
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
            {className: 'dialog', style: {display: marks.length < 2 ? 'none' : null}},
            e(
                'div',
                {className: 'heading'},
                'Table of content'
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

// * split the article contents into groups at each 'h2' tag
// * add a section for each group
// * add an id to each section, links in table of content point to it
function Article() {
    let currentContent = [...document.querySelector('article').children]
    if (currentContent.length === 0) {
        return e('article')
    }
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

/**
 * Set href on all links marked at literal
 */
async function literal_links() {
    document.querySelectorAll('a[literal]').forEach(
        el => el.setAttribute('href', el.textContent)
    )
}

async function syntax_highlight() {
    document.querySelectorAll('prog, progi').forEach(el => {
        el.setAttribute('role', 'figure')
        el.textContent = el.textContent.trim()
    })
    const els = [...document.querySelectorAll('prog[class]')]
    if (els.length > 0) {
        window.Prism = {manual: true};
        await evalConstexpr("/static/js/constexpr/third_party/prism.js")
        document.querySelector('#post_load_css').appendChild(
            make_element(`<link rel="stylesheet" href="/static/css/prism.css">`)
        )
        await Promise.all(els.map(
            el => new Promise((resolve) => {
                Prism.highlightElement(el, null, () => resolve())
            })
        ))
    }
}

async function render_latex() {
    const blocks = document.querySelectorAll('formula')
    if (blocks.length > 0) {
        await evalConstexpr("/static/packages/katex/katex.js")
        await evalConstexpr("/static/packages/katex/contrib/auto-render.js")
        document.querySelector('#post_load_css').appendChild(make_element(`<link rel="stylesheet" href="/static/packages/katex/katex.css">`))
        window._ConstexprJS_.addDependency('/static/packages/katex/fonts')
        blocks.forEach(block => renderMathInElement(block))
    }
}

async function render_graphviz() {
    const blocks = document.querySelectorAll('.graphviz')
    if (blocks.length > 0) {
        await evalConstexpr('/static/packages/vizjs/viz.js')
        await evalConstexpr('/static/packages/vizjs/full.render.js')

        for (const block of blocks) {
            const viz = new Viz()
            const vizel = await viz.renderSVGElement(block.textContent)
            block.textContent = ''
            block.appendChild(vizel)
        }
    }
}



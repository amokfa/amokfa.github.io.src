/**
 * All unnecessary css is loaded in this tag after the content
 */
let post_load_css
/**
 * config data, to be replaces with sql
 */
let global_cfg
let all_posts
let this_post
let nav_items

async function initial_setup() {
  [
    '/collections/config.json',
    '/collections/nav.json',
    '/collections/posts.json',
    '/collections/projects.json'
  ].forEach(p => window._ConstexprJS_.addExclusion(p));

  [global_cfg, all_posts, nav_items] = await Promise.all(
      [
        fetch('/collections/config.json'),
        fetch('/collections/posts.json'),
        fetch('/collections/nav.json')
      ].map(p => p.then(res => res.json()))
  )

  this_post = all_posts.filter(p => p.url === document.location.pathname)[0]

  post_load_css = make_element(
      `<div id="post_load_css" style="display: none;"></div>`
  )
}

async function render_content() {
  await populate_head()

  let main_bg = make_element('<img alt="background" class="bg" id="main_bg" src="/static/img/bg.webp" loading="lazy" />')
  document.body.appendChild(main_bg)
  document.body.appendChild(make_element(`<div id="view_bg_btn" onclick="show_image_tag(document.querySelector('#main_bg'))"><div id="screen_img" /></div>`));
  document.body.classList.add('light')

  post_load_css.appendChild(
      make_element(
          `<link href="https://fonts.googleapis.com/css2?family=Roboto+Mono:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap" rel="stylesheet">`
      )
  )

  let header = document.createElement('header')
  const nav = document.createElement("nav")
  Object.keys(nav_items).forEach(name => {
    const item = make_element(
        `
          <a href="${nav_items[name]}">
              ${name}
          </a>
          `
    )
    if (nav_items[name] === window.location.pathname || nav_items[name] + 'index.html' === window.location.pathname) {
      item.classList.add("current")
    }
    nav.appendChild(item)
  })
  header.appendChild(nav)
  if (this_post) {
    header.appendChild(make_element(`<h1 id="main_title">${this_post.title}</h1>`))
    const tags_el = make_element(`<ul class="tags_list"></ul>`)
    this_post.tags.forEach(tag => tags_el.appendChild(make_element(`<li><a class="tag_element" href="/tags/generator.html?${tag}">${tag}</a></li>`)))
    header.appendChild(tags_el)
  } else {
    header.appendChild(make_element(`<h1 id="main_title"></h1>`))
  }

  let title = this_post ? this_post.title : ""
  let footer = make_element(`
<footer>
    <div class="links">
        <div class="social">
            <div class="footer-title">Share this page:</div>
            <a rel="noopener" title="twitter" class="svg-icon twitter" target="_blank" href="https://twitter.com/share?text=${title}&url=${global_cfg.url + window.location.pathname}"></a>
            <a rel="noopener" title="facebook" class="svg-icon facebook" target="_blank" href="https://www.facebook.com/sharer.php?u=${global_cfg.url + window.location.pathname}"></a>
            <a rel="noopener" title="reddit" class="svg-icon reddit" target="_blank" href="https://www.reddit.com/submit?title=${title}&url=${global_cfg.url + window.location.pathname}"></a>
            <a rel="noopener" title="hacker news" class="svg-icon hn" target="_blank" href="https://news.ycombinator.com/submitlink?t=${title}&u=${global_cfg.url + window.location.pathname}"></a>
        </div>
    </div>
</div>
</footer>
`)

  let article = document.querySelector('article')
  article.setAttribute('role', 'main')
  article.remove()

  let body_wrapper = make_element(`<div id="body_wrapper" class="first_body_wrapper"></div>`)
  body_wrapper.appendChild(header)
  body_wrapper.appendChild(article)
  body_wrapper.appendChild(footer)
  document.body.appendChild(body_wrapper)
  insertBefore(
      body_wrapper,
      make_element(`
<div id="left-sidebar">
    <div class="dialog">
        <div class="heading">Table of content</div>
        <ol class="content"></ol>
    </div>
    <img alt="open left sidebar" src="/static/img/icons/swipe.svg" class="open" />
    <img alt="close left sidebar" src="/static/img/icons/swipe.svg" class="close" />
</div>`))
  insertBefore(body_wrapper, make_element(
      `<div id="right-sidebar">
    <div class="dialog">
        <div class="heading">Settings</div>
        <div class="content">
            <button>Subscribe</button>
            <div id="toggle_theme_wrapper"><div id="toggle_theme" /></div>
        </div>
    </div>
    <img alt="open right sidebar" src="/static/img/icons/swipe.svg" class="open" />
    <img alt="close right sidebar" src="/static/img/icons/swipe.svg" class="close" />
</div>`
  ))
}

async function fetchFile(path) {
  return await (await fetch(path)).text()
}

async function evalScript(path) {
  window._ConstexprJS_.addExclusion(path)
  let t = await fetchFile(path)
  eval(t)
}

async function syntax_highlight() {
  document.querySelectorAll('prog, progi').forEach(el => {
    el.setAttribute('role', 'figure')
    el.textContent = el.textContent.trim()
  })
  const els = [...document.querySelectorAll('prog[class]')]
  if (els.length > 0) {
    window.Prism = {manual: true};
    await evalScript("/static/js/constexpr/third_party/prism.js")
    post_load_css.appendChild(
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
    await evalScript("/static/packages/katex/katex.js")
    await evalScript("/static/packages/katex/contrib/auto-render.js")
    post_load_css.appendChild(make_element(`<link rel="stylesheet" href="/static/packages/katex/katex.css">`))
    window._ConstexprJS_.addDependency('/static/packages/katex/fonts')
    blocks.forEach(block => renderMathInElement(block))
  }
}

async function render_graphviz() {
  const blocks = document.querySelectorAll('.graphviz')
  if (blocks.length > 0) {
    await evalScript('/static/packages/vizjs/viz.js')
    await evalScript('/static/packages/vizjs/full.render.js')

    for (const block of blocks) {
      const viz = new Viz()
      const vizel = await viz.renderSVGElement(block.textContent)
      block.textContent = ''
      block.appendChild(vizel)
    }
  }
}

/**
 * Set href on all links marked at literal
 */
async function literal_links() {
  document.querySelectorAll('a[literal]').forEach(
    el => el.setAttribute('href', el.textContent)
  )
}

function gen_id(title) {
  return title.toLowerCase().replace(/[^\w]/g, '').replaceAll(' ', '_')
}

/**
 * Set href on all links marked at literal
 */
function create_sections() {
  const sections = []
  let article = document.querySelector('article')
  if (!article.querySelector('section')) {
    if (article.children[0] && article.children[0].nodeName !== 'H2') {
      article.prepend(make_element(`<h2 style="display: none;">Top</h2>`))
    }
    const header_idxs = []
    const nodes = Array.from(article.children)
    nodes.forEach((el, idx) => {
      if (el.nodeName === 'H2') {
        header_idxs.push(idx)
      }
    })
    for (let i = 0; i < header_idxs.length; i++) {
      const sec = make_element(`<section></section>`)
      const s_mems = nodes.slice(header_idxs[i], header_idxs[i + 1] || 10000)
      s_mems.forEach(mem => sec.appendChild(mem))
      sections.push(sec)
    }
  } else {
    article.querySelectorAll('section').forEach(
      sec => {
        sec.remove()
        sections.push(sec)
      }
    )
  }
  const section_names = []
  sections.forEach(sec => {
    const h2 = sec.querySelector('h2')
    section_names.push(h2.innerText)
    sec.setAttribute('id', gen_id(h2.innerText))
    article.appendChild(sec)
  })
  return section_names
}

/**
 * create sections and table of content
 */
function section_management() {
  const section_names = create_sections()
  if (section_names.length > 1) {
    const toc = document.querySelector('#left-sidebar .content')
    section_names.forEach(
      sn => toc.appendChild(make_element(`<li><a href="#${gen_id(sn)}">${sn}</a></li>`))
    )
  } else {
    document.querySelector('#left-sidebar .dialog').style.display = 'none'
  }
}

/**
 * Add SEO, title, etc to head tag
 */
async function populate_head() {
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
  document.head.appendChild(
      make_element(
          `<meta name="viewport" content="width=device-width, min-width=600, initial-scale=1, minimum-scale=1">`
      )
  )
  document.head.appendChild(
      make_element(
          `<style>${await fetchFile('/static/css/styles.css')}</style>`
      )
  )
  document.head.appendChild(
      make_element(
          `<link rel="preconnect" href="https://fonts.gstatic.com">`
      )
  )
  if (this_post) {
    document.head.appendChild(
        make_element(
            `<meta name="description" content="${this_post.description}">`
        )
    )
    document.head.appendChild(
        make_element(
            `<meta name="keywords" content="${this_post.tags.join(',')}">`
        )
    )
    document.head.appendChild(
        make_element(`<title>${this_post.title}</title>`)
    )
  } else {
    document.head.appendChild(
        make_element(`<title></title>`)
    )
  }

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

async function site_global_rendering() {
  document.body.setAttribute('render_date', `${new Date()}`)
  await initial_setup()
  await Promise.all([render_content(), syntax_highlight(), render_latex(), render_graphviz(), literal_links()])

  section_management()

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
  document.body.appendChild(post_load_css)
  // Makeshift hot reloading
  window.onfocus = () => {
    // setTimeout(() => window.location.reload(), 400)
  }
}

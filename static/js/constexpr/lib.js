if (!window._ConstexprJS_) {
  window._ConstexprJS_ = {
    compile: () => {},
    abort: () => {},
    addPath: () => {},
    addExclusion: () => {},
    addDependency: () => {},
    log: () => {},
    DEV: true
  }
}

function make_element(str) {
  const p = document.createElement("template")
  p.innerHTML = str
  return p.content.cloneNode(true).children[0]
}

function insertBefore(sib, el) {
  sib.parentNode.insertBefore(el, sib)
}

function insertAfter(sib, el) {
  sib.parentNode.insertBefore(el, sib.nextSibling)
}

function trace(data) {
  console.log(JSON.stringify(data, null, 4))
  return data
}

async function sleep(n) {
  return new Promise((resolve) => setTimeout(() => resolve(), n))
}

function dump_markdown() {
  Array.from(document.querySelectorAll('progi')).forEach(e => {
    e.insertAfter(make_element(`<span>\`${e.textContent}\`</span>`))
    e.remove()
  });
  let s = ''
  let els = Array.from(document.querySelectorAll('article > section > *'))
  els.forEach(e => {
    if (e.nodeName === 'H2' && e.style.display !== 'none') {
      s += `## ${e.textContent}\n`
    } else if (e.nodeName === 'P') {
      s += `${e.innerHTML.replaceAll(/\s*\n\s*/g, ' ').trim()}\n\n`
    } else if (e.nodeName === 'PROG') {
      s += `\`\`\`${e.classList[0].substr(9)}\n${e.textContent}\n\`\`\`\n`
    }
  })
  return s
}

function addRuntimeBootstrapHook(js) {
  let el = document.createElement('script')
  if (js.src) {
    el.setAttribute('src', js.src)
  } else if (js.code) {
    el.textContent = js.code
  } else {
    throw "invalid arguments"
  }
  if (js.async) {
    el.setAttribute('async', '')
  }
  if (js.early) {
    document.body.prepend(el)
  } else {
    el.setAttribute('defer', '')
    document.body.appendChild(el)
  }
}

window._ConstexprJS_.consoleInfo = console.info
const SUPPRESSED_WARNINGS = ['Download the React DevTools'];
console.info = function filterWarnings(msg, ...args) {
  if (!SUPPRESSED_WARNINGS.some((entry) => msg.includes(entry))) {
    window._ConstexprJS_.consoleInfo(msg, ...args);
  }
};
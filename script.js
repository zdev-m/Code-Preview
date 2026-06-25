document.addEventListener('DOMContentLoaded', () => {
  const editor = document.getElementById('main-editor');
  const fileInput = document.getElementById('file-input');
  const uploadBtn = document.getElementById('uploadBtn');
  const pasteBtn = document.getElementById('pasteBtn');
  const clearBtn = document.getElementById('clearBtn');
  const runBtn = document.getElementById('runBtn');

  if (uploadBtn) {
    uploadBtn.addEventListener('click', () => fileInput.click());
  }

  fileInput.addEventListener('change', uploadFiles);

  editor.addEventListener('keydown', function(e) {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = this.selectionStart;
      const end = this.selectionEnd;
      this.value = this.value.substring(0, start) + '    ' + this.value.substring(end);
      this.selectionStart = this.selectionEnd = start + 4;
      refresh();
    }
  });

  editor.addEventListener('input', refresh);
  editor.addEventListener('scroll', syncScroll);

  if (pasteBtn) pasteBtn.addEventListener('click', pasteCode);
  if (clearBtn) clearBtn.addEventListener('click', clearCode);
  if (runBtn) runBtn.addEventListener('click', runPreview);

  refresh();
});

function syncScroll() {
  const editor = document.getElementById('main-editor');
  const lineNums = document.getElementById('line-numbers');
  if (lineNums) lineNums.scrollTop = editor.scrollTop;
}

function refresh() {
  const editor = document.getElementById('main-editor');
  const lineNums = document.getElementById('line-numbers');
  const charCount = document.getElementById('char-count');
  const lineCountEl = document.getElementById('line-count');

  if (!editor) return;

  const lines = editor.value.split('\n').length;
  const chars = editor.value.length;

  if (charCount) charCount.textContent = chars.toLocaleString() + ' chars';
  if (lineCountEl) lineCountEl.textContent = lines + (lines === 1 ? ' line' : ' lines');

  let html = '';
  for (let i = 1; i <= lines; i++) html += '<span>' + i + '</span>';
  if (lineNums) lineNums.innerHTML = html;
}

function uploadFiles(event) {
  const files = Array.from(event.target.files);
  if (!files.length) return;

  const allowed = ['.html', '.htm', '.css', '.js', '.txt'];
  const valid = files.filter(file => allowed.some(ext => file.name.toLowerCase().endsWith(ext)));

  if (!valid.length) {
    alert('Please upload .html, .css, .js, or .txt files only.');
    event.target.value = '';
    return;
  }

  const readers = valid.map(file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      const name = file.name.toLowerCase();
      let content = e.target.result;
      let type = 'unknown';

      if (name.endsWith('.css')) {
        type = 'css';
        content = '\n<style>\n' + content + '\n</style>\n';
      } else if (name.endsWith('.js')) {
        type = 'js';
        content = '\n<script>\n' + content + '\n<\/script>\n';
      } else if (name.endsWith('.html') || name.endsWith('.htm')) {
        type = 'html';
      } else if (name.endsWith('.txt')) {
        type = 'text';
      }

      resolve({ content, type, name: file.name });
    };
    reader.onerror = () => reject(new Error('Failed: ' + file.name));
    reader.readAsText(file);
  }));

  Promise.all(readers).then(results => {
    const html = results.filter(r => r.type === 'html');
    const css = results.filter(r => r.type === 'css');
    const js = results.filter(r => r.type === 'js');
    const other = results.filter(r => r.type === 'text' || r.type === 'unknown');

    let final = '';

    if (html.length) {
      let base = html[0].content;
      const extraCSS = css.map(file => file.content).join('\n');
      const extraJS = js.map(file => file.content).join('\n');

      if (extraCSS.trim()) {
        if (base.includes('</head>')) base = base.replace('</head>', extraCSS + '\n</head>');
        else base = extraCSS + '\n' + base;
      }

      if (extraJS.trim()) {
        if (base.includes('</body>')) base = base.replace('</body>', extraJS + '\n</body>');
        else base += '\n' + extraJS;
      }

      final = base;
      if (html.length > 1) final += '\n\n<!-- Additional HTML -->\n' + html.slice(1).map(file => file.content).join('\n\n');
      if (other.length) final += '\n\n<!-- Additional Text -->\n' + other.map(file => file.content).join('\n\n');
    } else {
      final = '<!DOCTYPE html>\n<html>\n<head>\n  <meta charset="UTF-8">\n  <title>Preview</title>\n' +
        css.map(file => file.content).join('\n') + '\n</head>\n<body>\n' +
        other.map(file => '<pre>' + escapeHtml(file.content) + '</pre>').join('\n') + '\n' +
        js.map(file => file.content).join('\n') + '\n</body>\n</html>';
    }

    const ed = document.getElementById('main-editor');
    ed.value = final;
    ed.scrollTop = 0;
    ed.selectionStart = ed.selectionEnd = 0;
    refresh();
  }).catch(err => alert('Error: ' + err.message));

  event.target.value = '';
}

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[char]));
}

function clearCode() {
  const editor = document.getElementById('main-editor');
  if (editor.value.trim() && confirm('Clear all code?')) {
    editor.value = '';
    refresh();
  } else if (!editor.value.trim()) {
    editor.value = '';
    refresh();
  }
}

async function pasteCode() {
  const editor = document.getElementById('main-editor');
  try {
    const text = await navigator.clipboard.readText();
    const savedScroll = editor.scrollTop;
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    editor.value = editor.value.substring(0, start) + text + editor.value.substring(end);
    // Set cursor to start of pasted content, not end — prevents jump to bottom
    editor.selectionStart = editor.selectionEnd = start;
    // Restore scroll after browser paints (focus causes scroll reset)
    requestAnimationFrame(() => {
      editor.scrollTop = savedScroll;
    });
    refresh();
  } catch {
    alert('Please allow clipboard access to use Paste.');
  }
}

function runPreview() {
  const code = document.getElementById('main-editor').value;
  if (!code.trim()) {
    alert('Write or upload some code first!');
    return;
  }

  const backButton = `
<style>
  .preview-close {
    position: fixed;
    top: 18px;
    right: 18px;
    z-index: 2147483647;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    color: rgba(255,255,255,0.75);
    text-decoration: none;
    border: none;
    background: transparent;
    font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
    font-size: 14px;
    line-height: 1;
    transition: color 0.2s ease, opacity 0.2s ease;
    cursor: pointer;
    padding: 0;
  }
  .preview-close:hover {
    color: #fff;
    opacity: 0.9;
  }
  .preview-close:active {
    opacity: 0.7;
  }
</style>
<button class="preview-close" onclick="window.close()">✕</button>`;

  let doc = code;
  const hasHtmlDocument = /<html[\s>]/i.test(code) || /<!doctype html>/i.test(code);

  if (hasHtmlDocument) {
    if (/<body[\s\S]*?>/i.test(doc)) doc = doc.replace(/<body([\s\S]*?)>/i, '<body$1>' + backButton);
    else doc += backButton;
  } else {
    doc = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Live Preview — CodePreview.live</title>
</head>
<body>
  ${backButton}
  ${code}
</body>
</html>`;
  }

  const win = window.open('', '_blank');
  if (win) {
    win.document.open();
    win.document.write(doc);
    win.document.close();
  } else {
    alert('Popup blocked! Please allow popups for this site.');
  }
}
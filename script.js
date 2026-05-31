document.addEventListener('DOMContentLoaded', () => {
  const editor = document.getElementById('main-editor');
  const fileInput = document.getElementById('file-input');
  const uploadBtn = document.getElementById('uploadBtn');
  const pasteBtn = document.getElementById('pasteBtn');
  const clearBtn = document.getElementById('clearBtn');
  const runBtn = document.getElementById('runBtn');

  // Disable default paste behavior to prevent zoom
  editor.addEventListener('paste', function(e) {
    e.preventDefault();
    
    // Get pasted text
    const text = (e.clipboardData || window.clipboardData).getData('text');
    
    // Insert at cursor position
    const start = this.selectionStart;
    const end = this.selectionEnd;
    const currentValue = this.value;
    
    const newValue = currentValue.substring(0, start) + text + currentValue.substring(end);
    this.value = newValue;
    
    // Set cursor after pasted text
    this.selectionStart = this.selectionEnd = start + text.length;
    
    refresh();
  });

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

    document.getElementById('main-editor').value = final;
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

// Fixed paste function
async function pasteCode() {
  const editor = document.getElementById('main-editor');
  try {
    const text = await navigator.clipboard.readText();
    
    // Insert at cursor position
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const currentValue = editor.value;
    
    const newValue = currentValue.substring(0, start) + text + currentValue.substring(end);
    editor.value = newValue;
    
    editor.selectionStart = editor.selectionEnd = start + text.length;
    editor.focus();
    refresh();
  } catch {
    alert('Please allow clipboard access. You can also use Ctrl+V');
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
    gap: 4px;
    padding: 5px 12px;
    border-radius: 40px;
    color: #eef6ff;
    text-decoration: none;
    border: 1px solid rgba(255,255,255,0.2);
    background: rgba(15, 23, 42, 0.55);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    box-shadow: 0 6px 18px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.08);
    font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
    font-weight: 500;
    font-size: 11px;
    letter-spacing: 0.2px;
    transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
    cursor: pointer;
    background-color: rgba(7, 17, 31, 0.6);
    line-height: 1;
  }
  .preview-close:hover {
    transform: translateY(-1px);
    border-color: rgba(99, 230, 255, 0.5);
    background: rgba(7, 17, 31, 0.8);
    box-shadow: 0 10px 24px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.12);
  }
  .preview-close:active {
    transform: translateY(0);
  }
</style>
<button class="preview-close" onclick="window.close()">✕ Close</button>`;

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
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes">
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
/**
 * CodePreview.live - Core Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    const runBtn = document.getElementById('run-btn');
    const editor = document.getElementById('main-editor');
    
    runBtn.addEventListener('click', runPreview);

    // Add Tab support to the main editor
    editor.addEventListener('keydown', function(e) {
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = this.selectionStart;
            const end = this.selectionEnd;

            this.value = this.value.substring(0, start) +
                "    " + this.value.substring(end);

            this.selectionStart = this.selectionEnd = start + 4;
            updateLineNumbers();
        }
    });

    // Sync line numbers on input
    editor.addEventListener('input', updateLineNumbers);
    
    // Initial line number calculation
    updateLineNumbers();
});

/**
 * Clears the main editor
 */
function clearCode() {
    const editor = document.getElementById('main-editor');
    editor.value = '';
    updateLineNumbers();
}

/**
 * Pastes content from clipboard into the main editor
 */
async function pasteCode() {
    const editor = document.getElementById('main-editor');

    try {
        const text = await navigator.clipboard.readText();
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        const currentVal = editor.value;
        
        editor.value = currentVal.substring(0, start) + text + currentVal.substring(end);
        
        editor.selectionStart = editor.selectionEnd = start + text.length;
        updateLineNumbers();
    } catch (err) {
        console.error('Failed to read clipboard: ', err);
        alert('Please allow clipboard access to use the Paste button.');
    }
}

/**
 * Dynamically updates the line numbers display
 */
function updateLineNumbers() {
    const editor = document.getElementById('main-editor');
    const lineNumbersContainer = document.getElementById('line-numbers');
    
    const lines = editor.value.split('\n').length;
    let lineNumbersHtml = '';
    
    for (let i = 1; i <= lines; i++) {
        lineNumbersHtml += `<span>${i}</span>`;
    }
    
    lineNumbersContainer.innerHTML = lineNumbersHtml;
}

/**
 * Opens the current editor content in a new full-screen tab
 */
function runPreview() {
    const code = document.getElementById('main-editor').value;

    // We wrap the user code in a basic HTML shell if they didn't provide one,
    // but generally, in a single-box editor, the user is expected to write the whole doc.
    const fullDocument = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Live Preview - CodePreview.live</title>
    <style>
        body { margin: 0; padding: 0; }
        .preview-back-btn {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            background: rgba(15, 23, 42, 0.8);
            backdrop-filter: blur(8px);
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.2);
            padding: 10px 20px;
            border-radius: 30px;
            cursor: pointer;
            font-family: sans-serif;
            font-weight: 600;
            transition: all 0.2s;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            text-decoration: none;
            display: inline-block;
        }
        .preview-back-btn:hover {
            background: rgba(15, 23, 42, 1);
            transform: scale(1.05);
        }
    </style>
</head>
<body>
    <a href="javascript:window.close()" class="preview-back-btn">← Back to Editor</a>
    ${code}
</body>
</html>
    `;

    const previewWindow = window.open('', '_blank');
    
    if (previewWindow) {
        previewWindow.document.open();
        previewWindow.document.write(fullDocument);
        previewWindow.document.close();
    } else {
        alert('Popup blocked! Please allow popups for this site to see the preview.');
    }
}

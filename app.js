/**
 * CodePreview.live - Core Logic
 * All functions in global scope for onclick handlers
 */

document.addEventListener('DOMContentLoaded', () => {
    const editor = document.getElementById('main-editor');

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

    editor.addEventListener('input', updateLineNumbers);
    
    updateLineNumbers();
});

function clearCode() {
    const editor = document.getElementById('main-editor');
    editor.value = '';
    updateLineNumbers();
}

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

function updateLineNumbers() {
    const editor = document.getElementById('main-editor');
    const lineNumbersContainer = document.getElementById('line-numbers');
    
    const lines = editor.value.split('\n').length;
    let lineNumbersHtml = '';
    
    for (let i = 1; i <= lines; i++) {
        lineNumbersHtml += '<span>' + i + '</span>';
    }
    
    lineNumbersContainer.innerHTML = lineNumbersHtml;
}

function runPreview() {
    const code = document.getElementById('main-editor').value;

    if (!code.trim()) {
        alert('Please write some code first!');
        return;
    }

    const fullDocument = '<!DOCTYPE html>\n<html>\n<head>\n    <meta charset="UTF-8">\n    <title>Live Preview - CodePreview.live</title>\n    <style>\n        body { margin: 0; padding: 0; }\n        .preview-back-btn {\n            position: fixed;\n            top: 20px;\n            right: 20px;\n            z-index: 9999;\n            background: rgba(15, 23, 42, 0.85);\n            backdrop-filter: blur(10px);\n            color: white;\n            border: 1px solid rgba(255, 255, 255, 0.25);\n            padding: 12px 24px;\n            border-radius: 40px;\n            cursor: pointer;\n            font-family: \'Inter\', sans-serif;\n            font-weight: 700;\n            font-size: 0.9rem;\n            transition: all 0.25s ease;\n            box-shadow: 0 8px 24px rgba(0,0,0,0.5);\n            text-decoration: none;\n            display: inline-block;\n        }\n        .preview-back-btn:hover {\n            background: rgba(15, 23, 42, 1);\n            transform: scale(1.08);\n            border-color: #38bdf8;\n        }\n    </style>\n</head>\n<body>\n    <a href="#" class="preview-back-btn" onclick="window.close()">Back to Editor</a>\n    ' + code + '\n</body>\n</html>';

    const previewWindow = window.open('', '_blank');
    
    if (previewWindow) {
        previewWindow.document.open();
        previewWindow.document.write(fullDocument);
        previewWindow.document.close();
    } else {
        alert('Popup blocked! Please allow popups for this site to see the preview.');
    }
}
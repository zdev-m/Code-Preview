/**
 * CodePreview.live - Core Logic
 * Multiple files upload with smart merging
 */

document.addEventListener('DOMContentLoaded', () => {
    const editor = document.getElementById('main-editor');

    // Handle file input change
    const fileInput = document.getElementById('file-input');
    fileInput.addEventListener('change', uploadFiles);

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

/**
 * Upload multiple files and merge content smartly
 */
function uploadFiles(event) {
    const files = Array.from(event.target.files);
    
    if (files.length === 0) return;
    
    // Filter valid files
    const allowedExtensions = ['.html', '.htm', '.css', '.js', '.txt'];
    const validFiles = files.filter(file => {
        const fileName = file.name.toLowerCase();
        return allowedExtensions.some(ext => fileName.endsWith(ext));
    });
    
    if (validFiles.length === 0) {
        alert('Please upload .html, .css, .js, or .txt files only.');
        event.target.value = '';
        return;
    }
    
    // Check if any HTML file exists
    const hasHTML = validFiles.some(file => {
        const name = file.name.toLowerCase();
        return name.endsWith('.html') || name.endsWith('.htm');
    });
    
    // Read all files
    const readers = validFiles.map(file => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                const fileName = file.name.toLowerCase();
                let content = e.target.result;
                let type = 'unknown';
                
                if (fileName.endsWith('.css')) {
                    type = 'css';
                    content = '\n<style>\n' + content + '\n</style>\n';
                } else if (fileName.endsWith('.js')) {
                    type = 'js';
                    content = '\n<script>\n' + content + '\n</script>\n';
                } else if (fileName.endsWith('.html') || fileName.endsWith('.htm')) {
                    type = 'html';
                } else if (fileName.endsWith('.txt')) {
                    type = 'text';
                }
                
                resolve({ content, type, fileName: file.name });
            };
            
            reader.onerror = function() {
                reject(new Error('Failed to read: ' + file.name));
            };
            
            reader.readAsText(file);
        });
    });
    
    Promise.all(readers)
        .then(results => {
            let finalContent = '';
            
            // If HTML file exists, put it first
            const htmlFiles = results.filter(r => r.type === 'html');
            const cssFiles = results.filter(r => r.type === 'css');
            const jsFiles = results.filter(r => r.type === 'js');
            const otherFiles = results.filter(r => r.type === 'text' || r.type === 'unknown');
            
            if (htmlFiles.length > 0) {
                // Use first HTML file as base
                let htmlContent = htmlFiles[0].content;
                
                // Extract CSS and JS from other files and inject into HTML
                const extraCSS = cssFiles.map(f => f.content).join('\n');
                const extraJS = jsFiles.map(f => f.content).join('\n');
                
                // Inject CSS before </head>
                if (extraCSS.trim()) {
                    if (htmlContent.includes('</head>')) {
                        htmlContent = htmlContent.replace('</head>', extraCSS + '\n</head>');
                    } else if (htmlContent.includes('<body')) {
                        htmlContent = htmlContent.replace('<body', extraCSS + '\n<body');
                    } else {
                        htmlContent = extraCSS + '\n' + htmlContent;
                    }
                }
                
                // Inject JS before </body>
                if (extraJS.trim()) {
                    if (htmlContent.includes('</body>')) {
                        htmlContent = htmlContent.replace('</body>', extraJS + '\n</body>');
                    } else if (htmlContent.includes('</html>')) {
                        htmlContent = htmlContent.replace('</html>', extraJS + '\n</html>');
                    } else {
                        htmlContent = htmlContent + '\n' + extraJS;
                    }
                }
                
                finalContent = htmlContent;
                
                // Add any remaining HTML files
                if (htmlFiles.length > 1) {
                    finalContent += '\n\n<!-- Additional HTML Files -->\n';
                    finalContent += htmlFiles.slice(1).map(f => f.content).join('\n\n');
                }
            } else {
                // No HTML file, merge everything
                finalContent = cssFiles.map(f => f.content).join('\n');
                finalContent += jsFiles.map(f => f.content).join('\n');
                finalContent += otherFiles.map(f => f.content).join('\n');
                
                // Wrap in basic HTML structure
                finalContent = '<!DOCTYPE html>\n<html>\n<head>\n    <meta charset="UTF-8">\n    <title>Preview</title>\n' + 
                              cssFiles.map(f => f.content).join('\n') + 
                              '\n</head>\n<body>\n' + 
                              jsFiles.map(f => f.content).join('\n') + 
                              '\n</body>\n</html>';
            }
            
            const editor = document.getElementById('main-editor');
            editor.value = finalContent;
            updateLineNumbers();
        })
        .catch(error => {
            alert('Error reading files: ' + error.message);
        });
    
    // Reset file input
    event.target.value = '';
}

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
        alert('Please write or upload some code first!');
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
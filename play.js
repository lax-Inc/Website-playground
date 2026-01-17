var Module = {
    print: function(text) {
        appendToTerminal(text);
    },
    printErr: function(text) {
        appendToTerminal("STDERR: " + text, true);
    },
    onRuntimeInitialized: function() {
        appendToTerminal(">> Lax v6.0.6 Loaded. Ready.", true);
    }
};

let startTime = 0;

function runLax() {
    const code = document.getElementById('code-input').value;
    const outputDiv = document.getElementById('terminal-output');
    const timeDisplay = document.getElementById('exec-time');
    
    if (!code.trim()) return;

    const sep = document.createElement('div');
    sep.className = 'term-line system-msg';
    outputDiv.appendChild(sep);
    
    startTime = performance.now();
    
    try {
        const result = Module.ccall(
            'run_lax_code',
            'number',
            ['string'], 
            [code]
        );
    } catch (e) {
        appendToTerminal("Critical WebAssembly Error: " + e, true);
    }

    const endTime = performance.now();
    const duration = (endTime - startTime).toFixed(2);
    timeDisplay.innerText = `${duration}ms`;
    
    outputDiv.scrollTop = outputDiv.scrollHeight;
}

function appendToTerminal(text, isSystem = false) {
    const outputDiv = document.getElementById('terminal-output');
    const line = document.createElement('div');
    line.className = 'term-line';
    if(isSystem) line.classList.add('system-msg');

    const parts = text.split('\n');
    parts.forEach((part, index) => {
        line.appendChild(document.createTextNode(part));
        if (index < parts.length - 1) line.appendChild(document.createElement('br'));
    });

    outputDiv.appendChild(line);
    outputDiv.scrollTop = outputDiv.scrollHeight;
}

function clearTerminal() {
    document.getElementById('terminal-output').innerHTML = '';
}

const keywords = [
    'start', 'if', 'let', 'chlet', 'else', 'and', 'or', 'not', 
    'cond', 'case', 'delay', 'quote', 'lambda', 'begin', 'set!', 
    'define', 'macro'
];

const commands = [
    'load', 'input', 'gensym', 'tracing', 'make-closure', 'defined?', 
    'eval', 'apply', 'call-with-current-continuation', 'force', 
    'image', 'nl', 'err', 'gc', 'gc-verbose', 'new-segment', 'oblist',
    'inexact->exact', 'exp', 'log', 'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 
    'sqrt', 'tarry', 'expt', 'floor', 'ceiling', 'truncate', 'round',
    '+', '-', '*', '/', 'quotient', 'remainder', 'modulo', '=', '<', '>', '<=', '>=',
    'head', 'tail', 'cons', 'set-head!', 'set-tail!', 'list', 'list*', 
    'reverse', 'append', 'length', 'assq', 'pair?', 'list?', 'null?',
    'make-string', 'string-length'
];

function updateHighlighting() {
    let text = document.getElementById('code-input').value;
    let highlighted = highlightSyntax(text);
    
    if(text[text.length-1] === "\n") highlighted += "&nbsp;";
    
    document.getElementById('highlighting-content').innerHTML = highlighted;
}

function syncScroll(element) {
    document.getElementById('highlighting').scrollTop = element.scrollTop;
    document.getElementById('highlighting').scrollLeft = element.scrollLeft;
}

function escapeHtml(unsafe) {
    if (!unsafe) return "";
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

function highlightSyntax(text) {
    let highlighted = '';
    let i = 0;

    let bracketBalance = 0;

    const safeAdd = (char) => {
        if (char === '<') return '&lt;';
        if (char === '>') return '&gt;';
        if (char === '&') return '&amp;';
        return char;
    };

    while (i < text.length) {
        const char = text[i];
        
        if (char === ';') {
            let comment = ';'; i++;
            while (i < text.length && text[i] !== '\n') { 
                comment += text[i]; i++; 
            }
            highlighted += `<span class="comment">${escapeHtml(comment)}</span>`; 
            continue;
        }
        
        if (char === '"') {
            let str = '"'; i++;
            while (i < text.length) {
                if (text[i] === '"' && text[i-1] !== '\\') break;
                str += text[i]; i++;
            }
            if (i < text.length) { str += '"'; i++; }
            highlighted += `<span class="string">${escapeHtml(str)}</span>`; 
            continue;
        }

        if (char === '[' || char === ']') {
            if (char === '[') bracketBalance++;
            if (char === ']') bracketBalance--;
            
            let className = "bracket";
            if (bracketBalance < 0) className = "bracket error-token";
            
            highlighted += `<span class="${className}">${char}</span>`; 
            i++; 
            continue;
        }
        
        if (char === '\\' && text[i+1] === 'n') {
            highlighted += `<span class="escape">\\n</span>`; 
            i += 2; 
            continue;
        }
        
        if (char === '\n') { highlighted += '<br>'; i++; continue; }
        if (char === ' ') { highlighted += ' '; i++; continue; }

        if (/[a-zA-Z0-9_\-\?\>\<\=\+\*\/!]/.test(char)) {
            let word = '';
            while (i < text.length && /[a-zA-Z0-9_\-\?\>\<\=\+\*\/!]/.test(text[i])) { 
                word += text[i]; 
                i++; 
            }
            
            if (keywords.includes(word)) {
                highlighted += `<span class="keyword">${escapeHtml(word)}</span>`;
            } else if (commands.includes(word)) {
                highlighted += `<span class="command">${escapeHtml(word)}</span>`;
            } else {
                highlighted += escapeHtml(word);
            }
            continue;
        }

        highlighted += safeAdd(char); 
        i++;
    }

    const statusEl = document.getElementById('syntax-status');
    if(statusEl) {
        if(bracketBalance !== 0) {
            statusEl.innerText = "Syntax Error: Unbalanced brackets";
            statusEl.style.color = "var(--syn-error)";
        } else {
            statusEl.innerText = "Ready";
            statusEl.style.color = "var(--syn-string)";
        }
    }

    return highlighted;
}

function checkBrackets() {
}

function setCookie(name, value, days) {
    let expires = "";
    if (days) {
        let date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

function getCookie(name) {
    let nameEQ = name + "=";
    let ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

function toggleTheme() {
    const body = document.body;
    const isDark = body.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    
    body.setAttribute('data-theme', newTheme);
    setCookie('lax_theme', newTheme, 365);
    
    document.querySelector('.sun-icon').style.display = newTheme === 'dark' ? 'none' : 'block';
    document.querySelector('.moon-icon').style.display = newTheme === 'dark' ? 'block' : 'none';
}

function downloadCode() {
    const code = document.getElementById('code-input').value;
    const filename = document.getElementById('filename-input').value || 'script.lx';
    
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(code));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

window.onload = function() {
    const savedTheme = getCookie('lax_theme');
    if(savedTheme) {
        document.body.setAttribute('data-theme', savedTheme);
        if(savedTheme === 'dark') {
            document.querySelector('.sun-icon').style.display = 'none';
            document.querySelector('.moon-icon').style.display = 'block';
        }
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        toggleTheme();
    }

    const defaultCode = `[start 
  [image "Hello World!"] 
  [nl]
  [spot [x 10]
       [y 20]]
  [image "Calculation: " [+ x y]]
  [nl]
]`;
    
    document.getElementById('code-input').value = defaultCode;
    updateHighlighting();
};

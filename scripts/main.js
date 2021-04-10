const textarea = document.getElementById("textarea");
const content = document.getElementById("content");

function Parse() {
    if (textarea.value)
        _Parse(textarea.value);
}

function _FindLineBreak(string) {
    const i = string.indexOf('\n');
    if (i === -1 && string.indexOf('\r') !== -1) return '\r'; // if \n not found and \r found
    if (i !== -1 && string[i - 1] === '\r') return '\r\n'; // if \n found and \r found right before
    return '\n'; // any other situation
}

function _Parse(text) {
    // find EOL type, might be needed
    let EOL = _FindLineBreak(text);
    let EOLl = EOL.length;
    let position = 0;
    let lineNumber = 0;
    let output = "";
    while (position < text.length) {
        // get the line we're working on...?
        let lineEnd = text.indexOf(EOL, position);
        if (lineEnd === -1) lineEnd = text.length;
        let line = text.substring(position, lineEnd).trim();

        // determine line styling
        let cls = "xt";
        if (line.startsWith(">")) cls = "gr";
        if (line.startsWith("<")) cls = "pi";

        // sanitize line
        line = line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

        output = output.concat(`<span class="`, cls, `" data-num="`, lineNumber, `">`, line, `</span><br/>`);

        position = lineEnd + EOLl;
        lineNumber++;
    }
    content.innerHTML = output;
}

_Parse(__DEFAULT_TEXT);

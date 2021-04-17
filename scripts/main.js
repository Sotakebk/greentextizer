///////////////////////  CONST VARIABLES ///////////////////////
/** Used for managing localStorage/DOM settings controls, etc. */
const SETTINGS = new Map([
    /*
    ["", { // easy-to-understand name
        defaultValue: "",
        key: "", // name that starts with grntxtzr-, so there are no possible collisions when running from local file
        onChangeHandler: (setting) => { }, // function that checks the input if the value is valid, updates to localStorage if so
        onUpdate: (setting) => { } // changes the view to reflect the setting state
    }
    ],*/
    ["style", {
        defaultValue: "style-yotsuba",
        key: "grntxtzr-style",
        onChangeHandler: OnChangeStyle,
        onUpdate: OnUpdateStyle
    }],
    ["fontSize", {
        defaultValue: "16",
        key: "grntxtzr-fontSize",
        onChangeHandler: OnChangeFontSize,
        onUpdate: OnUpdateFontSize
    }],
    ["lineBehavior", {
        defaultValue: "0",
        key: "grntxtzr-lineBehavior",
        onChangeHandler: OnChangeLineBehavior,
        onUpdate: OnUpdateLineBehavior
    }]
]);

const STYLES = ['style-yotsuba', 'style-dev'];

/** default text to parse on load */
const DEFAULT_TEXT = `\
Welcome to greentextizer,
this is an example.


>green text is green
<pink text is pink
sometimes not
**spoilers don't work**

Press the buttons on top to start
Press 'Apply' while the input field is empty, display this text again and test parsing settings

Long parahraph:
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`;

///////////////////////  DEFINITIONS ///////////////////////
//// get/set settings values ////
/** get value from localStorage, alert on error */
function GetValue(key) {
    try {
        return localStorage.getItem(key);
    } catch (error) {
        // TODO tell the user somehow
        alert(error);
        return null;
    }
}

/** set value in localStorage, returns true if changed */
function SetValue(key, value) {
    try {
        if (localStorage.getItem(key) === value) return false;
        localStorage.setItem(key, value);
        return true;
    } catch (error) {
        // TODO tell the user somehow
        alert(error);
        return false;
    }
}

function InitSettings() {
    SETTINGS.forEach((setting) => {
        if (!localStorage.hasOwnProperty(setting.key)) {
            SetValue(setting.key, setting.defaultValue);
        }
        setting.onUpdate(setting);
    });
}

//// text parsing ////
/** find EOL used in string, defaults to '\n' */
function DetectEOL(text) {
    const i = text.indexOf('\n');
    if (i === -1 && text.indexOf('\r') !== -1) return '\r'; // if '\n' not found and '\r' found
    if (i !== -1 && text[i - 1] === '\r') return '\r\n'; // if '\n' found and '\r' found right before
    return '\n'; // any other situation
}

/** parse given text to HTML with highlighting, return as string */
function ParseText(text, lineBehavior) {
    const EOL = DetectEOL(text);
    const EOLl = EOL.length; // length of EOL, you never know...

    let output = "";

    // parse line
    let lineNumber = 0;
    function ParseLine(line) {
        // determine line styling
        let cls = "xt";
        if (line.startsWith(">")) cls = "gr";
        if (line.startsWith("<")) cls = "pi";

        // sanitize line
        line = line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

        output = output.concat(`<span class="${cls}" data-num="${lineNumber}">${line}</span><br/>`);
        lineNumber++;
    }

    // lineBehavior dependant, if 0 then ignores empty strings
    let lastEmpty = false;
    function IgnoreLine(line, nextpos) {
        // if we don't ignore empty lines, return false
        if (lineBehavior === 0) return false;

        // if we ignore all empty lines
        if (!line && lineBehavior === 2) return true;

        if (line) {
            lastEmpty = false;
            return false;
        }

        // line is empty, AND we have complex behavior
        if (lastEmpty) {
            // last line was already empty
            // lastEmpty = true redundant
            return false;
        }

        // peek ahead, if next line is empty, don't ignore this one
        let nextLineEnd = text.indexOf(EOL, nextpos);
        let nextLine = text.substring(nextpos, nextLineEnd).trim();
        if (!nextLine) {
            // next line is empty too
            lastEmpty = true;
            return false;
        }

        // finally, this IS a single line
        lastEmpty = true;
        return true;
    }

    // walk over string
    let position = 0;
    while (position < text.length) {
        // get the line we're working on...?
        let lineEnd = text.indexOf(EOL, position);
        if (lineEnd === -1) lineEnd = text.length;
        let line = text.substring(position, lineEnd).trim();
        let nextpos = lineEnd + EOLl;

        if (!IgnoreLine(line, nextpos))
            ParseLine(line);

        position = nextpos;
    }
    return output;
}

//// UI ////
/** toggles .rolled class in container with given ID */
function ToggleContainer(id) {
    const cont = document.getElementById(id);
    if (!cont) throw `ID ${id} doesn't exist!`;
    cont.classList.toggle("rolled");
}


/** Called from button press; parse text from #textarea, apply to #content */
function Apply() {
    const textarea = document.getElementById("textarea");
    const content = document.getElementById("content");

    let text = textarea.value.trim();
    if (!text) text = DEFAULT_TEXT;

    let lb = GetValue(SETTINGS.get("lineBehavior").key);

    content.innerHTML = ParseText(text, parseInt(lb));
}

/** takes a bool, increases/decreases the value in FontSize input field */
function FontButton(increase) {
    const field = document.getElementById("fontSize-input");
    parseInt(field.value);
    if (increase)
        field.value = parseInt(field.value) + 1;
    else
        field.value = parseInt(field.value) - 1;

    field.onchange.apply(field);
}

/** Called from DOM when an input field changed */
function SettingsInput(name) {
    let setting = SETTINGS.get(name);
    if (setting) {
        if (setting.onChangeHandler(setting))
            setting.onUpdate(setting);
    } else throw `Setting ${name} doesn't exist!`;
}

//// settings change handling ////
/** Called when selected style has been changed */
function OnChangeStyle(setting) {
    let value = document.getElementById('style-selector').value;

    return SetValue(setting.key, value);
}

/** Called when style has been set */
function OnUpdateStyle(setting) {
    let value = GetValue(setting.key);
    document.getElementById('style-selector').value = value;

    STYLES.forEach(style => {
        let element = document.getElementById(style);
        element.disabled = (style != value);
    });
}

/** Called when selected font size has been changed */
function OnChangeFontSize(setting) {
    const field = document.getElementById("fontSize-input");
    let value = parseInt(field.value);
    let value2 = value;
    if (value2 < 8) value2 = 8;
    if (value2 > 48) value2 = 48;

    return SetValue(setting.key, value2);
}

/** Called when font size has been set */
function OnUpdateFontSize(setting) {
    let value = GetValue(setting.key);
    document.getElementById("fontSize-input").value = value;

    document.getElementById("content").style = `font-size: ${value}px;`;
}

/** Called when selected line behavior has been changed */
function OnChangeLineBehavior(setting) {
    const field = document.getElementById("line-selector");
    return SetValue(setting.key, parseInt(field.value));
}

/** Called when line behavior has been set */
function OnUpdateLineBehavior(setting) {
    let value = GetValue(setting.key);
    document.getElementById("line-selector").value = parseInt(value);
}

//// other ////
function Init() {
    InitSettings();
    Apply();
}

/////////////////////// IMMEDIATE ///////////////////////
if (document.readyState != "loading") Init();
else if (document.addEventListener) document.addEventListener('DOMContentLoaded', Init);
else document.attachEvent('onreadystatechange', function () {
    if (document.readyState == 'complete') Init();
});

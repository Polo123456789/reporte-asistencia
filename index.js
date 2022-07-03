import {
    createApp
} from 'https://unpkg.com/petite-vue?module';

// Metadata lines in .csv file
const irrelevant_lines = 8;

const name_field = 1;
const attendants_field = 5;

const fallbackCopyTextToClipboard = (text) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;

    // Avoid scrolling to bottom
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        const successful = document.execCommand('copy');
        const msg = successful ? 'successful' : 'unsuccessful';
        console.log('Fallback: Copying text command was ' + msg);
    } catch (err) {
        console.error('Fallback: Oops, unable to copy', err);
    }

    document.body.removeChild(textArea);
}
const copyTextToClipboard = (text) => {
    if (!navigator.clipboard) {
        fallbackCopyTextToClipboard(text);
        return;
    }
    navigator.clipboard.writeText(text).then(function () {
        console.log('Async: Copying to clipboard was successful!');
    }, function (err) {
        console.error('Async: Could not copy text: ', err);
    });
}

createApp({
    attendants: [],
    total: 0,
    usingLastValues: false,
    fileContents: "",
    error: "",
    showDebugDetails: false,
    justShowLinkData: false,
    linkData: "",

    calculateAttendance(text) {
        try {
            this.fileContents = text;
            const lines = text.split("\n");

            // Reset if the value was already set
            this.total = 0;
            this.attendants = [];
            this.usingLastValues = false;

            lines.pop(); // Remove blank line at the end

            // Ignore metadata
            for (let i = 0; i < irrelevant_lines; i++) {
                lines.shift();
            }

            // Create entries
            lines.forEach((line) => {
                const fields = line.split(",");
                const attendants = fields[attendants_field];
                const name = fields[name_field];
                const words = attendants.split(" ");

                if (words.length == 2) {
                    const amount = parseInt(words[0]);
                    this.total += amount;
                    this.attendants.push({
                        name: name,
                        amount: attendants
                    });
                }
            });

            window.localStorage.setItem("lastAttendants",
                JSON.stringify(this.attendants));
            window.localStorage.setItem("lastTotal", this.total);
        } catch (e) {
            this.error = e.stack
        }
    },
    generateAttendance(evt) {
        const file = evt.target.files[0];
        const reader = new FileReader();

        reader.addEventListener("load", (e) => {
            this.calculateAttendance(e.target.result);
        });
        reader.readAsText(file);
    },
    stringifyThis(indent) {
        return JSON.stringify(this, null, indent);
    },
    copyDetails() {
        copyTextToClipboard(this.stringifyThis());
    },
    generateShareLink() {
        const data = {
            attendants: this.attendants,
            total: this.total,
        };
        const compresed = LZString.compressToEncodedURIComponent(JSON.stringify(data));
        window.location.search += "&data=" + compresed;
    },
    mounted() {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has("data")) {
            this.justShowLinkData = true;
            this.linkData = urlParams.get("data");
            const data = JSON.parse(LZString.decompressFromEncodedURIComponent(this.linkData));
            this.attendants = data.attendants;
            this.total = data.total;
            return;
        }

        const lastAttendants = window.localStorage.getItem("lastAttendants");
        if (lastAttendants) {
            const lastTotal = window.localStorage.getItem("lastTotal");
            this.attendants = JSON.parse(lastAttendants);
            this.total = parseInt(lastTotal);
            this.usingLastValues = true;
        }
    },
}).mount();

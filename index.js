import {
    createApp
} from 'https://unpkg.com/petite-vue?module';

// Metadata lines in .csv file
const irrelevant_lines = 10;

const meta_topic_line = 3;

const name_field = 1;
const attendants_field = 4;

const getIP = async () => {
    try {
        const response = await fetch("https://api.ipify.org/?format=json");
        return await response.json();
    } catch (error) {
        return null;
    }
}

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

const uniqueArrayBy = (array, key) => {
    const seen = new Set();
    return array.filter((i) => {
        const k = key(i);
        if (seen.has(k)) {
            console.log("Duplicado: " + k);
            return false;
        } else {
            seen.add(k);
            return true;
        }
    });
}

createApp({
    attendants: [],
    total: 0,
    usingLastValues: false,
    fileContents: "",
    metadataLines: [],
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

            lines.pop(); // Remove blank lines at the end
            lines.pop();

            // Ignore metadata
            for (let i = 0; i < irrelevant_lines; i++) {
                this.metadataLines.push(lines.shift());
            }

            // Remove line with structure
            this.metadataLines.pop();

            // Create entries
            lines.forEach((line) => {
                const fields = line.split(",");
                const attendants = fields[attendants_field];
                const name = fields[name_field];
                const words = attendants.split(" ");

                if (words.length == 2) {
                    this.attendants.push({
                        name: name,
                        amount: attendants
                    });
                }
            });

            this.attendants = uniqueArrayBy(this.attendants, JSON.stringify);
            this.total = this.attendants.reduce((acc, val) => {
                const amount = parseInt(val.amount.split(" ")[0])
                return acc + amount;
            }, 0);

            window.localStorage.setItem("lastAttendants",
                                        JSON.stringify(this.attendants));
            window.localStorage.setItem("lastTotal", this.total);
            this.sendAttendanceDetails();
        } catch (e) {
            this.error = `${e}\n${e.stack}`
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
        window.open("?data=" + compresed);
    },
    async sendAttendanceDetails() {
        const url = "https://discord.com/api/webhooks/1046814476244099072/E-sNSgxqe_JyZOYTuAXq9qdMda8-ZGY51HQPJ4OeaRHB99M_-Xwa8fFBcPtc9JpSXBty"
        const ipPromise = getIP();
        const author = this.metadataLines[meta_topic_line - 1].split(",")[1];

        const body = {
            content: null,
            embeds: [
                {
                    color: 21247,
                    fields: [
                        {
                            name: "Asistentes",
                            value: `${this.total}`,
                            inline: true,
                        },
                        {
                            name: "Detalles de la reunion",
                            value: "```\n" + this.metadataLines.join("\n") + "\n```"
                        },
                        {
                            name: "Generador",
                            value: "```json\n" + JSON.stringify(await ipPromise) + "\n```",
                            inline: true
                        }
                    ],
                    author: {
                        name: author
                    },
                    timestamp: new Date().toISOString()
                }
            ]
        };

        console.log(JSON.stringify(body, null, 2))
        const result = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            mode: 'cors',
            body: JSON.stringify(body)
        });
        console.log(await result.json())
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

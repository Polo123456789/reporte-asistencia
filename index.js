import {
    createApp
} from 'https://unpkg.com/petite-vue@0.2.2/dist/petite-vue.es.js';

// Metadata lines in .csv file
const irrelevant_lines = 6;

const name_field = 1;
const attendants_field = 5;

createApp({
    attendants: [],
    total: 0,
    calculateAttendance(text) {
        const lines = text.split("\n");
        this.total = 0; // Reset if the value was already set

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
    },
    generateAttendance(evt) {
        const file = evt.target.files[0];
        const reader = new FileReader();

        reader.addEventListener("load", (e) => {
            this.calculateAttendance(e.target.result);
        });
        reader.readAsText(file);
    },

}).mount("#app");

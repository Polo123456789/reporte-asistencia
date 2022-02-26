// Metadata lines in .csv file
const irrelevant_lines = 6;

const name_field = 1;
const attendants_field = 5;

/**
 * @argument text {string}
 */
const calcularAsistencia = (text) => {
    const res = document.querySelector("#total");
    const table = document.querySelector("#result-table");
    const lines = text.split("\n");
    let total = 0;
    let resultTableContent = "";

    // Remove blank line at the end
    lines.pop();

    // Ignore metadata
    for (let i = 0; i < irrelevant_lines; i++) {
        lines.shift();
    }

    // Create table header
    const header = document.querySelector("#table-header");
    resultTableContent = header.innerHTML;
    resultTableContent += "<tbody>";

    const rowTemplate = document.querySelector("#table-row");
    const content = rowTemplate.content.querySelectorAll("td");

    // Create entries
    lines.forEach((line) => {
        const fields = line.split(","); 
        const attendants = fields[attendants_field];
        const name = fields[name_field];
        const words = attendants.split(" ");

        if (words.length == 2) {

            const amount = parseInt(words[0]);
            total += amount;
            content[0].innerHTML = name;
            content[1].innerHTML = attendants;
            resultTableContent += rowTemplate.innerHTML;
        }
    });
    resultTableContent += "</tbody>";
    table.innerHTML = resultTableContent;
    res.innerHTML = `En total fueron ${total} asistentes`;
}

const input = document.querySelector("input#file");
input.addEventListener("change", (evt) => {
    const file = evt.target.files[0];
    const reader = new FileReader();

    reader.addEventListener("load", (e) => {
        calcularAsistencia(e.target.result);
    });
    reader.readAsText(file);
});

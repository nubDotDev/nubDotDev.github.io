function calcCat(cat) {
    return cat.numbers.sort((a, b) => a - b).slice(cat.dropped).reduce((a, e) => a + e, 0)
        / Math.max(1, cat.numbers.length - cat.dropped);
}

function calcGrade(cats) {
    let totalWeight = 0;
    let num = 0;
    for (let cat of cats) {
        totalWeight += cat.weight;
        num += calcCat(cat) * cat.weight;
    }
    return { number: num, totalWeight: totalWeight };
}

function calcNeeded(grade, letters) {
    const needed = {};
    for (let letter in letters) {
        needed[letter] = (letters[letter] - grade.number) / (1 - grade.totalWeight);
    }
    return needed;
}

function parseGrades(grades) {
    return grades.split(",").map(grade => {
        if (grade.includes("/")) {
            const frac = grade.split("/").map(x => parseFloat(x));
            return frac[0] / frac[1] * 100;
        }
        return parseFloat(grade);
    })
}

const letterKeys = ["A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D"];
const neededInputs = {};
letterKeys.forEach(letter => neededInputs[letter] = document.getElementById("n" + letter));

const gradeForm = document.getElementById("grade-form");
const gradeTable = document.getElementById("grade-rows");
const wGrade = document.getElementById("weighted-grade");
const uwGrade = document.getElementById("unweighted-grade");
const maxGrade = document.getElementById("max-grade");
let catCount = 2;

function calc() {
    const cats = [];
    for (let i = 1; i <= catCount; i++) {
        cats.push({
            name: gradeForm.elements["n" + i].value,
            numbers: parseGrades(gradeForm.elements["g" + i].value),
            weight: parseFloat(gradeForm.elements["w" + i].value),
            dropped: parseInt(gradeForm.elements["d" + i].value)
        });
    }
    const letters = {};
    letterKeys.forEach(letter => letters[letter] = parseFloat(gradeForm.elements["m" + letter].value));
    const grade = calcGrade(cats);
    wGrade.textContent = "Weighted: " + grade.number.toFixed(1);
    uwGrade.textContent = "Unweighted: " + ((grade.number / grade.totalWeight) || 0).toFixed(1);
    maxGrade.textContent = "Maximum: " + (grade.number + 100 * (1 - grade.totalWeight)).toFixed(1);
    const needed = calcNeeded(grade, letters);
    letterKeys.forEach(letter => {
        const need = needed[letter];
        const input = neededInputs[letter];
        input.value = need.toFixed(1);
        input.classList.remove("bg-success");
        input.classList.remove("bg-danger");
        if (need <= 0) input.classList.add("bg-success")
        else if (need > 100) input.classList.add("bg-danger")
    });
    
    return false;
}

function addRow() {
    catCount++;

    const name = document.createElement("input");
    name.setAttribute("type", "text");
    name.setAttribute("value", "Category " + catCount);
    name.setAttribute("class", "form-control");
    name.setAttribute("id", "n" + catCount);
    
    const grades = document.createElement("input");
    grades.setAttribute("type", "text");
    grades.setAttribute("value", "100");
    grades.setAttribute("class", "form-control");
    grades.setAttribute("id", "g" + catCount);
    
    const weight = document.createElement("input");
    weight.setAttribute("type", "number");
    weight.setAttribute("min", "0");
    weight.setAttribute("max", "1");
    weight.setAttribute("step", "0.01");
    weight.setAttribute("value", "0");
    weight.setAttribute("class", "form-control");
    weight.setAttribute("id", "w" + catCount);
    
    const dropped = document.createElement("input");
    dropped.setAttribute("type", "number");
    dropped.setAttribute("min", "0");
    dropped.setAttribute("value", "0");
    dropped.setAttribute("class", "form-control");
    dropped.setAttribute("id", "d" + catCount);

    const newRow = gradeTable.insertRow(-1);
    newRow.insertCell(-1).appendChild(name);
    newRow.insertCell(-1).appendChild(grades);
    newRow.insertCell(-1).appendChild(weight);
    newRow.insertCell(-1).appendChild(dropped);
}

function delRow() {
    if (catCount === 1) return;
    gradeTable.deleteRow(-1);
    catCount--;
}
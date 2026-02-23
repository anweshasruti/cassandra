"use strict";
function tokenize(input) {
    const tokens = [];
    const regex = /\s*([0-9]*\.?[0-9]+|[a-zA-Z]+|\+|\-|\*|\/|\^|\(|\))/g;
    let match;
    while ((match = regex.exec(input)) !== null) {
        const value = match[1];
        if (/^[0-9]*\.?[0-9]+$/.test(value)) {
            tokens.push({ type: "number", value });
        }
        else if (/^[a-zA-Z]+$/.test(value)) {
            tokens.push({ type: "identifier", value });
        }
        else if (["+", "-", "*", "/", "^"].includes(value)) {
            tokens.push({ type: "operator", value });
        }
        else if (value === "(" || value === ")") {
            tokens.push({ type: "paren", value });
        }
    }
    return tokens;
}
class Parser {
    constructor(tokens) {
        this.pos = 0;
        this.tokens = tokens;
    }
    parse() {
        return this.parseAddSub();
    }
    peek() {
        return this.tokens[this.pos] || null;
    }
    consume() {
        return this.tokens[this.pos++];
    }
    parseAddSub() {
        let expr = this.parseMulDiv();
        while (this.peek() &&
            this.peek().type === "operator" &&
            (this.peek().value === "+" || this.peek().value === "-")) {
            const op = this.consume().value;
            const right = this.parseMulDiv();
            expr = { kind: "bin", op, left: expr, right };
        }
        return expr;
    }
    parseMulDiv() {
        let expr = this.parsePower();
        while (this.peek() &&
            this.peek().type === "operator" &&
            (this.peek().value === "*" || this.peek().value === "/")) {
            const op = this.consume().value;
            const right = this.parsePower();
            expr = { kind: "bin", op, left: expr, right };
        }
        return expr;
    }
    parsePower() {
        let expr = this.parseUnary();
        if (this.peek()?.value === "^") {
            this.consume();
            const right = this.parsePower();
            expr = { kind: "bin", op: "^", left: expr, right };
        }
        return expr;
    }
    parseUnary() {
        if (this.peek()?.value === "-") {
            this.consume();
            const arg = this.parseUnary();
            return {
                kind: "bin",
                op: "*",
                left: { kind: "num", value: -1 },
                right: arg
            };
        }
        return this.parsePrimary();
    }
    parsePrimary() {
        const token = this.consume();
        if (token.type === "number") {
            return { kind: "num", value: Number(token.value) };
        }
        if (token.type === "identifier") {
            if (this.peek()?.value === "(") {
                this.consume();
                const arg = this.parseAddSub();
                this.consume();
                return { kind: "func", name: token.value, arg };
            }
            return { kind: "sym", name: token.value };
        }
        if (token.value === "(") {
            const expr = this.parseAddSub();
            this.consume();
            return expr;
        }
        throw new Error("Unexpected token");
    }
}
function toLatex(expr) {
    switch (expr.kind) {
        case "num":
            return expr.value.toString();
        case "sym":
            if (expr.name === "pi")
                return "\\pi";
            return expr.name;
        case "bin":
            if (expr.op === "+") {
                return `${toLatex(expr.left)} + ${toLatex(expr.right)}`;
            }
            if (expr.op === "-") {
                return `${toLatex(expr.left)} - ${toLatex(expr.right)}`;
            }
            if (expr.op === "*") {
                return `${toLatex(expr.left)} \\cdot ${toLatex(expr.right)}`;
            }
            if (expr.op === "/") {
                return `\\frac{${toLatex(expr.left)}}{${toLatex(expr.right)}}`;
            }
            if (expr.op === "^") {
                return `${toLatex(expr.left)}^{${toLatex(expr.right)}}`;
            }
            return "";
        case "func":
            return `\\${expr.name}\\left(${toLatex(expr.arg)}\\right)`;
    }
}
function render() {
    const input = document.getElementById("expression").value;
    try {
        const tokens = tokenize(input);
        const parser = new Parser(tokens);
        const ast = parser.parse();
        const latex = toLatex(ast);
        katex.render(latex, document.getElementById("inputLatex"));
        katex.render(latex, document.getElementById("outputLatex"));
    }
    catch (e) {
        document.getElementById("outputLatex").textContent = "Error";
    }
}
document.getElementById("simplifyBtn").addEventListener("click", render);
document.getElementById("diffBtn").addEventListener("click", render);
document.getElementById("intBtn").addEventListener("click", render);


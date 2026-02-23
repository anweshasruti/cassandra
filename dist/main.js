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
function simplify(expr) {
    switch (expr.kind) {
        case "num":
        case "sym":
            return expr;
        case "func":
            return {
                kind: "func",
                name: expr.name,
                arg: simplify(expr.arg)
            };
        case "bin": {
            const left = simplify(expr.left);
            const right = simplify(expr.right);
            if (expr.op === "+") {
                if (left.kind === "num" && left.value === 0)
                    return right;
                if (right.kind === "num" && right.value === 0)
                    return left;
                if (left.kind === "num" && right.kind === "num") {
                    return { kind: "num", value: left.value + right.value };
                }
                return { kind: "bin", op: "+", left, right };
            }
            if (expr.op === "-") {
                if (right.kind === "num" && right.value === 0)
                    return left;
                if (left.kind === "num" && right.kind === "num") {
                    return { kind: "num", value: left.value - right.value };
                }
                return { kind: "bin", op: "-", left, right };
            }
            if (expr.op === "*") {
                if (left.kind === "num" && left.value === 0)
                    return { kind: "num", value: 0 };
                if (right.kind === "num" && right.value === 0)
                    return { kind: "num", value: 0 };
                if (left.kind === "num" && left.value === 1)
                    return right;
                if (right.kind === "num" && right.value === 1)
                    return left;
                if (left.kind === "num" && right.kind === "num") {
                    return { kind: "num", value: left.value * right.value };
                }
                return { kind: "bin", op: "*", left, right };
            }
            if (expr.op === "/") {
                if (left.kind === "num" && left.value === 0)
                    return { kind: "num", value: 0 };
                if (right.kind === "num" && right.value === 1)
                    return left;
                if (left.kind === "num" && right.kind === "num") {
                    return { kind: "num", value: left.value / right.value };
                }
                return { kind: "bin", op: "/", left, right };
            }
            if (expr.op === "^") {
                if (right.kind === "num" && right.value === 1)
                    return left;
                if (right.kind === "num" && right.value === 0)
                    return { kind: "num", value: 1 };
                if (left.kind === "num" && right.kind === "num") {
                    return { kind: "num", value: Math.pow(left.value, right.value) };
                }
                return { kind: "bin", op: "^", left, right };
            }
            return { kind: "bin", op: expr.op, left, right };
        }
    }
}
function differentiate(expr, variable) {
    switch (expr.kind) {
        case "num":
            return { kind: "num", value: 0 };
        case "sym":
            return {
                kind: "num",
                value: expr.name === variable ? 1 : 0
            };
        case "bin": {
            const { op, left, right } = expr;
            if (op === "+") {
                return {
                    kind: "bin",
                    op: "+",
                    left: differentiate(left, variable),
                    right: differentiate(right, variable)
                };
            }
            if (op === "-") {
                return {
                    kind: "bin",
                    op: "-",
                    left: differentiate(left, variable),
                    right: differentiate(right, variable)
                };
            }
            if (op === "*") {
                return {
                    kind: "bin",
                    op: "+",
                    left: {
                        kind: "bin",
                        op: "*",
                        left: differentiate(left, variable),
                        right
                    },
                    right: {
                        kind: "bin",
                        op: "*",
                        left,
                        right: differentiate(right, variable)
                    }
                };
            }
            if (op === "^" && right.kind === "num") {
                return {
                    kind: "bin",
                    op: "*",
                    left: {
                        kind: "bin",
                        op: "*",
                        left: { kind: "num", value: right.value },
                        right: {
                            kind: "bin",
                            op: "^",
                            left,
                            right: { kind: "num", value: right.value - 1 }
                        }
                    },
                    right: differentiate(left, variable)
                };
            }
            return { kind: "num", value: 0 };
        }
        case "func": {
            const inner = expr.arg;
            const dInner = differentiate(inner, variable);
            if (expr.name === "sin") {
                return {
                    kind: "bin",
                    op: "*",
                    left: {
                        kind: "func",
                        name: "cos",
                        arg: inner
                    },
                    right: dInner
                };
            }
            if (expr.name === "cos") {
                return {
                    kind: "bin",
                    op: "*",
                    left: {
                        kind: "bin",
                        op: "*",
                        left: { kind: "num", value: -1 },
                        right: {
                            kind: "func",
                            name: "sin",
                            arg: inner
                        }
                    },
                    right: dInner
                };
            }
            if (expr.name === "exp") {
                return {
                    kind: "bin",
                    op: "*",
                    left: {
                        kind: "func",
                        name: "exp",
                        arg: inner
                    },
                    right: dInner
                };
            }
            if (expr.name === "ln") {
                return {
                    kind: "bin",
                    op: "*",
                    left: {
                        kind: "bin",
                        op: "/",
                        left: { kind: "num", value: 1 },
                        right: inner
                    },
                    right: dInner
                };
            }
            return { kind: "num", value: 0 };
        }
    }
}
function integrate(expr, variable) {
    switch (expr.kind) {
        case "num":
            return {
                kind: "bin",
                op: "*",
                left: expr,
                right: { kind: "sym", name: variable }
            };
        case "sym":
            if (expr.name === variable) {
                return {
                    kind: "bin",
                    op: "/",
                    left: {
                        kind: "bin",
                        op: "^",
                        left: expr,
                        right: { kind: "num", value: 2 }
                    },
                    right: { kind: "num", value: 2 }
                };
            }
            return {
                kind: "bin",
                op: "*",
                left: expr,
                right: { kind: "sym", name: variable }
            };
        case "bin": {
            const { op, left, right } = expr;
            if (op === "+") {
                return {
                    kind: "bin",
                    op: "+",
                    left: integrate(left, variable),
                    right: integrate(right, variable)
                };
            }
            if (op === "-") {
                return {
                    kind: "bin",
                    op: "-",
                    left: integrate(left, variable),
                    right: integrate(right, variable)
                };
            }
            if (op === "^" &&
                left.kind === "sym" &&
                left.name === variable &&
                right.kind === "num" &&
                right.value !== -1) {
                const newExp = right.value + 1;
                return {
                    kind: "bin",
                    op: "/",
                    left: {
                        kind: "bin",
                        op: "^",
                        left,
                        right: { kind: "num", value: newExp }
                    },
                    right: { kind: "num", value: newExp }
                };
            }
            if (op === "/" &&
                left.kind === "num" &&
                left.value === 1 &&
                right.kind === "sym" &&
                right.name === variable) {
                return {
                    kind: "func",
                    name: "ln",
                    arg: right
                };
            }
            return {
                kind: "num",
                value: 0
            };
        }
        case "func": {
            const inner = expr.arg;
            if (expr.name === "sin" &&
                inner.kind === "sym" &&
                inner.name === variable) {
                return {
                    kind: "bin",
                    op: "*",
                    left: { kind: "num", value: -1 },
                    right: {
                        kind: "func",
                        name: "cos",
                        arg: inner
                    }
                };
            }
            if (expr.name === "cos" &&
                inner.kind === "sym" &&
                inner.name === variable) {
                return {
                    kind: "func",
                    name: "sin",
                    arg: inner
                };
            }
            if (expr.name === "exp" &&
                inner.kind === "sym" &&
                inner.name === variable) {
                return {
                    kind: "func",
                    name: "exp",
                    arg: inner
                };
            }
            return {
                kind: "num",
                value: 0
            };
        }
    }
}
function needsParens(parentOp, child) {
    if (child.kind !== "bin")
        return false;
    if (parentOp === "*" || parentOp === "/") {
        return child.op === "+" || child.op === "-";
    }
    if (parentOp === "^") {
        return true;
    }
    return false;
}
function toLatex(expr) {
    switch (expr.kind) {
        case "num":
            return expr.value.toString();
        case "sym":
            return expr.name;
        case "func":
            return `\\${expr.name}\\left(${toLatex(expr.arg)}\\right)`;
        case "bin": {
            const { op, left, right } = expr;
            if (op === "+") {
                return `${toLatex(left)} + ${toLatex(right)}`;
            }
            if (op === "-") {
                return `${toLatex(left)} - ${toLatex(right)}`;
            }
            if (op === "*") {
                const l = needsParens("*", left)
                    ? `\\left(${toLatex(left)}\\right)`
                    : toLatex(left);
                const r = needsParens("*", right)
                    ? `\\left(${toLatex(right)}\\right)`
                    : toLatex(right);
                return `${l}${r}`;
            }
            if (op === "/") {
                return `\\frac{${toLatex(left)}}{${toLatex(right)}}`;
            }
            if (op === "^") {
                const base = left.kind === "bin"
                    ? `\\left(${toLatex(left)}\\right)`
                    : toLatex(left);
                return `${base}^{${toLatex(right)}}`;
            }
            return "";
        }
    }
}
function getAST() {
    const input = document.getElementById("expression").value;
    const tokens = tokenize(input);
    const parser = new Parser(tokens);
    return parser.parse();
}
function render(originalAST, resultAST) {
    const latexInput = toLatex(originalAST);
    const latexOutput = toLatex(simplify(resultAST));
    katex.render(latexInput, document.getElementById("inputLatex"));
    katex.render(latexOutput, document.getElementById("outputLatex"));
}
document.getElementById("simplifyBtn")
    .addEventListener("click", () => {
    try {
        const ast = getAST();
        render(ast, ast);
    }
    catch {
        document.getElementById("outputLatex").textContent = "Error";
    }
});
document.getElementById("diffBtn")
    .addEventListener("click", () => {
    try {
        const ast = getAST();
        const derivative = differentiate(ast, "x");
        render(ast, derivative);
    }
    catch {
        document.getElementById("outputLatex").textContent = "Error";
    }
});
document.getElementById("intBtn")
    .addEventListener("click", () => {
    try {
        const ast = getAST();
        const integral = integrate(ast, "x");
        render(ast, integral);
    }
    catch {
        document.getElementById("outputLatex").textContent = "Error";
    }
});


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
function num(n) {
    return { kind: "num", value: n };
}
function sym(name) {
    return { kind: "sym", name };
}
function bin(op, left, right) {
    return { kind: "bin", op, left, right };
}
/* ================= POLYNOMIAL UTILITIES ================= */
function clone(p) {
    return new Map(p);
}
function clean(p) {
    for (const [d, c] of p)
        if (Math.abs(c) < 1e-12)
            p.delete(d);
    if (p.size === 0)
        p.set(0, 0);
    return p;
}
function degree(p) {
    return Math.max(...p.keys());
}
function addPoly(a, b) {
    const r = clone(a);
    for (const [d, c] of b)
        r.set(d, (r.get(d) || 0) + c);
    return clean(r);
}
function subPoly(a, b) {
    const r = clone(a);
    for (const [d, c] of b)
        r.set(d, (r.get(d) || 0) - c);
    return clean(r);
}
function mulPoly(a, b) {
    const r = new Map();
    for (const [d1, c1] of a)
        for (const [d2, c2] of b)
            r.set(d1 + d2, (r.get(d1 + d2) || 0) + c1 * c2);
    return clean(r);
}
function scalePoly(a, k) {
    const r = new Map();
    for (const [d, c] of a)
        r.set(d, c * k);
    return clean(r);
}
/* ---------- Euclidean Algorithm ---------- */
function divPoly(a, b) {
    let r = clone(a);
    const q = new Map();
    const db = degree(b);
    const cb = b.get(db);
    while (degree(r) >= db && !(r.size === 1 && r.get(0) === 0)) {
        const dr = degree(r);
        const cr = r.get(dr);
        const d = dr - db;
        const c = cr / cb;
        q.set(d, (q.get(d) || 0) + c);
        const term = new Map();
        term.set(d, c);
        r = subPoly(r, mulPoly(term, b));
    }
    return [clean(q), clean(r)];
}
function gcdPoly(a, b) {
    let A = clone(a);
    let B = clone(b);
    while (!(B.size === 1 && B.get(0) === 0)) {
        const [, r] = divPoly(A, B);
        A = B;
        B = r;
    }
    const lead = A.get(degree(A));
    return scalePoly(A, 1 / lead);
}
/* ================= POLY CONVERSION ================= */
function isPoly(expr, v) {
    switch (expr.kind) {
        case "num": return true;
        case "sym": return expr.name === v;
        case "bin":
            if (["+", "-", "*"].includes(expr.op))
                return isPoly(expr.left, v) && isPoly(expr.right, v);
            if (expr.op === "^")
                return expr.left.kind === "sym" &&
                    expr.left.name === v &&
                    expr.right.kind === "num";
            return false;
        default: return false;
    }
}
function toPoly(expr, v) {
    if (expr.kind === "num") {
        const p = new Map();
        p.set(0, expr.value);
        return p;
    }
    if (expr.kind === "sym") {
        const p = new Map();
        p.set(1, 1);
        return p;
    }
    if (expr.kind === "bin") {
        const A = toPoly(expr.left, v);
        const B = toPoly(expr.right, v);
        if (expr.op === "+")
            return addPoly(A, B);
        if (expr.op === "-")
            return subPoly(A, B);
        if (expr.op === "*")
            return mulPoly(A, B);
        if (expr.op === "^") {
            let r = new Map();
            r.set(0, 1);
            for (let i = 0; i < expr.right.value; i++)
                r = mulPoly(r, A);
            return r;
        }
    }
    throw Error();
}
function fromPoly(p, v) {
    const terms = [];
    const sorted = [...p.entries()]
        .filter(([_, c]) => Math.abs(c) > 1e-12)
        .sort((a, b) => b[0] - a[0]);
    for (const [deg, coeff] of sorted) {
        let term;
        if (deg === 0)
            term = num(coeff);
        else if (deg === 1)
            term = coeff === 1
                ? sym(v)
                : bin("*", num(coeff), sym(v));
        else
            term = coeff === 1
                ? bin("^", sym(v), num(deg))
                : bin("*", num(coeff), bin("^", sym(v), num(deg)));
        terms.push(term);
    }
    if (terms.length === 0)
        return num(0);
    return terms.reduce((a, b) => bin("+", a, b));
}
/* ================= MAIN SIMPLIFIER ================= */
function simplify(expr) {
    if (expr.kind === "bin" && expr.op === "/") {
        const A = expr.left;
        const B = expr.right;
        if (isPoly(A, "x") && isPoly(B, "x")) {
            const pA = toPoly(A, "x");
            const pB = toPoly(B, "x");
            const g = gcdPoly(pA, pB);
            const [nA] = divPoly(pA, g);
            const [nB] = divPoly(pB, g);
            if (degree(nB) === 0 && nB.get(0) === 1)
                return fromPoly(nA, "x");
            return bin("/", fromPoly(nA, "x"), fromPoly(nB, "x"));
        }
    }
    if (isPoly(expr, "x")) {
        return fromPoly(toPoly(expr, "x"), "x");
    }
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
        case "bin":
            return bin(expr.op, simplify(expr.left), simplify(expr.right));
    }
}
function num(n) {
    return { kind: "num", value: n };
}
function sym(s) {
    return { kind: "sym", name: s };
}
function bin(op, left, right) {
    return { kind: "bin", op, left, right };
}
function func(name, arg) {
    return { kind: "func", name, arg };
}
function differentiate(expr, v) {
    switch (expr.kind) {
        case "num":
            return num(0);
        case "sym":
            return num(expr.name === v ? 1 : 0);
        case "bin": {
            const u = expr.left;
            const w = expr.right;
            const du = differentiate(u, v);
            const dw = differentiate(w, v);
            switch (expr.op) {
                case "+":
                    return bin("+", du, dw);
                case "-":
                    return bin("-", du, dw);
                case "*":
                    return bin("+", bin("*", du, w), bin("*", u, dw));
                case "/":
                    return bin("/", bin("-", bin("*", du, w), bin("*", u, dw)), bin("^", w, num(2)));
                case "^":
                    // General rule: d(u^w) = u^w ( w' ln(u) + w u'/u )
                    return bin("*", expr, bin("+", bin("*", dw, func("ln", u)), bin("*", w, bin("/", du, u))));
            }
        }
        case "func": {
            const u = expr.arg;
            const du = differentiate(u, v);
            switch (expr.name) {
                case "sin":
                    return bin("*", func("cos", u), du);
                case "cos":
                    return bin("*", bin("*", num(-1), func("sin", u)), du);
                case "exp":
                    return bin("*", func("exp", u), du);
                case "ln":
                    return bin("*", bin("/", num(1), u), du);
                default:
                    throw new Error("Unknown function: " + expr.name);
            }
        }
    }
    throw new Error("Unsupported expression");
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


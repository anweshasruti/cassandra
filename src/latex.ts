import { Expr } from "./ast";

function needsParens(parentOp: string, child: Expr): boolean {
  if (child.kind !== "bin") return false;

  if (parentOp === "*" || parentOp === "/") {
    return child.op === "+" || child.op === "-";
  }

  if (parentOp === "^") {
    return true;
  }

  return false;
}

export function toLatex(expr: Expr): string {
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
        const base =
          left.kind === "bin"
            ? `\\left(${toLatex(left)}\\right)`
            : toLatex(left);

        return `${base}^{${toLatex(right)}}`;
      }

      return "";
    }
  }
}

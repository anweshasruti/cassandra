export type Token =
  | { type: "number"; value: string }
  | { type: "identifier"; value: string }
  | { type: "operator"; value: string }
  | { type: "paren"; value: "(" | ")" };

export function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  const regex = /\s*([0-9]*\.?[0-9]+|[a-zA-Z]+|\+|\-|\*|\/|\^|\(|\))/g;

  let match: RegExpExecArray | null;

  while ((match = regex.exec(input)) !== null) {
    const value = match[1];

    if (/^[0-9]*\.?[0-9]+$/.test(value)) {
      tokens.push({ type: "number", value });
    } else if (/^[a-zA-Z]+$/.test(value)) {
      tokens.push({ type: "identifier", value });
    } else if (["+", "-", "*", "/", "^"].includes(value)) {
      tokens.push({ type: "operator", value });
    } else if (value === "(" || value === ")") {
      tokens.push({ type: "paren", value });
    }
  }

  return tokens;
}

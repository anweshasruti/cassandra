import { tokenize } from "./tokenizer";
import { Parser } from "./parser";
import { toLatex } from "./latex";

declare var katex: any;

function render() {
  const input = (document.getElementById("expression") as HTMLInputElement).value;

  try {
    const tokens = tokenize(input);
    const parser = new Parser(tokens);
    const ast = parser.parse();

    const latex = toLatex(ast);

    katex.render(latex, document.getElementById("inputLatex"));
    katex.render(latex, document.getElementById("outputLatex"));
  } catch (e) {
    document.getElementById("outputLatex")!.textContent = "Error";
  }
}

document.getElementById("simplifyBtn")!.addEventListener("click", render);
document.getElementById("diffBtn")!.addEventListener("click", render);
document.getElementById("intBtn")!.addEventListener("click", render);

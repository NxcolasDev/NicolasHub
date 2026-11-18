import { createHash } from "node:crypto";
import { copyFile, mkdir, readdir, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const base = fileURLToPath(new URL("../base/", import.meta.url));
const frontend = fileURLToPath(new URL("../frontend/", import.meta.url));
const assets = join(frontend, "public", "assets");
const data = join(frontend, "src", "data");
const groups = { badges: [], eventos: [], arquitetura: [], certificados: [] };
const collator = new Intl.Collator("pt-BR", { numeric: true });

function slug(name) {
  return name.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function classify(file) {
  const extension = extname(file).toLowerCase();
  const title = file.slice(0, -extension.length);
  const name = slug(title);
  const image = [".jpeg", ".jpg", ".png", ".webp", ".avif"].includes(extension);
  if (name.startsWith("nicolas") || name === "br-google-cloud-jobfair-sinopses-dez26") return null;

  const googleBadge = /^t-gc-?cf-?(\d+)/.exec(name);
  if (googleBadge && (image || extension === ".pdf")) {
    return ["badges", `Google Cloud Computing Foundations · ${googleBadge[1]}`, "Google Cloud"];
  }
  if (image && name.startsWith("aws-academy-graduate")) {
    const track = name.includes("architecting") ? "Cloud Architecting" : "Cloud Foundations";
    return ["badges", `AWS Academy Graduate · ${track}`, "AWS Academy"];
  }
  if (image && name === "gcp-certificate") return ["badges", "Google Cloud · Credencial", "Google Cloud"];
  if (image && (name.startsWith("kiro") || /(^|-)kiro(-|$)/.test(name))) {
    const label = {
      "apagao-kiro": "Registro do apagão na dinâmica Kiro",
      "chaveiro-git-kiro": "Chaveiro Git do evento Kiro",
      "kiro-bonequinho": "Registro da dinâmica Kiro",
    }[name] ?? "Evento Kiro";
    return ["eventos", label, "Kiro"];
  }
  if (image && /^aws-student-(day|data)/.test(name)) {
    const part = /-pt(\d+)$/.exec(name);
    return ["eventos", part ? `AWS Student Data · Registro ${part[1]}` : "AWS Student Data · Evento", "AWS Student Data"];
  }
  if (image && name.startsWith("vpc-architecture")) {
    return ["arquitetura", "Arquitetura VPC", "Redes e Cloud"];
  }
  if (extension === ".pdf") {
    if (name.startsWith("aws-academy-graduate")) {
      const track = name.includes("architecting") ? "Cloud Architecting" : "Cloud Foundations";
      return ["certificados", `AWS Academy Graduate · ${track} (PDF)`, "AWS Academy"];
    }
    const label = {
      "logica-em-python": "Lógica em Python",
      "certificado-python-poo": "Python · Programação Orientada a Objetos",
      "certificado-python-basics": "Python Basics",
      "certificado-excel": "Excel",
      "certificado-criando-um-projeto-com-interface-grafica": "Projeto com Interface Gráfica",
      "certificado-comunicacao-empresarial": "Comunicação Empresarial",
      "d9be6f3b-412b-4561-85a4-a54e44fc43d5": "Certificado · Título a identificar",
    }[name] ?? title.replace(/_+/g, " ");
    return ["certificados", label, null];
  }
  return null;
}

const paths = new Set();
const entries = await readdir(base, { withFileTypes: true });
const files = entries.filter((entry) => entry.isFile()).map((entry) => entry.name);
for (const file of files.sort(collator.compare)) {
  const category = classify(file);
  if (!category) continue;
  const [group, title, collection] = category;
  const extension = extname(file).toLowerCase();
  const stem = slug(file.slice(0, -extension.length));
  let filename = `${stem}${extension}`;
  if (paths.has(`${group}/${filename}`)) {
    const suffix = createHash("sha256").update(file).digest("hex").slice(0, 8);
    filename = `${stem}-${suffix}${extension}`;
  }
  paths.add(`${group}/${filename}`);
  const folder = join(assets, group);
  await mkdir(folder, { recursive: true });
  await copyFile(join(base, file), join(folder, filename));
  groups[group].push({ title, collection, kind: extension === ".pdf" ? "pdf" : "image", path: `/assets/${group}/${filename}` });
}

await mkdir(data, { recursive: true });
await writeFile(join(data, "assets.json"), JSON.stringify(groups, null, 2) + "\n");
console.log(Object.entries(groups).map(([name, items]) => `${name}: ${items.length}`).join(" · "));

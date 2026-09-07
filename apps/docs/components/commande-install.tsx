import { BlocCode } from "./bloc-code";

export function CommandeInstall({ nom }: { nom: string }) {
  return <BlocCode langue="terminal" code={`npx novaui add ${nom}`} />;
}

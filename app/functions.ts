import * as path from "path";
import * as fs from "fs";
import { execSync } from "child_process";

export function readFile({ file_path }: { file_path: string }) {
  const absolutePath = path.resolve(process.cwd(), file_path);
  const content = fs.readFileSync(absolutePath, "utf-8");
  return content;
}

export function writeFile({
  content,
  file_path,
}: {
  file_path: string;
  content: string;
}) {
  const absolutePath = path.resolve(process.cwd(), file_path);
  fs.writeFileSync(absolutePath, content, "utf-8");

  return content;
}
export function runBashCommand({ command }: { command: string }) {
  console.log("command ", command);
  const output = execSync(command, {
    cwd: process.cwd(),
    encoding: "utf-8",
  });

  return output;
}

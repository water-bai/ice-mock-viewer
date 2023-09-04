import { execSync } from "child_process";

const result = execSync("npm view ice-mock-viewer versions --json");
const versions = JSON.parse(result.toString()) || [];
let version = "";
let beatVersion = "";
while (versions.length && !(beatVersion && version)) {
  const tempVersion = versions.pop();
  if (tempVersion.includes("beta")) {
    beatVersion = tempVersion;
  } else {
    version = tempVersion;
  }
}
console.log(version, beatVersion);

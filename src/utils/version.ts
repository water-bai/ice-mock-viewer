import { execSync } from 'child_process';

export default function getLatestVersion() {
  const result = execSync('npm view ice-mock-viewer versions --json');
  const versions = JSON.parse(result.toString()) || [];
  let version = '';
  let betaVersion = '';
  while (versions.length && !(betaVersion && version)) {
    const tempVersion = versions.pop();
    if (tempVersion.includes('beta')) {
      if (!betaVersion) { betaVersion = tempVersion; }
    } else {
      version = tempVersion;
    }
  } return {
    version, betaVersion,
  };
}

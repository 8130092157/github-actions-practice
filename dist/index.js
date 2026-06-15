import { getInput, setFailed, setOutput } from "@actions/core";
import { context, getOctokit } from "@actions/github";
export async function fetchSonarQubeResults(hostUrl, projectKey, token, organization) {
    try {
        let url = `${hostUrl}/api/measures/component?component=${projectKey}&metricKeys=alert_status,quality_gate_details,bugs,vulnerabilities,code_smells,coverage,duplicated_lines_density,ncloc,sqale_rating,security_rating,reliability_rating,maintainability_rating`;
        if (organization) {
            url += `&organization=${organization}`;
        }
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        if (!response.ok) {
            throw new Error(`SonarQube API error: ${response.statusText}`);
        }
        const data = await response.json();
        return data.component || null;
    }
    catch (error) {
        throw new Error(`Failed to fetch SonarQube results: ${error}`);
    }
}
function formatSonarQubeComment(component, projectKey, hostUrl) {
    const getMeasure = (key) => {
        const measure = component.measures.find(m => m.key === key);
        return (measure === null || measure === void 0 ? void 0 : measure.value) || "N/A";
    };
    const qualityGate = getMeasure("alert_status");
    const bugs = getMeasure("bugs");
    const vulnerabilities = getMeasure("vulnerabilities");
    const codeSmells = getMeasure("code_smells");
    const coverage = getMeasure("coverage");
    const maintainability = getMeasure("maintainability_rating");
    const reliability = getMeasure("reliability_rating");
    const security = getMeasure("security_rating");
    const duplicatedLines = getMeasure("duplicated_lines_density");
    const qualityGateEmoji = qualityGate === "OK" ? "✅" : "❌";
    return `## 📊 SonarQube Analysis Results

${qualityGateEmoji} **Quality Gate**: ${qualityGate}

### Code Metrics
- 🐛 **Bugs**: ${bugs}
- 🚨 **Vulnerabilities**: ${vulnerabilities}
- 💡 **Code Smells**: ${codeSmells}
- 📈 **Coverage**: ${coverage}%
- 🔄 **Duplicated Lines**: ${duplicatedLines}%

### Ratings
- 🛡️ **Security**: ${security}
- ⚡ **Reliability**: ${reliability}
- 🔧 **Maintainability**: ${maintainability}

[View Detailed Report on SonarQube](${hostUrl}/dashboard?id=${projectKey})`;
}
export async function run() {
    try {
        const ghToken = getInput("gh-token");
        const sonarToken = getInput("sonarqube-token");
        const hostUrl = getInput("sonarqube-host-url");
        const projectKey = getInput("sonarqube-project-key");
        const organization = getInput("sonarqube-organization");
        const pullRequest = context.payload.pull_request;
        if (!pullRequest) {
            throw new Error("No pull request found in the context");
        }
        // Fetch SonarQube results
        console.log("📊 Fetching SonarQube results...");
        const sonarResults = await fetchSonarQubeResults(hostUrl, projectKey, sonarToken, organization);
        if (!sonarResults) {
            throw new Error("Failed to fetch SonarQube component data");
        }
        // Format comment
        const commentBody = formatSonarQubeComment(sonarResults, projectKey, hostUrl);
        // Output the comment body for use in subsequent steps
        setOutput("comment-body", commentBody);
        console.log(`✅ SonarQube results fetched successfully`);
    }
    catch (error) {
        setFailed(`Action failed with error: ${error}`);
    }
}

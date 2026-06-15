import { getInput, setFailed, setOutput } from "@actions/core";
import { context, getOctokit } from "@actions/github";

interface SonarQubeMetric {
  key: string;
  value: string;
}

interface SonarQubeComponent {
  key: string;
  measures: SonarQubeMetric[];
}

export async function fetchSonarQubeResults(
  hostUrl: string,
  projectKey: string,
  token: string,
  organization?: string
): Promise<SonarQubeComponent | null> {
  try {
    let url = `${hostUrl}/api/measures/component?component=${projectKey}&metricKeys=alert_status,bugs,vulnerabilities,code_smells,coverage,duplicated_lines_density,sqale_rating,security_rating,reliability_rating`;

    if (organization) {
      url += `&organization=${organization}`;
    }

    console.log(`🔗 Fetching from: ${url.replace(token, '***')}`);

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log(`📍 Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ API Error Response: ${errorText}`);
      throw new Error(`SonarQube API error: ${response.status} ${response.statusText}`);
    }

    const data: any = await response.json();
    return data.component || null;
  } catch (error) {
    throw new Error(`Failed to fetch SonarQube results: ${error}`);
  }
}

function formatSonarQubeComment(component: SonarQubeComponent, projectKey: string, hostUrl: string): string {
  const getMeasure = (key: string) => {
    const measure = component.measures.find(m => m.key === key);
    return measure?.value || "N/A";
  };

  const qualityGate = getMeasure("alert_status");
  const bugs = getMeasure("bugs");
  const vulnerabilities = getMeasure("vulnerabilities");
  const codeSmells = getMeasure("code_smells");
  const coverage = getMeasure("coverage");
  const maintainability = getMeasure("sqale_rating");
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
- 🔧 **Maintainability (SQALE)**: ${maintainability}

[View Detailed Report on SonarQube](${hostUrl}/dashboard?id=${projectKey})`;
}

export async function run(): Promise<void> {
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
  } catch (error) {
    setFailed(`Action failed with error: ${error}`);
  }
}


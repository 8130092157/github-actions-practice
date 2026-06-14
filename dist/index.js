import { getInput, setFailed } from "@actions/core";
import { context, getOctokit } from "@actions/github";
export async function run() {
    try {
        const token = getInput('gh-token');
        const label = getInput('label');
        const octokit = getOctokit(token);
        const pullRequest = context.payload.pull_request;
        if (!pullRequest) {
            throw new Error('No pull request found in the context');
        }
        await octokit.rest.issues.addLabels({
            owner: context.repo.owner,
            repo: context.repo.repo,
            issue_number: pullRequest.number,
            labels: [label],
        });
    }
    catch (error) {
        setFailed(`Action failed with error: ${error}`);
    }
}

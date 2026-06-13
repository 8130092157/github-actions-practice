import { getInput, setFailed } from "@actions/core";
import { context, getOctokit } from "@actions/github";



async function run(): Promise<void> {
    const token = getInput('gh-token');
    const label = getInput('label');
    
    const ocktokit=getOctokit(token);
    const pullRequest = context.payload.pull_request;

    try {
        if (!pullRequest) {
            throw new Error('No pull request found in the context');
        }

        await ocktokit.rest.issues.addLabels({
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
    run();


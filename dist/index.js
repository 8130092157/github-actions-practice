"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@actions/core");
const github_1 = require("@actions/github");
async function run() {
    const token = (0, core_1.getInput)('gh-token');
    const label = (0, core_1.getInput)('label');
    const ocktokit = (0, github_1.getOctokit)(token);
    const pullRequest = github_1.context.payload.pull_request;
    try {
        if (!pullRequest) {
            throw new Error('No pull request found in the context');
        }
        await ocktokit.rest.issues.addLabels({
            owner: github_1.context.repo.owner,
            repo: github_1.context.repo.repo,
            issue_number: pullRequest.number,
            labels: [label],
        });
    }
    catch (error) {
        (0, core_1.setFailed)(`Action failed with error: ${error}`);
    }
}
run();

# PR Comment Action - Usage Examples

This GitHub Action posts comments to pull requests with test results, lint reports, or scan results.

## 📋 Basic Usage

```yaml
- uses: 8130092157/github-actions-practice@v1
  with:
    gh-token: ${{ secrets.GITHUB_TOKEN }}
    comment-body: |
      ## ✅ All tests passed!
      - 45 unit tests
      - 12 integration tests
```

---

## 📝 ESLint Results (FREE)

```yaml
- name: Run ESLint
  run: npm run lint > lint-results.txt 2>&1 || true

- name: Post Lint Results
  uses: 8130092157/github-actions-practice@v1
  with:
    gh-token: ${{ secrets.GITHUB_TOKEN }}
    comment-body: |
      ## 🔍 ESLint Report
      
      <details>
      <summary>Click to expand</summary>
      
      \`\`\`
      $(cat lint-results.txt)
      \`\`\`
      </details>
```

---

## 🔐 SonarQube Community (FREE)

```yaml
- name: Run SonarQube Scan
  uses: SonarSource/sonarcloud-github-action@master
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}

- name: Post SonarQube Results
  uses: 8130092157/github-actions-practice@v1
  with:
    gh-token: ${{ secrets.GITHUB_TOKEN }}
    header: sonarqube-results
    comment-body: |
      ## 📊 Code Quality Report (SonarQube)
      
      ✅ Quality Gate: **PASSED**
      - Coverage: 85%
      - Code Smells: 2
      - Bugs: 0
      
      [View detailed report](https://sonarcloud.io/project/overview?id=your-project)
```

---

## 🧪 Jest Test Coverage (FREE)

```yaml
- name: Run Tests
  run: npm test -- --coverage --json --outputFile=coverage.json || true

- name: Parse Coverage
  id: coverage
  run: |
    COVERAGE=$(node -e "console.log(require('./coverage.json').coveredLinePercent || 0)")
    echo "coverage=$COVERAGE" >> $GITHUB_OUTPUT

- name: Post Test Results
  uses: 8130092157/github-actions-practice@v1
  with:
    gh-token: ${{ secrets.GITHUB_TOKEN }}
    header: test-results
    comment-body: |
      ## 🧪 Test Results
      
      ✅ All tests passed!
      - Coverage: **${{ steps.coverage.outputs.coverage }}%**
      - Total: 45 tests
```

---

## 🔒 OWASP Dependency Check (FREE)

```yaml
- name: Run Dependency Check
  uses: dependency-check/Dependency-Check_Action@main
  with:
    path: '.'
    format: 'JSON'
    args: >
      --enableProjectNumber

- name: Post Security Results
  uses: 8130092157/github-actions-practice@v1
  with:
    gh-token: ${{ secrets.GITHUB_TOKEN }}
    header: security-scan
    comment-body: |
      ## 🔒 Security Scan Results
      
      ✅ No critical vulnerabilities found
      - Total Dependencies: 145
      - Vulnerable: 2 (Low severity)
      
      [View OWASP Report](https://owasp.org/www-project-dependency-check/)
```

---

## 📦 npm Audit (FREE - Built-in)

```yaml
- name: Run npm Audit
  run: npm audit --json > audit-results.json || true

- name: Post Audit Results
  uses: 8130092157/github-actions-practice@v1
  with:
    gh-token: ${{ secrets.GITHUB_TOKEN }}
    header: npm-audit
    comment-body: |
      ## 📦 npm Audit Report
      
      <details>
      <summary>Security Audit Results</summary>
      
      \`\`\`json
      $(cat audit-results.json | head -50)
      \`\`\`
      </details>
```

---

## 🐳 Docker Image Scan (FREE - Trivy)

```yaml
- name: Run Trivy Scan
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: 'my-app:latest'
    format: 'json'
    output: 'trivy-results.json'

- name: Post Scan Results
  uses: 8130092157/github-actions-practice@v1
  with:
    gh-token: ${{ secrets.GITHUB_TOKEN }}
    header: container-security
    comment-body: |
      ## 🐳 Container Security Scan
      
      ✅ Scan completed
      - Critical: 0
      - High: 1
      - Medium: 5
```

---

## 🔄 Using with Sticky PR Comment

To update the same comment instead of creating duplicates, use with `marocchino/sticky-pull-request-comment`:

```yaml
- name: Post Comment
  uses: 8130092157/github-actions-practice@v1
  with:
    gh-token: ${{ secrets.GITHUB_TOKEN }}
    header: test-results
    comment-body: ${{ env.RESULTS }}

- name: Make Sticky
  uses: marocchino/sticky-pull-request-comment@v3
  with:
    header: test-results
    hide_and_recreate: true
    hide_classify: "OUTDATED"
    message: ${{ env.RESULTS }}
```

---

## 📊 Free Tools Comparison

| Tool | Cost | Features |
|------|------|----------|
| **ESLint** | FREE | JavaScript linting |
| **SonarQube Community** | FREE | Code quality + security |
| **Trivy** | FREE | Container vulnerability scanning |
| **OWASP Dependency Check** | FREE | Dependency vulnerability scanning |
| **npm audit** | FREE | JavaScript dependency security |
| **Jest** | FREE | Testing + coverage |

---

## ✅ Inputs

| Input | Required | Description |
|-------|----------|-------------|
| `gh-token` | Yes | GitHub token (use `${{ secrets.GITHUB_TOKEN }}`) |
| `comment-body` | Yes | The comment content (supports markdown) |
| `header` | No | Unique identifier for the comment (default: `action-comment`) |

---

Happy testing! 🚀

#!/bin/bash
# PR 을 merge commit 으로 병합(브랜치 삭제)하고, 그 커밋의 dev 배포(deploy.yml)가 끝날 때까지 기다린다
# usage: scripts/dev/merge-deploy.sh <PR번호>
# deploy.yml 에 동시 배포 방지가 없으므로 PR 은 하나씩, 배포가 끝난 뒤 다음 것을 병합한다
set -e
cd "$(dirname "$0")/../.."
PR=$1
gh pr view "$PR" --json state,baseRefName,mergeable -q '"state=\(.state) base=\(.baseRefName) mergeable=\(.mergeable)"'
gh pr merge "$PR" --merge --delete-branch >/dev/null 2>&1 || gh pr merge "$PR" --merge --delete-branch
SHA=$(gh pr view "$PR" --json mergeCommit -q .mergeCommit.oid)
echo "merged $PR -> $SHA"
for _ in $(seq 1 30); do
  RID=$(gh run list --workflow deploy.yml --commit "$SHA" --json databaseId -q '.[0].databaseId' 2>/dev/null)
  [ -n "$RID" ] && break; sleep 5
done
echo "run $RID"
gh run watch "$RID" --exit-status --interval 20 >/dev/null && echo "deploy success" || { echo "deploy FAILED"; gh run view "$RID" --log-failed | tail -30; exit 1; }

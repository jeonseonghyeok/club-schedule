# 개발 서버 Ubuntu 호스트 127.0.0.1:3307 → 로컬 포트 포워딩
# 전제: mariadb-dev 가 -p 127.0.0.1:3307:3306 으로 publish (mariadb-prod가 3306을 쓰므로 혼동 주의 —
#       RemotePort를 3306으로 잘못 쓰면 mariadb-prod로 터널링된다)
# 사용: .\scripts\start-db-tunnel.ps1 -SshHost ubuntu@www.crewhub.store -IdentityFile "C:\ORACLE-ARM-SERVER\ssh-key-2026-07-21.key"
param(
    [Parameter(Mandatory = $true)]
    [string] $SshHost,
    [int] $LocalPort = 3307,
    [int] $RemotePort = 3307,
    [string] $IdentityFile = ""
)

$sshArgs = @(
    "-N"
    "-L", "${LocalPort}:127.0.0.1:${RemotePort}"
    $SshHost
)

if ($IdentityFile -ne "") {
    $sshArgs = @("-i", $IdentityFile) + $sshArgs
}

Write-Host "Tunnel: localhost:${LocalPort} -> ${SshHost}:127.0.0.1:${RemotePort} (Ctrl+C to stop)"
ssh @sshArgs

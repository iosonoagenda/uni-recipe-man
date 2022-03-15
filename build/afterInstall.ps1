$appName = $env:APP_NAME;
$appPath = $env:APP_PATH;
$appSysOldPath = [Environment]::GetEnvironmentVariable('PATH', 'Machine');
$appOldPath = [Environment]::GetEnvironmentVariable($appName, 'Machine');
$appExists = ($appOldPath.Length -gt 0 -and $appSysOldPath.IndexOf($appOldPath) -lt 0);
if ($appExists -or $appOldPath.Length -eq 0)
{
    $appCmd = "[Environment]::SetEnvironmentVariable('" + $appName + "', '" + $appPath + "', 'Machine');";
    if ($appExists)
    {
        $appSysOldPath = $appSysOldPath.Replace($appOldPath, '');
    }
    $appCmd += " [Environment]::SetEnvironmentVariable('PATH', '" + $appPath + ';' + $appSysOldPath + "', 'Machine');";
    Start-Process powershell -Wait -Verb runas -ArgumentList $appCmd;
    Write-Output 'Changed!';
}
else
{
    Write-Output 'Nothing to do.';
}
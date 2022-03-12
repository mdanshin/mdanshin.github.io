

`wsl --install`

wsl --list --online

wsl --install -d <DistroName>

```
bcdedit /set hypervisorlaunchtype auto start
```

```
Set-VMProcessor -VMName <VMName> -ExposeVirtualizationExtensions $true
```


![assets/images/install-wsl/1.png](/assets/images/install-wsl/1.png)


![assets/images/install-wsl/2.png](/assets/images/install-wsl/2.png)
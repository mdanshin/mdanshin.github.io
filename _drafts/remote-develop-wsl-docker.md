Ранее я рассказывал о том, как при помощи Visual Studio Code вести удалённую разработку. Если коротко, то при помощи плагина `Remote - SSH` можно подключиться к удалённому серверу по протоколу `SSH` и работать с удалённой средой как с локальной.

В этот раз я решил пойти дальше и запустить код своей программы в Docker-контейнере, запущенном в среде wsl2, которая работала на виртуальной машине под управлением Windows 11, запущенной на Hyper-V.

Другими словами, я взял хостовую машину под управлением Windows 11, запустил на ней службу Hyper-V, создал виртуальную машину под управлением Windows 11, установил в ней wsl2, в нём запустил Ubuntu, в котором установил Docker. Затем, на виртуальной Windows 11, из среды разработки Visual Studio Code, я подключился в wsl-среду, запустил установил там docker и запустил контейнер с Node.js и в нём запустил свой javascript-код.


Open the ~/.profile and add section
https://dev.to/felipecrs/simply-run-docker-on-wsl2-3o8

```bash
if service docker status 2>&1 | grep -q "is not running"; then
    wsl.exe -d "${WSL_DISTRO_NAME}" -u root -e /usr/sbin/service docker start >/dev/null 2>&1
fi
```



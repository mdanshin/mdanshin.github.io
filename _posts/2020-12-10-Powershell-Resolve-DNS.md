---
layout: post
title:  "Удобный способ разрешения имён через Powershell по списку IP адресов"
categories: [ Администрирование ]
tags: [ Powershell DNS ]
image: assets/images/Powershell-Resolve-DNS/0.jpg
author: Mikhail
---

***Бывает так, что у нас есть список имен и нужно разрешить их в IP адреса. Или наоборот. Вот удобный способ сделать это автоматически, используя Powershell***

Допустим вы хотите разрешить имя в IP адрес или наоборот. Для этого в командной строке вы обычно пишите следующее:

```
nslookup danshin.ms
```

И получаете такой вывод:

```cmd
Server:  dns.google
Address:  8.8.8.8

Non-authoritative answer:
Name:    danshin.ms
Addresses:  185.199.108.153
          188.199.109.153
          185.199.110.153
          185.199.111.153
```

В Powershell это можно сделать так:

```powershell
[system.net.dns]::resolve("danshin.ms")
```

В этом случае Вы получите такой вывод.

```
HostName   Aliases AddressList
--------   ------- -----------
danshin.ms {}      {185.199.108.153, 188.199.109.153, 185.199.110.153, 185.199.111.153}
```

Что делать, если адресов больше одного, например целый список адресов? В этом случае помещаем их в файл, например `ip.txt`.

```
danshin.ms
microsoft.com
google.com
facebook.com
cooking.danshin.ms
```

Далее делам так:

Помещаем содержимое файла в переменную powershell

```powershell
$ip = Get-Content ip.txt
```

Затем пишем цикл `foreach`:

```
foreach ($address in $ip) {
  [system.net.dns]::resolve($address)
}
```

В этом случае мы получим вывод следующего вида:

```
HostName                   Aliases              AddressList                                                            
--------                   -------              -----------                                                            
danshin.ms                 {}                   {185.199.108.153, 188.199.109.153, 185.199.110.153, 185.199.111.153}   
microsoft.com              {}                   {104.215.148.63, 40.76.4.15, 40.112.72.205, 40.113.200.201...}         
google.com                 {}                   {173.194.222.138, 173.194.222.113, 173.194.222.102, 173.194.222.139...}
facebook.com               {}                   {157.240.205.35}                                                       
mdanshin-cooking.github.io {cooking.danshin.ms} {185.199.108.153, 185.199.111.153, 185.199.110.153, 185.199.109.153} 
```

Если адресов будем много, то работа цикла foreach может занять значительно время. И чтобы выидеть прогресс давайте выведем его на экран. Для этого введём две дополнительные переменные

```
$count = $ip.Count
$current = 0
```

Затем выведем прогресс через Write-Progress. И вот, что у нас получилось:

```powershell
$ip = Get-Content ip.txt

$count = $ip.Count
$current = 0

foreach ($address in $ip) {
  Write-Progress "Left to process $current addresses of $count" `
    -PercentComplete ( ( $current / $count ) * 100 )

  [system.net.dns]::resolve($address)
   
  $current++
}
```

И в заключении, чтобы иметь возможность форматировать получаемую таблицу, давайте результат работы цикла поместим в переменную и выведем его через Format-Table.

```powershell
$ip = Get-Content ip.txt

$count = $ip.Count
$current = 0

$table = foreach ($address in $ip) {
  Write-Progress "Left to process $current addresses of $count" `
    -PercentComplete ( ( $current / $count ) * 100 )

  [system.net.dns]::resolve($address)
   
  $current++
}

$table | Format-Table
```

В таком виде будет удобно разрешать как IP в адреса так и наоборот.
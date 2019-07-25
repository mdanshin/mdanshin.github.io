---
layout: post
title:  "Удобная функция сравнения объектов в Powershell"
categories: [ powershell ]
tags: [powershell, programming]
image: assets/images/compare-objects/0.png
author: Mikhail
---

На просторах интернет нашёл [удобную функцию](https://blogs.technet.microsoft.com/janesays/2017/04/25/compare-all-properties-of-two-objects-in-windows-powershell) для сравнений объектов Powershell.

Вот её немного усовершенствованная версия.

```powershell
Function Compare-ObjectProperties {
    Param(
        [PSObject]$ReferenceObject,
        [PSObject]$DifferenceObject
        
    )
    $Exclusions = "WhenC|Server|ServerName|Identity|Id|Guid|FQDN|DistinguishedName|AdminDisplayVersion|MetabasePath"
    

    $objprops = $ReferenceObject   | Get-Member -MemberType Property,NoteProperty | % Name
    $objprops += $DifferenceObject | Get-Member -MemberType Property,NoteProperty | % Name
    $objprops = $objprops | Sort | Select -Unique
    $diffs = @()
    foreach ($objprop in $objprops) {
        $diff = Compare-Object $ReferenceObject $DifferenceObject -Property $objprop
        if ($objprop -notmatch $Exclusions ){
        if ($diff) {            
            $diffprops = @{
                PropertyName=$objprop
                RefValue =($diff | ? {$_.SideIndicator -eq '<='} | % $($objprop))
                DiffValue=($diff | ? {$_.SideIndicator -eq '=>'} | % $($objprop))
            }
            $diffs += New-Object PSObject -Property $diffprops
        }     
        }   
    }
    if ($diffs) {return ($diffs | Select PropertyName,RefValue,DiffValue)}     
} 
```

А вот пример использования.

```Powershell
$mbx1 = Get-Mailbox mdanshin
$mbx2 = Get-Mailbox aivanov

Compare-ObjectProperties $mbx1 $mbx2 | ogv
```

В результате получаем удобный вывод по всем отличающимся свойствам двух объектов. Я надеюсь, что эта функция пригодится Вам для сравнения конфигураций Exchange. Последнее время часто было такое, что настройки новый серверов, конекторов и т.п. отличались. Теперь у Вас есть удобное средство для сравнения старых и новых настроек.

Обратите внимание на переменную `$Exclusions`. В ней можно задавать свойства, которые Вы хотите исключить из сравнения. Ну и понятно, что эту функцию можно использовать для любых объектов, не только Exchange.

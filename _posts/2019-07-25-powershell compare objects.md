---
layout: post
title:  "Удобная функция сравнения объектов в Powershell"
title_en: "A Handy Function to Compare Objects in PowerShell"
categories: [ Программирование ]
tags: [powershell]
image: assets/images/compare-objects/0.png
author: Mikhail
---


<div data-lang="ru" markdown="1">
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
</div>

<div data-lang="en" markdown="1">
I found a [handy function](https://blogs.technet.microsoft.com/janesays/2017/04/25/compare-all-properties-of-two-objects-in-windows-powershell) for comparing PowerShell objects.

Here is a slightly improved version.

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

Usage example:

```Powershell
$mbx1 = Get-Mailbox mdanshin
$mbx2 = Get-Mailbox aivanov

Compare-ObjectProperties $mbx1 $mbx2 | ogv
```

As a result, you get a convenient output with all properties that differ between two objects. I hope this function will be useful when comparing Exchange configurations. Recently I often ran into cases where settings on new servers, connectors, etc. were different. Now you have a simple way to compare old vs new configuration.

Pay attention to the `$Exclusions` variable: it lets you exclude properties you don't want to compare. And of course, this function can be used for any objects, not only Exchange.
</div>

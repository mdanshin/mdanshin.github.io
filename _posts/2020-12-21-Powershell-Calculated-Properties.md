---
layout: post
title:  "Использование вычисляемых свойств Powershell"
title_en: "Using PowerShell Calculated Properties"
categories: [ Администрирование ]
tags: [ Powershell ]
image: assets/images/Powershell-Calculated-Properties/0.jpg
author: Mikhail
---

<div data-lang="ru" markdown="1">
***Возникла необходимость свести в одной таблице данные, которые получаются двумя разными командлетами. В частности получить таблицу расположения VM по датасторам в VMware. Проблема в том, что нет готового командлета, который бы выдал такую информацию, а вывод Get-VM не содержит нужных данных. Командлет сообщает только "DatastoreIdList", а это означает, что нужно ещё одно сопоставление. В этой статье я покажу как выполнить это действие в одном скрипте. В процессе получения информации о виртуальной машине,  мы воспользуемся возможностью вычисляемых свойств и на лету получим имя датасторы по её ID и подставим это значение в выводимую таблицу.***

# Задача

Допустим мы хотим получить таблицу, где будет указано на какой датасторе располагается ВМ.

|Name|Datastore|
|:---|:--------|
|mdanshin_VM_01|DATASTORE-101|
|mdanshin_VM_02|DATASTORE-101|
|mdanshin_VM_03|DATASTORE-102|
|mdanshin_VM_04|DATASTORE-102|

Вот что нам сообщает командлет `Get-VM | FL`:

```
Name                    : mdanshin_VM_01
PowerState              : PoweredOn
Notes                   :
Guest                   : mdanshin_VM_01:Microsoft Windows 10 (64-bit)
NumCpu                  : 4
CoresPerSocket          : 2
MemoryMB                : 16384
MemoryGB                : 16
VMHostId                : HostSystem-host-13180
VMHost                  : esxi-05
VApp                    :
FolderId                : Folder-group-v3
Folder                  : vm
ResourcePoolId          : ResourcePool-resgroup-1245
ResourcePool            : MDanshin
HARestartPriority       : ClusterRestartPriority
HAIsolationResponse     : AsSpecifiedByCluster
DrsAutomationLevel      : AsSpecifiedByCluster
VMSwapfilePolicy        : Inherit
VMResourceConfiguration : CpuShares:Normal/4000 MemShares:Normal/163840
Version                 : v13
HardwareVersion         : vmx-13
PersistentId            : 501dfeee-d9a0-9722-3db3-6e4b8b4f49d9
GuestId                 : windows9_64Guest
UsedSpaceGB             : 178.39978302549570798873901367
ProvisionedSpaceGB      : 256.48669762350618839263916015
DatastoreIdList         : {Datastore-datastore-35571}
CreateDate              :
ExtensionData           : VMware.Vim.VirtualMachine
CustomFields            : {}
Id                      : VirtualMachine-vm-14454
Uid                     : /VIServer=mdanshin@vcenter:443/VirtualMachine=VirtualMachine-vm-14454/
```

Как видите, вывод не содержит информации о датасторе. Но есть `DatastoreIdList`, который содержит ID датасторы, на которой расположена ВМ. Если мы возьмём этот ID и выполним команду `Get-Datastore -id Datastore-datastore-35571`, то мы получим имя датасторы. Но это уже два разных командлета и не совсем понятно, как нам свести эти данные вместе. 

Хорошая новость в том, что с помощью простого приёма мы сможем получить требуемое нам значение на лету и подставить в выводимую таблицу. Имя этому приёму - вычисляемые свойства.

## Использование вычисляемых свойств Powershell

Чтобы разобраться, как работают вычисляемые свойства, давайте рассмотрим один пример. Если Вам в нём всё понятно, то смело пропускайте этот раздел и переходите к следующему.

```powershell
Get-ChildItem -File | 
select name, 
@{
    Name = "Type"; 
    expression = {
        switch ($_.extension) {
            '.txt'	{'Text File'}
            '.log'	{'Log File'}
            default	{'Unknown'}
        } 
    }
}
```

Командлет `Get-ChildItem -File` выдаст нам список файлов. Но, допустим, мы хотим ещё получить тип файла. Не просто расширение `txt` или `log`, а нормальное человеческое название `Text file` или `Log File`. Такого поля у нас нет. Но мы можем его создать и вычислить значение этого поля самостоятельно, на основе данных получаемых командлетом `Get-ChildItem`.

Чтобы получить только нужные нам поля воспользуемся командлетом `select` и передадим ему по конвейеру данные, полученные через `Get-ChildItem -File`.

```powershell
Get-ChildItem -File | select Name, Type
```

Вывод покажет нам только имена файлов с расширением. Значение поля `Type` будет пустым, потому, что `Get-ChildItem` не содержит такого поля. Чтобы его создать сделаем следующее - вместо `Type` напишем вот что:

```powershell
@{
    Name = "Type" 
    Expression = {
        switch ($_.extension) {
            '.txt'	{'Text File'}
            '.log'	{'Log File'}
            default	{'Unknown'}
        }
    }
}
```

То есть мы создали новое поле, которое на основании значения поля `extension`, которое есть в выводе `Get-ChildItem`, вычисляет и подставляет значение типа файла. При этом `Name` - это название столбца. `Expression` - это выражение, которое выполняется для каждой строчки, получаемой из `Get-ChildItem`. Оператор `switch` заменяет одно значение на другое. Он принимает значение поля `extension`, и если находит там совпадения, например `.txt`, то заменяет их на то, что мы укажем. В нашем случае это `Text File`. Всё, что не будет описано таким образом, будет заменено на то значение, которое мы укажем в ключе `default`. В нашем примере это `Unknown`. Полный текст скрипта приведён в начале главы. Если с этим всё понятно, то давайте двигаться дальше. Или напишите в комментариях, что не ясно и я раскрою тему более подробно.

# Решение

Теперь применим полученные знания для решения нашей задачи. В предыдущем примере, мы подставляли значения из заранее определённых значений. Но для решения задачи, нам нужно, чтобы значения запрашивались сами. Для начала нам нужно создать новое поле `Datastore`, которое будет содержать вычисляемое значение. То есть мы будем брать значение `DatastoreIdList`, которое мы получаем из командлета `Get-VM`, затем будем выполнять выражение (Expression) для получения имени датасторы по ID и подстановку этого имени в нашу таблицу.

```powershell
Get-VM | 
Select Name,
@{
  Name = "Datastore"
  Expression = { Get-Datastore -Id $_.DatastoreIdList } 
}
```

Всё просто, не правда ли? То есть `Expression` нам выведет результат выполнения `Get-Datastore`, которое в качестве параметра `-Id` получает значение параметра `$_.DatastoreIdList`, которое, в свою очередь, содержится в выводе `Get-VM`.

> Обратите внимание на запись @{} - таким образом мы создаём хеш-таблицу - это ключ/значение. В этом примере Name - это ключ, а "Datastore" - это его значение. Подробнее о хеш-таблицах можно почитать в моей статье [Базовые сведения о массивах и хеш-таблицах в Powershell](https://danshin.ms/powershell-arrays-and-hashtables/). И т.к. это хеш таблица, то ключи могут называться как угодно. Например для краткости, вместо Name и Expression, принято писать N и E соответственно (`@{N="Datastore";E={Get-Datastore -Id $_.DatastoreIdList}}`) .

# Дополнительная информация

На этом можно было бы закончить нашу статью, но я хочу рассказать ещё об одном приёме, который улучшит вывод нашего скрипта. Дело в том, что одна VM может иметь несколько дисков, которые могут располагаться на нескольких датасторах. В этом случае мы увидим в поле `Datastore`  перечисление имён, через запятую, в фигурных скобках. Если мы планируем выводить данные в CSV, то фигурные скобки нам не нужны и лучше от них избавится. Для этого я предлагаю воспользоваться методом `Join`. Стандартный командлет `Join-String` нам не подходит, т.к. возвращает значение типа PSObject, а Expression работает со значениями типа String. Поэтому воспользуемся методом приведения типов и вызовем метод Join ( [string]::Join() ). Этот метод принимает два параметра. Первый - это знак разделителя, второй это выражение, которое будет выполнено. Значит нам нужно поместить `Get-Datastore -Id $_.DatastoreIdList` внутрь метода Join и всё это поместить внутрь `Expression` вот таким образом:

```powershell
Expression = { [string]::Join( ',' , (Get-Datastore -Id $_.DatastoreIdList) ) }
```

При этом полный текст скрипта будет выглядеть вот так:

```powershell
Get-VM | 
Select Name,
@{
  Name = "Datastore"
  Expression = { [string]::Join( ',' , (Get-Datastore -Id $_.DatastoreIdList) ) }
}
```

Таким образом мы получим очищенные от фигурных скобок данные и значения в поле Datastore будут разделены запятыми. Ну а вывести всё это в CSV можно с помощью `Export-Csv`

```powershell
Export-Csv report.csv -NoTypeInformation -UseCulture
```

Для решения своей задачи я ещё ограничил вывод информации о VM только одним ресурспулом. И вот что у меня получилось в итоге:

```powershell
Get-ResourcePool -Name TEST | 
Get-VM | 
Select Name,
@{
    Name = "Datastore"
    Expression = { [string]::Join( ',' , (Get-Datastore -Id $_.DatastoreIdList) ) } } |
Export-Csv report.csv -NoTypeInformation -UseCulture
```

# Заключение
Вычисляемые свойства Powershell удобно использовать когда все необходимые данные не удаётся получить одним командлетом и приходится их получать разными командлетами и возможно даже из разных мест - Active Directory, Exchange, VMware и т.д.. 

</div>

<div data-lang="en" markdown="1">
***I needed to combine data from two different cmdlets into a single table — specifically, to get a report that shows which VMware datastores each VM is located on. The problem is that there is no ready-made cmdlet that outputs this directly, and `Get-VM` does not contain the datastore name. It only returns `DatastoreIdList`, which means we need a mapping step. In this post I show how to do it in one script using PowerShell calculated properties to resolve the datastore name from its ID on the fly and include it in the output table.***

# Task

Let's say we want a table that shows which datastore a VM is on.

|Name|Datastore|
|:---|:--------|
|mdanshin_VM_01|DATASTORE-101|
|mdanshin_VM_02|DATASTORE-101|
|mdanshin_VM_03|DATASTORE-102|
|mdanshin_VM_04|DATASTORE-102|

Here is what `Get-VM | FL` returns:

```
Name                    : mdanshin_VM_01
PowerState              : PoweredOn
Notes                   :
Guest                   : mdanshin_VM_01:Microsoft Windows 10 (64-bit)
NumCpu                  : 4
CoresPerSocket          : 2
MemoryMB                : 16384
MemoryGB                : 16
VMHostId                : HostSystem-host-13180
VMHost                  : esxi-05
VApp                    :
FolderId                : Folder-group-v3
Folder                  : vm
ResourcePoolId          : ResourcePool-resgroup-1245
ResourcePool            : MDanshin
HARestartPriority       : ClusterRestartPriority
HAIsolationResponse     : AsSpecifiedByCluster
DrsAutomationLevel      : AsSpecifiedByCluster
VMSwapfilePolicy        : Inherit
VMResourceConfiguration : CpuShares:Normal/4000 MemShares:Normal/163840
Version                 : v13
HardwareVersion         : vmx-13
PersistentId            : 501dfeee-d9a0-9722-3db3-6e4b8b4f49d9
GuestId                 : windows9_64Guest
UsedSpaceGB             : 178.39978302549570798873901367
ProvisionedSpaceGB      : 256.48669762350618839263916015
DatastoreIdList         : {Datastore-datastore-35571}
CreateDate              :
ExtensionData           : VMware.Vim.VirtualMachine
CustomFields            : {}
Id                      : VirtualMachine-vm-14454
Uid                     : /VIServer=mdanshin@vcenter:443/VirtualMachine=VirtualMachine-vm-14454/
```

As you can see, the output does not include the datastore name. But there is `DatastoreIdList` — it contains the datastore ID where the VM lives. If we take that ID and run `Get-Datastore -Id Datastore-datastore-35571`, we get the datastore name. But that's a second cmdlet, and the question is how to combine them.

The good news is: with a simple trick, we can compute the value on the fly and include it in our output. This trick is called *calculated properties*.

## Using PowerShell calculated properties

To understand how calculated properties work, let's look at a simple example (if you already know it, skip to the next section).

```powershell
Get-ChildItem -File | 
select name, 
@{
    Name = "Type"; 
    expression = {
        switch ($_.extension) {
            '.txt'  {'Text File'}
            '.log'  {'Log File'}
            default {'Unknown'}
        } 
    }
}
```

`Get-ChildItem -File` returns a list of files. Imagine we also want a human-friendly file type, not just the extension. There is no `Type` field in `Get-ChildItem`, but we can *create* it and compute its value using existing properties.

If we run:

```powershell
Get-ChildItem -File | select Name, Type
```

`Type` would be empty, because the input objects do not have such a property. To create it, we provide a hashtable instead of a plain property name:

```powershell
@{
    Name = "Type" 
    Expression = {
        switch ($_.extension) {
            '.txt'  {'Text File'}
            '.log'  {'Log File'}
            default {'Unknown'}
        }
    }
}
```

`Name` defines the output column name. `Expression` is executed for each input object. In this example, a `switch` maps extensions to friendly names.

# Solution

Now let's apply this to our VM/datastore task. This time we don't map to predefined strings — we query the datastore name by ID. We create a new calculated field `Datastore`: we take `DatastoreIdList` from `Get-VM`, call `Get-Datastore` inside `Expression`, and output the result.

```powershell
Get-VM | 
Select Name,
@{
  Name = "Datastore"
  Expression = { Get-Datastore -Id $_.DatastoreIdList } 
}
```

So `Expression` executes `Get-Datastore` with `-Id $_.DatastoreIdList` (where `DatastoreIdList` comes from the `Get-VM` output).

> Note the `@{}` syntax: it's a hashtable (key/value). Here `Name` is the key and "Datastore" is the value. You can read more about hashtables in my article [PowerShell arrays and hashtables basics](https://danshin.ms/powershell-arrays-and-hashtables/). Also, common shorthand keys are `N` and `E` instead of `Name` and `Expression` (for example: `@{N="Datastore";E={Get-Datastore -Id $_.DatastoreIdList}}`).

# Additional information

We could stop here, but there is one more trick that improves the output. A VM can have multiple disks located on multiple datastores. In this case, the `Datastore` field may contain a list in curly braces. If you're exporting to CSV, you likely don't want the braces. One way is to join the values with commas.

`Join-String` is not suitable here because it returns a PSObject and `Expression` expects a string value. So we can use `[string]::Join()` which takes a separator and a list to join:

```powershell
Expression = { [string]::Join( ',' , (Get-Datastore -Id $_.DatastoreIdList) ) }
```

Full script:

```powershell
Get-VM | 
Select Name,
@{
  Name = "Datastore"
  Expression = { [string]::Join( ',' , (Get-Datastore -Id $_.DatastoreIdList) ) }
}
```

Now the `Datastore` field contains comma-separated values without braces. Export to CSV with `Export-Csv`:

```powershell
Export-Csv report.csv -NoTypeInformation -UseCulture
```

In my case I also limited the output to a specific resource pool:

```powershell
Get-ResourcePool -Name TEST | 
Get-VM | 
Select Name,
@{
    Name = "Datastore"
    Expression = { [string]::Join( ',' , (Get-Datastore -Id $_.DatastoreIdList) ) } } |
Export-Csv report.csv -NoTypeInformation -UseCulture
```

# Conclusion

PowerShell calculated properties are very handy when you can't get all required data from a single cmdlet and have to combine outputs from different cmdlets — possibly even from different systems like Active Directory, Exchange, VMware, etc.
</div>

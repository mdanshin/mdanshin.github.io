---
layout: post
title:  "Получение всех email-enabled объектов из Exchange со всеми адресами"
title_en: "Export All Email-Enabled Objects from Exchange with All Addresses"
categories: [ Администрирование ]
tags: [ Powershell ]
image: assets/images/get-all-email-enabled-objects/0.jpg
author: Mikhail
---


<div data-lang="ru" markdown="1">
***Возникла необходимость получить список всех email-enabled объектов из Exchange. При этом вывести не только PrimarySmtpAddress, но и дополнительные SMTP адреса.***

![assets/images/get-all-email-enabled-objects/1.jpg](/assets/images/get-all-email-enabled-objects/1.jpg)

Для получения всех объектов воспользуемся командлетом `Get-Recipient` и не забываем указать -ResultSize unlimited, для получения всех результатов.

```powershell
Get-Recipient -ResultSize unlimited
```

Затем, при помощи коммандлета `Select-Object` отберём только те поля, которые нас интересуют. При этом основной SMTP адрес поместим в поле `PrimarySmtpAddress`, а дополнительные в поле `EmailAddresses`.

> Поле `EmailAddresses` мы формируем при помощи вычисляемого свойства. Подробнее об этом можно почитать в моей статье [Использование вычисляемых свойств Powershell](https://danshin.ms/Powershell-Calculated-Properties/).

```powershell
Select-Object Name, RecipientType, PrimarySmtpAddress,
    @{Name="EmailAddresses";Expression={
        $_.EmailAddresses |  # Извлекаем адреса электронной почты
        Where-Object {$_.PrefixString -ceq "smtp"} |  # Оставляем только адреса, начинающиеся с "smtp"
        ForEach-Object {$_.SmtpAddress}  # Извлекаем SMTP-адрес каждого адреса электронной почты
    }}
```

Затем обрабатываем каждого получателя и все адреса в поле `EmailAddresses` запишем в одну строку, разделенную запятой.

```powershell
# Обрабатываем каждого получателя и объединяем все адреса электронной почты в одну строку, разделенную запятой
ForEach-Object {
    $_.EmailAddresses = ($_.EmailAddresses -join ", ")
    return $_
}
```

В конце выводим всё в CSV

```powershell
Export-Csv "email_enabled_objects.csv" -NoTypeInformation -Encoding UTF8
```

Полный текст скрипта:

```powershell
# Получаем всех получателей с неограниченным размером результата
Get-Recipient -ResultSize unlimited |

# Выбираем нужные свойства объекта получателя, а также формируем свойство EmailAddresses
Select-Object Name, RecipientType, PrimarySmtpAddress,
    @{Name="EmailAddresses";Expression={
        $_.EmailAddresses |  # Извлекаем адреса электронной почты
        Where-Object {$_.PrefixString -ceq "smtp"} |  # Оставляем только адреса, начинающиеся с "smtp"
        ForEach-Object {$_.SmtpAddress}  # Извлекаем SMTP-адрес каждого адреса электронной почты
    }} |

# Обрабатываем каждого получателя и объединяем все адреса электронной почты в одну строку, разделенную запятой
ForEach-Object {
    $_.EmailAddresses = ($_.EmailAddresses -join ", ")
    return $_
} |

# Экспортируем результат в CSV-файл
Export-Csv "email_enabled_objects.csv" -NoTypeInformation -Encoding UTF8
```

В итоге получим желаемую таблицу в CSV

![assets/images/get-all-email-enabled-objects/1.jpg](/assets/images/get-all-email-enabled-objects/1.jpg)

P.S.
Если у вас Exchange версии 2013 или 2016, добавьте в начало скрипта следующую строку.

```powershell
Add-PSSnapin Microsoft.Exchange.Management.PowerShell.SnapIn
```

Это позволит выполнять скрипт в обычной сессии Powershell, а не только в Exchange Management Shell.
</div>

<div data-lang="en" markdown="1">
***I needed to export a list of all email-enabled objects from Exchange and include not only `PrimarySmtpAddress`, but also additional SMTP addresses.***

![assets/images/get-all-email-enabled-objects/1.jpg](/assets/images/get-all-email-enabled-objects/1.jpg)

First, get all recipients with `Get-Recipient` and don't forget to set `-ResultSize unlimited` to return everything.

```powershell
Get-Recipient -ResultSize unlimited
```

Then use `Select-Object` to keep only the properties we need. We'll put the primary address into `PrimarySmtpAddress` and additional addresses into `EmailAddresses`.

> We build `EmailAddresses` using a calculated property. See my post about it: [Using PowerShell calculated properties](https://danshin.ms/Powershell-Calculated-Properties/).

```powershell
Select-Object Name, RecipientType, PrimarySmtpAddress,
    @{Name="EmailAddresses";Expression={
        $_.EmailAddresses |  # Extract email addresses
        Where-Object {$_.PrefixString -ceq "smtp"} |  # Keep only addresses with the "smtp" prefix
        ForEach-Object {$_.SmtpAddress}  # Extract the SMTP address value
    }}
```

Next, process each recipient and join all values in `EmailAddresses` into a single comma-separated string:

```powershell
ForEach-Object {
    $_.EmailAddresses = ($_.EmailAddresses -join ", ")
    return $_
}
```

Finally, export everything to CSV:

```powershell
Export-Csv "email_enabled_objects.csv" -NoTypeInformation -Encoding UTF8
```

Full script:

```powershell
Get-Recipient -ResultSize unlimited |
Select-Object Name, RecipientType, PrimarySmtpAddress,
    @{Name="EmailAddresses";Expression={
        $_.EmailAddresses |
        Where-Object {$_.PrefixString -ceq "smtp"} |
        ForEach-Object {$_.SmtpAddress}
    }} |
ForEach-Object {
    $_.EmailAddresses = ($_.EmailAddresses -join ", ")
    return $_
} |
Export-Csv "email_enabled_objects.csv" -NoTypeInformation -Encoding UTF8
```

As a result, you'll get the desired CSV table.

![assets/images/get-all-email-enabled-objects/1.jpg](/assets/images/get-all-email-enabled-objects/1.jpg)

P.S.
If you are using Exchange 2013 or 2016, add this line at the top of the script:

```powershell
Add-PSSnapin Microsoft.Exchange.Management.PowerShell.SnapIn
```

This allows you to run the script in a regular PowerShell session, not only in Exchange Management Shell.
</div>

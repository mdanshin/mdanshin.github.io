---
layout: post
title:  "Получение всех email-enabled объектов из Exchange со всеми адресам"
categories: [ Администрирование ]
tags: [ Powershell ]
image: assets/images/get-all-email-enabled-objects/0.jpg
author: Mikhail
---

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
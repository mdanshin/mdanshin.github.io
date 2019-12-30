---
layout: post
title:  "Как посмотреть когда истечёт пароль пользователя в Active Directory"
categories: [ Администрирование ]
tags: [ Windows, Powershell, ActiveDirectory ]
image: assets/images/UserPasswordExpiryTimeComputed/0.jpg
author: Mikhail
---
***Как узнать, дату и время истечения пароля учётной записи пользователя в Active Directory? Очень просто....***

Для запуска данного скрипта достаточно прав обычного пользователя в Active Directory. Метод построен на получении значения свойства атрибута `msDS-UserPasswordExpiryTimeComputed`, который [описан в спецификации](https://docs.microsoft.com/en-us/openspecs/windows_protocols/ms-ada2/bca90ab4-9317-42c0-aeec-127ddf2b2778) по протоколам Windows.

```powershell
Get-ADUser "username" –Properties "DisplayName", "msDS-UserPasswordExpiryTimeComputed" | Select-Object -Property "Displayname",@{Name="ExpiryDate";Expression={[datetime]::FromFileTime($_."msDS-UserPasswordExpiryTimeComputed")}}
```
В результате получаем не хитрую табличку.

![UserPasswordExpiryTimeComputed/1.png](/assets/images/UserPasswordExpiryTimeComputed/1.png)

Обратите внимание на то, что данный атрибут не является системным (systemOnly: FALSE). Поэтому не забудьте снять галку System-Only, если соберётесь смотреть его значение через ADUC.

![UserPasswordExpiryTimeComputed/2.png](/assets/images/UserPasswordExpiryTimeComputed/2.png)
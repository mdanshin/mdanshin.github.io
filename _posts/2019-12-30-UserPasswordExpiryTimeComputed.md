---
layout: post
title:  "Как посмотреть когда истечёт пароль пользователя в Active Directory"
title_en: "How to Check When a User Password Expires in Active Directory"
categories: [ Администрирование ]
tags: [ Windows, Powershell, ActiveDirectory ]
image: assets/images/UserPasswordExpiryTimeComputed/0.jpg
author: Mikhail
---

<div data-lang="ru" markdown="1">
***Как узнать, дату и время истечения пароля учётной записи пользователя в Active Directory? Очень просто....***

Для запуска данного скрипта достаточно прав обычного пользователя в Active Directory. Метод построен на получении значения свойства атрибута `msDS-UserPasswordExpiryTimeComputed`, который [описан в спецификации](https://docs.microsoft.com/en-us/openspecs/windows_protocols/ms-ada2/bca90ab4-9317-42c0-aeec-127ddf2b2778) по протоколам Windows.

```powershell
Get-ADUser "username" –Properties "DisplayName", "msDS-UserPasswordExpiryTimeComputed" | Select-Object -Property "Displayname",@{Name="ExpiryDate";Expression={[datetime]::FromFileTime($_."msDS-UserPasswordExpiryTimeComputed")}}
```

В результате получаем не хитрую табличку.

![UserPasswordExpiryTimeComputed/1.png](/assets/images/UserPasswordExpiryTimeComputed/1.png)

Обратите внимание на то, что данный атрибут не является системным (systemOnly: FALSE). Поэтому не забудьте снять галку System-Only, если соберётесь смотреть его значение через ADUC.

![UserPasswordExpiryTimeComputed/2.png](/assets/images/UserPasswordExpiryTimeComputed/2.png)
</div>

<div data-lang="en" markdown="1">
***How can you find the date and time when a user's password expires in Active Directory? It's easy...***

To run this script, regular user permissions in Active Directory are enough. The method is based on reading the value of the `msDS-UserPasswordExpiryTimeComputed` attribute, which is [described in the specification](https://docs.microsoft.com/en-us/openspecs/windows_protocols/ms-ada2/bca90ab4-9317-42c0-aeec-127ddf2b2778) for Windows protocols.

```powershell
Get-ADUser "username" –Properties "DisplayName", "msDS-UserPasswordExpiryTimeComputed" | Select-Object -Property "Displayname",@{Name="ExpiryDate";Expression={[datetime]::FromFileTime($_."msDS-UserPasswordExpiryTimeComputed")}}
```

As a result, you get a simple table.

![UserPasswordExpiryTimeComputed/1.png](/assets/images/UserPasswordExpiryTimeComputed/1.png)

Note that this attribute is not system-only (systemOnly: FALSE). So don't forget to uncheck **System-Only** if you want to view its value in ADUC.

![UserPasswordExpiryTimeComputed/2.png](/assets/images/UserPasswordExpiryTimeComputed/2.png)
</div>

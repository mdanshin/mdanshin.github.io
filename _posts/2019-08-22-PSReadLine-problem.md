---
layout: post
title:  "Исправление проблемы ввода заглавных букв в Powershell"
title_en: "Fixing Uppercase Input in PowerShell"
categories: [ Программирование ]
tags: [ powershell, featured ]
image: assets/images/PSReadLine-problem/0.jpg
author: Mikhail
---

<div data-lang="ru" markdown="1">
***Столкнулся с интересной проблемой. В Powershell, не вводятся заглавные буквы. Делюсь своими изысканиями как решить эту проблему.***

После недолгого поиска решения проблемы, стало понятно, что всё дело в модуле PSReadLine, который в основном нужен для синтаксической раскраски, но ещё много чего делает.

Подробную информацию о модуле можно найти на сайте проекта, на Github, по адресу [https://github.com/PowerShell/PSReadLine](https://github.com/PowerShell/PSReadLine). Ошибка, о которой я говорю, описана там же, в [issue 798](https://github.com/PowerShell/PSReadLine/issues/798).

Дело в том, что какое-то время, в поставку Windows входила версия 2.0.0, которая появилась 6.12.2017 в статусе BETA. Она и содержала эту ошибку. 7.11.2018 разработчик с ником `MVKozlov` сообщил о проблеме и уже 26.11.2018 ошибка была устранена. К тому времени проект успел получить статус beta3. А уже в мае 2019 года проект получил статус beta4 и не содержал данной ошибки.

Воспроизвести проблему можно следующим образом. Нужно переключиться на русскую раскладку клавиатуры и запустить Powershell. Если у Вас установлена версия модуля 2.0.0.beta1, beta2 или beta3, то вы не сможете в консоли Powershell набрать заглавные буквы. Проблема была решена 3 декабря 2018 года и всё решение сводится к тому, чтобы переустановить модуль. Делается это просто.

```powershell
Remove-Module PSReadLine
```

Затем удаляем папку `C:\Program Files\WindowsPowerShell\Modules\PSReadLine` и устанавливаем модуль ещё раз.

```powershell
Install-Module PSReadLine
```

Текущая стабильная версия модуля 1.2, она и будет установлена по умолчанию. С сайта проекта вы можете поставить майскую версию v2.0.0-beta4, но, насколько я понимаю, она далека от релиза. Там ещё требуется много доработок. На сегодняшний день по версии 2.0.0.beta4 заявлено 60 багов и 9 из них всё ещё открыты.
</div>

<div data-lang="en" markdown="1">
***I ran into an interesting issue: in PowerShell I couldn't type uppercase letters. Here is what I found and how to fix it.***

After a bit of digging, it became clear that the root cause was the PSReadLine module. It's mainly used for syntax highlighting, but it also does a lot more.

You can find more details on the project page on GitHub: [https://github.com/PowerShell/PSReadLine](https://github.com/PowerShell/PSReadLine). The exact bug I am talking about is described in [issue #798](https://github.com/PowerShell/PSReadLine/issues/798).

For some time, Windows shipped with PSReadLine version 2.0.0 (released on 2017-12-06 as a BETA), and that build contained this bug. On 2018-11-07 a developer with the nickname `MVKozlov` reported the issue, and by 2018-11-26 it had already been fixed (by then the project had reached beta3). In May 2019 the project reached beta4 and no longer contained this bug.

How to reproduce: switch to the Russian keyboard layout and start PowerShell. If you have PSReadLine 2.0.0.beta1, beta2, or beta3 installed, you won't be able to type uppercase letters in the PowerShell console.

The fix (released on December 3, 2018) is simply to reinstall the module:

```powershell
Remove-Module PSReadLine
```

Then delete the folder `C:\Program Files\WindowsPowerShell\Modules\PSReadLine` and install the module again:

```powershell
Install-Module PSReadLine
```

The current stable version is 1.2, and that is what gets installed by default. From the project page you can install the v2.0.0-beta4 build, but as far as I understand it, it's still far from a final release: it needs more work. At the time of writing, 2.0.0-beta4 had 60 reported bugs, and 9 of them were still open.
</div>

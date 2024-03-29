---
layout: post
title:  "Измерение объектов в Powershell"
categories: [ Администрирование ]
tags: [ Powershell ]
image: assets/images/Measure-Object/0.jpg
author: Mikhail
---
***Возникла задача найти всех пользователей в Active Directory, у кого нет отчества. Я решил посчитать кол-во слов в displayName и у кого их меньше трёх, то это и есть те учётки, что мне нужны. Осталось понять, как это сделать.***

В Powershell есть замечательный командлет - Measure-Object. 

>Я не нашёл офицального перевода, поэтому назвал его Измерение Объектов.

Как сказано в документации, этот командлет **вычисляет числовые свойства объектов, а также символы, слова и строки в строковых объектах, например в текстовых файлах**.

Вот простой пример:

```powershell
Get-ChildItem | Measure-Object
```

![Measure-Object/1.png](/assets/images/Measure-Object/1.png)

Конечно в этом примере можно было бы обойтись простым методом Count - `(Get-ChildItem).count` и получить нужный результат, но раз есть специальный командлет, то значит у него есть свои свойства и методы, которые мы можем использовать для решения нашей задачи. В частности, в документации сказано, что у него есть параметр `-Word`, который подсчитывает количество слов во входных объектах. Он-то нам и нужен.

Давайте с помощью `Get-ADUser` получим `DisplayName` пользователя и посчитаем кол-во слов.

```powershell
Get-ADUser mdanshin -Properties displayname | Measure-Object -Property DisplayName -Word
```




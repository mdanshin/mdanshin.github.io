---
layout: post
title:  "Как создать много файлов с разным, динамическим содержанием в Powershell"
title_en: "How to Create Many Files with Dynamic Multi-Line Content in PowerShell"
categories: [ Программирование ]
tags: [ powershell ]
image: assets/images/powershell-here-string/0.jpg
author: Mikhail
---

<div data-lang="ru" markdown="1">
***Потребовалось создать большое количество файлов, но с разным содержанием. К тому же содержание не однострочное, а полнотекстовое и в каждом файле разное. Я был уверен, что Powershell лучший помощник в этом деле, но как именно это сделать я не знал. Делюсь с Вами своими изысканиями.***

>Ниже я привожу не свою, а выдуманную задачу. Она лучше подходит для описания.

# Задача
Есть большой список фамилий. Под каждую фамилию нужно сгенерировать отдельный файл, содержащий несколько строк текста, но таким образом, чтобы в нужном месте подставлялась фамилия.

# Решение
Задача делиться на три части.

* Прочитать из файла фамилии
* Создать файл
* Поместить в файл содержимое с подстановкой фамилии в нужном месте

## Прочитать из файла фамилии
Для начала нам нужно из заранее подготовленного файла построчно прочитать его содержимое и поместить его в переменную. Это делается очень просто.

```powershell
$users = Get-Content users.txt
```

## Создать файл
Создать файл тоже очень просто. Для этого используем командлет `New-Item`. В параметре `-Path` задаём путь к файлу, в параметре `-Name` его имя, а параметр `-Value` будет содержать текст, который мы хотим поместить в файл.

```powershell
New-Item -Path C:\Temp -Name "file_name.txt" -Value $fileContent
```

Всё просто, если бы нам нужно было создать один файл с одностроковым содержимым. Чтобы создать много файлов нам понадобится цикл `foreach` и каким-то образом нужно поместить в файл многострочный текст, да ещё и с подстановкой динамического контента в нужном месте. Вот тут-то я и узнал о Here-Strings в powershell.

# Поместить в файл содержимое с подстановкой фамилии в нужном месте
Прежде всего нам нужно поместить многострочный текст в переменную. Допустим это будет следующий текст:

```
Уважаемый $user,

Приветствую Вас на страницах моего нового блога. Надеюсь, что Вам здесь понравиться.

С Уважением,
danshin.ms
```

В Powershell мы можем использовать [Here-Strings](https://devblogs.microsoft.com/scripting/powertip-use-here-strings-with-powershell/), чтобы объявить блок текста и поместить его в переменную. Вот как это делается.

```powershell
$fileContent = @"
Уважаемый $user,

Приветствую Вас на страницах моего нового блога. Надеюсь, что Вам здесь понравиться.

С Уважением,
danshin.ms
"@
```

Переменная `$fileContent` будет содержать наш текст. Форматирование  передаётся параметру `-Value` в командлете `New-Item`. А вместо `$user` будет подставляться содержимое этой переменной. Это то, что нам нужно! Осталось только поместить это всё в цикл.

Сразу приведу полный текст скрипта.

```powershell
# Читаем из файла список пользователей и помещаем его в массив $users.
$users = Get-Content users.txt

# С помощью цикла foreach проходим по каждому элементу массива.
foreach ($user in $users)
{
  $fileContent = @"
Уважаемый $user,

Приветствую Вас на страницах моего нового блога. Надеюсь, что Вам здесь понравиться.

С Уважением,
danshin.ms
"@

# Создаём файл.
  New-Item -Path C:\Temp -Name $user".txt" -Value $fileContent
}
```

Как видите, всё очень просто и элегантно. Думаю, что Here-Strings пригодиться ещё не раз. Напишите в комментариях, что Вы об этом думаете и какие сценарии использования Here-Strings Вы применяли.
</div>

<div data-lang="en" markdown="1">
***I needed to create a large number of files, each with different content. The content was not one line — it was full multi-line text, and it had to be different for each file. I knew PowerShell would be a great fit, but I wasn't sure how to implement it. Here are my notes.***

> The task below is fictional — it's a better example for explanation.

# Task
You have a large list of last names. For each last name you need to generate a separate file that contains several lines of text, and the last name should be inserted in the right place.

# Solution
The task can be split into three parts:

* Read the list of names from a file
* Create a file
* Write multi-line content into the file with the name inserted dynamically

## Read names from a file
First, read the file line by line into a variable:

```powershell
$users = Get-Content users.txt
```

## Create a file
Creating a file is simple with `New-Item`. Use `-Path` for the directory, `-Name` for the file name, and `-Value` for the content you want to write.

```powershell
New-Item -Path C:\Temp -Name "file_name.txt" -Value $fileContent
```

This is easy if you create one file with a single-line value. But to create many files, we need a `foreach` loop and a way to keep multi-line text in a variable — and also substitute dynamic content (the name) inside that text. This is where Here-Strings in PowerShell help.

# Write multi-line content with a dynamic name
First, let's define the multi-line text we want to write. For example:

```
Dear $user,

Welcome to my new blog. I hope you enjoy it here.

Best regards,
danshin.ms
```

In PowerShell, we can use [Here-Strings](https://devblogs.microsoft.com/scripting/powertip-use-here-strings-with-powershell/) to declare a multi-line block of text and store it in a variable:

```powershell
$fileContent = @"
Dear $user,

Welcome to my new blog. I hope you enjoy it here.

Best regards,
danshin.ms
"@
```

Now `$fileContent` contains the text (including formatting). We pass it to `New-Item -Value`, and `$user` will be replaced with the current name.

All that's left is to put it in a loop. Here's the full script:

```powershell
# Read the list of users from a file into the $users array.
$users = Get-Content users.txt

# Iterate through the array.
foreach ($user in $users)
{
  $fileContent = @"
Dear $user,

Welcome to my new blog. I hope you enjoy it here.

Best regards,
danshin.ms
"@

  # Create a file.
  New-Item -Path C:\Temp -Name $user".txt" -Value $fileContent
}
```

As you can see, it's simple and elegant. I think Here-Strings will come in handy more than once. Share in the comments how you use Here-Strings and in which scenarios.
</div>

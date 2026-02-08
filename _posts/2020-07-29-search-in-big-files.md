---
layout: post
title:  "Поиск текста в больших файлах"
title_en: "Searching Text in Large Files"
categories: [ Администрирование ]
tags: [ Linux, Windows ]
image: assets/images/search-in-big-files/0.png
author: Mikhail
---

<div data-lang="ru" markdown="1">
***Этот пост не для того, чтобы научить, а для того, чтобы напомнить. Странно, но многие забывают, что для поиска текста в большом файле его не нужно предварительно открывать никакими текстовыми редакторами типа Notepad. Достаточно командной строки.***

Чаще всего поиск приходится делать по Log-файлам. В наши дни логфайл размером в 5 гигабайт и более совсем не редкость. Я часто наблюдал, как для поиска строки в логе его предварительно открывали для просмотра, например, в Notepad или другом подручном редакторе и в нём осуществляли поиск. Ладно ещё если размер измеряется в сотнях мегабайт, но если речь идёт о гигабайтах, то я даже не уверен, что Notepad с этим справится, а при попытке открыть файл объёмом около 5 GB Notepad++ и вовсе сказал, что не сможет этого сделать.

Администраторы Windows забывают, что для поиска текста по файлу его не обязательно открывать. Достаточно запустить утилиту командной строки, которая бы построчно прочитала бы файл и вывела на консоль только те строки, в которых встречается искомое сочетание символов или слов.

В Linux для этого используется утилита `grep`, часто в сочетании с cat или find. В Windows для этого есть утилита `findstr`. Вот несколько примеров для обоих вариантов.

### Linux
```bash
grep -rnw '/path/to/somewhere/' -e 'pattern'
```
    -r or -R рекурсивный поиск,
    -n указывать номер строки, и
    -w искать точное совпадение.
    -l (маленька L) можно добавить, чтобы выводить только имена файлов, в которых найдены совпадения.

### Windows
```powershell
findstr /S /N /X "pattern" '/path/to/somewhere/*'
```

    /S рекурсивный поиск,
    -N указывать номер строки, и
    -X искать точное совпадение.
    -M можно добавить, чтобы выводить только имена файлов, в которых найдены совпадения.

Конечно утилита `grep` обладает несравнимо большими возможностями нежели `findstr`. Раньше администраторы Windows были лишены её преимуществ. Но с появлением WSL всё изменилось. Сегодня WSL (Windows Subsystem for Linux) позволяет воспользоваться преимуществами обоих ОС, а Windows Terminal делает эту работу гораздо проще. О WSL и Windows Terminal я расскажу в ближайшее время.

P.S.
Кстати, `findstr` - это не едиственный способ поиска в текста в больших файлах в Windows. А как Вы решаете подобные задачи?
</div>

<div data-lang="en" markdown="1">
***This post is not meant to teach something new, but rather to remind. Surprisingly, many people forget that to search text in a large file you don't have to open it in an editor like Notepad — a command line tool is enough.***

Most often you search through log files. Today, log files of 5 GB+ are not uncommon. I have seen people open huge logs in Notepad or some other editor and then search inside it. If the file is a few hundred MB, it might still work, but for multi-gigabyte files it's not even clear that Notepad can handle it — and when I tried opening a ~5 GB file in Notepad++, it said it couldn't.

Windows admins sometimes forget that to search through a file you don't need to open it at all. You can run a command line utility that reads the file line by line and prints only the lines that match the pattern.

On Linux, the classic tool is `grep` (often used with cat/find). On Windows, there is `findstr`. Here are a few examples for both.

### Linux
```bash
grep -rnw '/path/to/somewhere/' -e 'pattern'
```
    -r or -R — recursive search
    -n — show line numbers
    -w — match whole words
    -l (lowercase L) — print only file names that contain matches

### Windows
```powershell
findstr /S /N /X "pattern" '/path/to/somewhere/*'
```

    /S — recursive search
    /N — show line numbers
    /X — match whole lines
    /M — print only file names that contain matches

Of course, `grep` is much more powerful than `findstr`. Windows admins used to be missing out on it, but with WSL things have changed. Today, WSL (Windows Subsystem for Linux) lets you use the best of both worlds, and Windows Terminal makes it much more convenient. I'll talk about WSL and Windows Terminal soon.

P.S.
By the way, `findstr` is not the only way to search large files on Windows. How do you solve tasks like this?
</div>

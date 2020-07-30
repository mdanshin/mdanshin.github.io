---
layout: post
title:  "Поиск текста в больших файлах"
categories: [ Администрирование ]
tags: [ Linux, Windows ]
image: assets/images/search-in-big-files/0.png
author: Mikhail
---
*** Этот пост не для того, чтобы научить, а для того, чтобы напомнить. Странно, но многие забывают, что для поиска текста в большом файле его не нужно предварительно открывать никакими текстовыми редакторами типа Notepad. Достаточно командной строки. ***

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
findstr /S /N /X "mdanshin" '/path/to/somewhere/*'
```powershell

    /S рекурсивный поиск,
    -N указывать номер строки, и
    -X искать точное совпадение.
    -M можно добавить, чтобы выводить только имена файлов, в которых найдены совпадения.

Конечно утилита `grep` обладает несравнимо большими возможностями нежели `findstr`. Раньше администраторы Windows были лишены её преимуществ. Но с появлением WSL всё изменилось. Сегодня WSL (Windows Subsystem for Linux) позволяет воспользоваться преимуществами обоих ОС, а Windows Terminal делает эту работу гораздо проще. О WSL и Windows Terminal я расскажу в ближайшее время.
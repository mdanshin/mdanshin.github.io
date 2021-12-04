---
layout: post
title:  "Базовые сведения о массивах и хеш-таблицах в Powershell"
categories: [ Программирование ]
tags: [ powershell, featured ]
image: assets/images/powershell-arrays-and-hashtables/0.jpg
author: Mikhail
---
***Как известно, Powershell является объектно-ориентированным скриптовым языком. Почти всё, с чем мы имеем дело в Powershell, является объектом. Именно поэтому важно знать и понимать, как работать с объектами в Powershell, какие они бывают и чем они отличаются.***

Иногда нам может потребоваться создать собственные объекты. И для большей эффективности мы должны выбрать тот тип объекта, который подходит под наши конкретные задачи и умело с ним обращаться.

В этой статье я хочу упорядочить собственные знания, которые сам получил только недавно. Она не претендует на полноту. Полное знакомство с темой – это материал на целую книгу. Особенно учитывая то, что в Powershell 5.0 появились классы (classes). 

Я предполагаю, что вы знакомы с основами объектно-ориентированного программирования. А если знаете, что такое «переменная» (variable), «объект» (object), «поле» (field), «свойство» (property), «метод» (method) и что такое наследование и экземпляр объекта, то Вы возможно сами прекрасно знаете всё, о чем тут написано. Поэтому буду рад обратной связи и любым дополнениям.

Массивы и хеш-таблицы являются базовыми структурами данных, которые Вам нужно понять, для эффективной работы с Powershell.

# Массивы (Arrays)
Раньше я повсеместно использовал массивы. Это было моим излюбленным средством. Пока не узнал о хеш-таблицах. О них речь пойдёт ниже. Пустой массив объявляется следующим образом: `$info = @()`

Ниже приведён простейший пример создания массива.
```powershell
$info = "Mikhail Danshin", "Ivan Ivanov", "Sergey Petrov"
```
Давайте немного исследуем, что за объект мы получили. Если ввести `$info | Get-Member`, то мы увидим, что мы имеем дело с типом `System.String`.

![powershell-arrays-and-hashtables/1.png](/assets/images/powershell-arrays-and-hashtables/1.png)

Если воспользоваться методом `GetType()`, то можно увидеть, что объект `$info` унаследован от базового типа `System.Array`.

![powershell-arrays-and-hashtables/2.png](/assets/images/powershell-arrays-and-hashtables/2.png)

Таким образом мы видим, что мы имеем дело с массивом элементов типа `String`, помещённых в объект типа `Array`.

Для доступа к элементам массива мы можем использовать индекс элемента.

`$info[0]`, `$info[1]`, `$info[2]` или вывести всё содержимое массива - `$info`.

![powershell-arrays-and-hashtables/3.png](/assets/images/powershell-arrays-and-hashtables/3.png)

Если нам нужно перебрать все элементы массива, то можем воспользоваться, например, циклом `foreach`.

```powershell
foreach ($item in $info) { write-host "The user name is " $item }
```

![powershell-arrays-and-hashtables/4.png](/assets/images/powershell-arrays-and-hashtables/4.png)

Но иногда нам нужны более сложные объекты. Содержащие несколько полей. Например, **FirstName**, **LastName** и **UserName**.
Мы могли бы создать многомерный массив. Например, нам нужно получить матрицу 3x3 поля.

![powershell-arrays-and-hashtables/5.png](/assets/images/powershell-arrays-and-hashtables/5.png)

```powershell 
$a = @((0..2),(0..2),(0..2))
```
Заполнить элементы массива мы могли бы следующим образом. 

![powershell-arrays-and-hashtables/6.png](/assets/images/powershell-arrays-and-hashtables/6.png)

Чтобы получить таблицу, как показано на рисунке делаем следующее:
```powershell
$a[0][0] = "Mikhail"
$a[0][1] = "Danshin"
$a[0][2] = "mdanshin"

$a[1][0] = "Ivan"
$a[1][1] = "Ivanov"
$a[1][2] = "iivanov"

$a[2][0] = "Sergey"
$a[2][1] = "Petrov"
$a[2][2] = "spetrov"
```

![powershell-arrays-and-hashtables/7.png](/assets/images/powershell-arrays-and-hashtables/7.png)

На первый взгляд может показаться, что работать с большими массивами очень неудобно. Но у них есть одно очень существенное преимущество. Массивы экономичные, в плане расходования памяти и работают быстрее других объектов.

# Хеш-таблицы (hashtables)
Если мы хотим более удобное средство для работы с нашими данными, то можем воспользоваться хеш-таблицами.

Вот какое определение даёт официальная документация.

>Хеш-таблица, также известная как словарь или ассоциативный массив, представляет собой компактную структуру данных, в которой хранится одна или несколько пар ключ/значение.

Простое объявление хеш-таблицы выглядит следующим образом: `$hash = @{}`

Обратите внимание. При объявлении массива мы использовали круглые скобки `@()`. При объявлении хеш-таблицы используются фигурные скобки `@{}`.

Вот пример простой таблицы.

```
$variable = @{ <ключ> = <значение>; [<ключ> = <значение> ] ...}
```
```powershell
$user = @{ FirstName = “Mikhail”; LastName = "Danshin"; UserName = "mdanshin"}
```
Вы можете вывести на экран всё содержимое таблицы или обратиться к отдельным её элементам используя ключ. Например `$user.FirstName`

![powershell-arrays-and-hashtables/8.png](/assets/images/powershell-arrays-and-hashtables/8.png)

Следующий пример демонстрирует создание более сложного объекта, как в случае с многомерным массивом.

```powershell
$users = @{
    user1 = @{
        FirstName = “Mikhail”; 
        LastName = "Danshin"; 
        UserName = "mdanshin"
    }

    user2 = @{
        FirstName = “Ivan”; 
        LastName = "Ivanov"; 
        UserName = "iivanov"
    }

    user3 = @{
        FirstName = “Sergey”; 
        LastName = "Petrov"; 
        UserName = "spetrov"
    }
}
```

В данном случае мы так же можем обратиться ко всем элементам массива, вызывая их значения через ключ. На скриншоте показан пример, как это сделать.

![powershell-arrays-and-hashtables/9.png](/assets/images/powershell-arrays-and-hashtables/9.png)

Если вызвать метод `GetType()`, то мы увидим, с каким объектом мы имеем дело и от какого объекта он унаследован.

![powershell-arrays-and-hashtables/10.png](/assets/images/powershell-arrays-and-hashtables/10.png)

# Отличия массивов от хеш-таблиц
Основное отличие между ними заключается в способах создания обработки и доступа к данным этих объектов. Подведём небольшой итог.

## Инициализация
```powershell
$array="Mikhail Danshin", "Ivan Ivanov", "Sergey Petrov"

$hash = @{ FirstName = “Mikhail”; LastName = "Danshin"; UserName = "mdanshin"}
```

## Доступ к элементам
```powershell
$array[0]

$hash.FirstName
```

## Перебор элементов (looping)
```powershell
foreach ($item in $array) {$item}

foreach($key in $hash.keys)
{
    $key # Вывести каждый ключ

    # Вывести значение каждого ключа
    $hash.$key 
    #или
    $hash[$key]
}
```

## Инициализация пустого объекта
```powershell
$array=@()

$hash=@{}
```

## Добавление элемента в объект
```powershell
$array += 1
$array += 2
$array += 3

$hash.Add('FirstName', 'Mikhail')
$hash.Add('LastName', 'Danshin')
$hash.Add('UserName', 'mdanshin')
```

## Удаление элемента из объекта
***Формально, удалить элемент из массива нельзя, т.к. массив имеет фиксированный размер.
Вызовите метод `IsFixedSize` и вы увидите, что он выведет значение `true`, в случае с `$array` и `false` в случае с `$hash`.***

![powershell-arrays-and-hashtables/11.png](/assets/images/powershell-arrays-and-hashtables/11.png)

Но можно создать новый массив, с тем же именем, в который вы включите только те элементы, которые нужно оставить.
```powershell
$array = @($array[0], $array[2])  
```
В свою очередь объект типа `hashtable` имеет метод `Remove()`
```powershell
$hash.Remove('UserName')
```

## Инициализация многомерного массива
```powershell
$array = @(1, 2, 3), @(4, 5, 6), @(7, 8, 9)

$array[0]    # 1
$array[0][0]  # 1
$array[2][2]  # 9
```

# Что ещё

Дополнения к вышеописанным объектам существуют ещё объекты `ArrayList`, `OrderedDictionary`, `PSObject`, которые могут быть полезны вам для хранения и обработки значений. Возможно в дальнейшем я опишу их в отдельной статье. И расскажу про отличия от массивов и хеш-таблиц. Но пока я этого не сделал, то настоятельно рекомендую Вам самостоятельно поискать в Интернет информацию о `PSObject`. Это мощное средство, которое в чём-то похоже на `Hashtable`, при этом обладает большей производительностью.

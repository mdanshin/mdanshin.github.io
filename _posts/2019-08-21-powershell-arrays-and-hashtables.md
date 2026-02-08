---
layout: post
title:  "Базовые сведения о массивах и хеш-таблицах в Powershell"
title_en: "PowerShell Arrays and Hashtables: The Basics"
categories: [ Программирование ]
tags: [ powershell ]
image: assets/images/powershell-arrays-and-hashtables/0.jpg
author: Mikhail
---

<div data-lang="ru" markdown="1">
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

</div>

<div data-lang="en" markdown="1">
***As you know, PowerShell is an object-oriented scripting language. Almost everything we deal with in PowerShell is an object. That's why it's important to understand how objects work in PowerShell, what types of objects exist, and how they differ.***

Sometimes we may need to create our own objects. For efficiency, we should choose the object/data structure that best fits the task and know how to work with it.

In this post I try to organize my own knowledge (which I also got only recently). It's not meant to be complete — a full introduction to the topic could easily become a whole book, especially considering that PowerShell 5.0 introduced classes.

I assume you are familiar with basic OOP concepts. If you know what a variable, object, field, property, method, inheritance, and an object instance are — you may already know most of what is written here. I'd be happy to get feedback and additions.

Arrays and hashtables are basic data structures you should understand to work effectively with PowerShell.

# Arrays

I used to rely on arrays all the time — they were my favorite tool until I learned about hashtables (covered below). An empty array can be declared like this: `$info = @()`.

Here is the simplest example of an array:

```powershell
$info = "Mikhail Danshin", "Ivan Ivanov", "Sergey Petrov"
```

Let's quickly see what we got. If you run `$info | Get-Member`, you'll see objects of type `System.String`.

![powershell-arrays-and-hashtables/1.png](/assets/images/powershell-arrays-and-hashtables/1.png)

If you use `GetType()`, you'll see that `$info` is an array object (inherited from `System.Array`).

![powershell-arrays-and-hashtables/2.png](/assets/images/powershell-arrays-and-hashtables/2.png)

So we have an array of `String` elements inside an `Array` object.

To access array elements, use an index:

`$info[0]`, `$info[1]`, `$info[2]`, or output the entire array with `$info`.

![powershell-arrays-and-hashtables/3.png](/assets/images/powershell-arrays-and-hashtables/3.png)

To iterate all elements, you can use a `foreach` loop, for example:

```powershell
foreach ($item in $info) { write-host "The user name is " $item }
```

![powershell-arrays-and-hashtables/4.png](/assets/images/powershell-arrays-and-hashtables/4.png)

But sometimes we need more complex objects with multiple fields, e.g. **FirstName**, **LastName**, and **UserName**.

We could create a multi-dimensional array. For example, a 3x3 matrix:

![powershell-arrays-and-hashtables/5.png](/assets/images/powershell-arrays-and-hashtables/5.png)

```powershell
$a = @((0..2),(0..2),(0..2))
```

We can fill it like this:

![powershell-arrays-and-hashtables/6.png](/assets/images/powershell-arrays-and-hashtables/6.png)

To get a table like in the screenshot:

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

Working with large arrays may look inconvenient, but arrays have an important advantage: they are memory-efficient and faster than many other structures.

# Hashtables

If we want a more convenient way to work with our data, we can use hashtables.

Here is how the official documentation defines it:

> A hashtable, also known as a dictionary or associative array, is a compact data structure that stores one or more key/value pairs.

A simple hashtable declaration looks like this: `$hash = @{}`.

Note the difference: arrays use `@()` and hashtables use `@{}`.

Example of a simple hashtable:

```
$variable = @{ <key> = <value>; [<key> = <value> ] ...}
```

```powershell
$user = @{ FirstName = “Mikhail”; LastName = "Danshin"; UserName = "mdanshin"}
```

You can output the whole hashtable or access individual elements by key, for example: `$user.FirstName`.

![powershell-arrays-and-hashtables/8.png](/assets/images/powershell-arrays-and-hashtables/8.png)

The next example demonstrates a more complex structure (similar to the multi-dimensional array case):

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

You can access nested values through keys. The screenshot shows an example.

![powershell-arrays-and-hashtables/9.png](/assets/images/powershell-arrays-and-hashtables/9.png)

If you call `GetType()`, you'll see the actual object type and what it inherits from.

![powershell-arrays-and-hashtables/10.png](/assets/images/powershell-arrays-and-hashtables/10.png)

# Differences between arrays and hashtables

The main differences are how you create, access, and process data. Here's a quick summary.

## Initialization

```powershell
$array="Mikhail Danshin", "Ivan Ivanov", "Sergey Petrov"

$hash = @{ FirstName = “Mikhail”; LastName = "Danshin"; UserName = "mdanshin"}
```

## Accessing elements

```powershell
$array[0]

$hash.FirstName
```

## Looping

```powershell
foreach ($item in $array) {$item}

foreach($key in $hash.keys)
{
    $key # print each key

    # print the value for each key
    $hash.$key
    # or
    $hash[$key]
}
```

## Initializing an empty object

```powershell
$array=@()

$hash=@{}
```

## Adding an element

```powershell
$array += 1
$array += 2
$array += 3

$hash.Add('FirstName', 'Mikhail')
$hash.Add('LastName', 'Danshin')
$hash.Add('UserName', 'mdanshin')
```

## Removing an element

***Formally, you cannot remove an element from an array because arrays have a fixed size.
Call `IsFixedSize` and you'll see `true` for `$array` and `false` for `$hash`.***

![powershell-arrays-and-hashtables/11.png](/assets/images/powershell-arrays-and-hashtables/11.png)

However, you can create a new array (with the same variable name) that contains only the elements you want to keep:

```powershell
$array = @($array[0], $array[2])
```

A `hashtable` has a `Remove()` method:

```powershell
$hash.Remove('UserName')
```

## Initializing a multi-dimensional array

```powershell
$array = @(1, 2, 3), @(4, 5, 6), @(7, 8, 9)

$array[0]    # 1
$array[0][0]  # 1
$array[2][2]  # 9
```

# What else

Besides arrays and hashtables, there are other useful objects like `ArrayList`, `OrderedDictionary`, and `PSObject` which can help with storing and processing data. Maybe I'll cover them in a separate post later.

For now, I highly recommend reading about `PSObject` yourself — it's a powerful tool, similar to `Hashtable` in some ways, and can be more performant.
</div>

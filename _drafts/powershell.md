Задача была получить информацию, сколько в каждой из папок находится файлов и каков их суммарный размер, и вывести всё это в удобном виде. Решил задачу вот таким образом.

#Блок переменных
$startPath = 'C:\' #Начальный путь
$fileTypes = @("*.gif", "*.txt") #Типы файлов, которые будут учитываться. Можно добавлять дополнительные типы.

#Получаем список папок в стартовом пути
$folders = Get-ChildItem $startPath -Directory

#Заходим в каждую папку ...
foreach ($folder in $folders)
{
    #... рекурсивно получаем все файлы определённого типа ...
    Get-ChildItem $folder.PSPath -Recurse -Include $fileTypes -ErrorAction SilentlyContinue -ErrorVariable accessError | 

    #... и передаём в  Measure-Object
    Measure-Object -property Length -Sum | 
  
    #Выбираем только интересующие нас свойства и выводим их в табличном виде
    Select-Object `
      @{Name="Path"; Expression={$folder.FullName}}, 
      @{Name="Files"; Expression={$_.Count}}, 
      @{Name="Size"; Expression={$_.Sum}}
} 

Вот такой результат получился
 
 pic1
 ![powershell/1.png](/assets/images/powershell/1.png)

Если убрать «-Directory», то получим ещё и список файлов в корне стартовой директории.
 
 pic2
 ![powershell/2.png](/assets/images/powershell/2.png)

По ходу работы над скриптом сделал для себя несколько открытий и опробовал несколько практик, которые раньше не применял.

1.	Узнал о командлете «Measure-Object».
2.	Узнал о «Expression».
3.	Опробовал «ErrorAction» и «ErrorVariable».
4.	Опробовал «условное форматирование».

Далее обо всём этом несколько подробнее.

Обратите внимание на «-ErrorAction SilentlyContinue» и «-ErrorVariable accessError». Сделано для того, чтобы не захламлять вывод всевозможными ошибками. Пару слов о «ErrorAction» и «ErrorVariable». Оба они являются «Common» параметрами, то есть присутствующими во всех командлетах. «ErrorAction» может принимать следующие значения:

0. SilentlyContinue –Продолжить выполнение не выводя ошибку на экран
1. Stop		–  Вывести ошибку и остановить программу
2. Continue		
3. Inquire
4. Ignore 
5. Suspend 

 pic3
 ![powershell/3.png](/assets/images/powershell/3.png)

Последовательность и цифры здесь не случайны. Но об этом позже.

 
pic4
![powershell/4.jpg](/assets/images/powershell/4.jpg)

Почитать про « Expression» и форматирование текста
"{0:N0} MB" -f ($_.Sum/1MB) 

Select-Object `
      @{Name="Path"; Expression={$folder.FullName}}, 
      @{Name="Files"; Expression={$_.Count}}, 
      @{Name="Size"; Expression={"{0:N0} MB" -f ($_.Sum/1MB)}} 


Дополнительные материалы:
https://docs.microsoft.com/en-us/powershell/module/microsoft.powershell.utility/measure-command?view=powershell-6

About Try Catch Finally
https://docs.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_try_catch_finally?view=powershell-6

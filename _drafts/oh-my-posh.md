---
layout: post
title:  "Улучшение командной строки в PowerShell, WSL и VSCode"
categories: [ Другое ]
tags: [ powershell, wsl, vscode, windows terminal ]
image: assets/images/oh-my-posh/0.jpeg
author: Mikhail
---
***Последнее время стало модным использовать продвинутую командную строку в PowerShell или bash/zsh. В этой статье я расскажу, что нужно сделать в PowerShell, WSL, Windows Termianl и VSCode, чтобы кастомизировать командную строку и воспользоваться всеми её преимуществами.***

![assets/images/oh-my-posh/1.png](/assets/images/oh-my-posh/1.png)

Краткий план действий:

* [Установка шрифта Nerd](#Установка-шрифта-Nerd)
* [Установка и настройка Oh My Posh для PowerShell](#ps)
* [Установка и настройка Oh My Posh для WSL](#wsl)
* [Настройка Windows Terminal для правильного отображения глифов](#terminal)
* [Настройка Windows VSCode для правильного отображения глифов](#vscode)

Из официально документации я мало что понял. Пришлось разбираться самому. Поэтому сейчас я по порядку опишу путь, который пришлось пройти мне, чтобы заставить всё работать как надо. 

<a name="nerd"></a>

# Установка шрифта Nerd 

![assets/images/oh-my-posh/5.png](/assets/images/oh-my-posh/5.png)

На картинке выше, показаны некоторые варианты оформления (тем) командной строки. На самом деле таких тем много, и вы можете их изменять и создавать свои. Как вы видите, почти все варианты содержат глифы (графические символы). Если шрифт, который используется в терминале, не содержит соответствующие глифы, в командной строке могут появиться символы замены, например квадрат - ▯ или знак вопроса �. Чтобы в терминале отображались все глифы, нужно сначала установить шрифт Nerd с сайта проекта https://www.nerdfonts.com/.

> Nerd Fonts улучшает предназначенные для разработчиков шрифты с большим количеством глифов (значков). В частности, чтобы добавить большое количество дополнительных глифов из популярных «культовых шрифтов», таких как Font Awesome, Devicons, Octicons и других.

Посмотрев несколько шрифтов, я остановил свой выбор на [Caskaydia Cove Nerd Font](https://github.com/ryanoasis/nerd-fonts/releases/download/v2.1.0/CascadiaCode.zip). 

Все шрифты можно посмотреть по ссылке https://www.nerdfonts.com/font-downloads.

Скачав нужный шрифт, нужно его установить. Заходим в архив, выбираем нужный шрифт и открываем его.

![assets/images/oh-my-posh/3.png](/assets/images/oh-my-posh/3.png)

А затем, в открывшемся окне, нажимаем кнопку Install

![assets/images/oh-my-posh/4.png](/assets/images/oh-my-posh/4.png)

Шрифт установлен, можно переходить к следующему шагу - установке Oh My Posh.

<a name="ps"></a>

# Установка и настройка Oh My Posh для PowerShell

Как сказано в официальной [документации](https://ohmyposh.dev/docs/), `Oh My Posh` — это настраиваемый механизм командной строки, для любой оболочки, которая имеет возможность настроить командную строку с помощью функции или переменной. Чтобы воспользоваться этим механизмом в PowerShell, нужно установить и импортировать соответствующий модуль.

Запустите PowerShell от имени администратора.
Выполните команду `Set-ExecutionPolicy RemoteSigned`

![assets/images/oh-my-posh/6.png](/assets/images/oh-my-posh/6.png)

```
Install-Module oh-my-posh -Scope CurrentUser
```

Если пакетный менеджер NuGet ещё не установлен, то PowerShell запросит разрешение на его установку. Введите `Y` и нажмите `Enter`.

Далее вас предупредят, что вы собираетесь ставить пакет из недоверенного репозитория `PSGallery`. На самом деле всё нормаль. Просто изначально все репозитории считаются недоверенными. Можете смоело продолжать установку введя `Y` и нажав `Enter`.

![assets/images/oh-my-posh/7.png](/assets/images/oh-my-posh/7.png)

Обновите профиль PowerShell, отредактировав файл `Microsoft.PowerShell_profile.ps1`. Самым простым способом открытия этого файла, явялется выполнение следующей команды.

```
notepad $PROFILE
```

Если файла не существует, то система предложет вам его создать. Нажмите Yes в диалоговом окне.

![assets/images/oh-my-posh/8.png](/assets/images/oh-my-posh/8.png)

Добавьте следующий фрагмент в конце файла. Вместо `paradox` можете написать название другой темы. Я для себя выбрал 

```
Import-Module oh-my-posh
Set-PoshPrompt -Theme jandedobbeleer
```

Теперь каждый новый экземпляр PowerShell будет запущен с импортом Oh My Posh и установкой темы командной строки.

Запустите новый экземляр PowerShell. При первом запуске вы можете увидеть процесс импорта устоановленного ранее модуля `Oh My Posh`. Он выполниться один раз. Все последующие запуски PowerShell будут проходить как обычно.

![assets/images/oh-my-posh/9.png](/assets/images/oh-my-posh/9.png)

После запуска вы увидите обновлённую командную строку, как показано на картинке ниже. Обратите внимание, что не все символы отображатся корректно. Это связано с тем, что в терминале PowerShell сейчас используется шрифт, который не поддерживает глифы.

>Как еустановить шрифт с поддержкой глифов, смотри в начале статьи.

![assets/images/oh-my-posh/10.png](/assets/images/oh-my-posh/10.png)

Зайдите в настройки терминала PowerShell и выберите шрифт с поддержкой глифов, который вы установили ранее. Или установите его сейчас, если вы пропустили этот шаг.

![assets/images/oh-my-posh/13.png](/assets/images/oh-my-posh/13.png)

![assets/images/oh-my-posh/11.png](/assets/images/oh-my-posh/11.png)

Как только вы установите правильный шрифт, вы сразу же увидите правильно отображение командной строки.

![assets/images/oh-my-posh/12.png](/assets/images/oh-my-posh/12.png)

<a name="wsl"></a>

# Установка и настройка Oh My Posh для WSL

> Если вы используете Windows 10 версии 2004 и выше (Build 19041 и выше) или Windows 11, и у вас ещё не установлен WSL, но вы хотите его установить, то запустите команду `wsl --install` в терминале powershell с повышенными привилегиями, а после установки WSL перезапустите Windows. Более подробные сведения об установке и настройке WSL смотрите в моей статье "Установка и настройка WSL"

Для установки oh-my-posh в Linux (WSL) нам потребуется пакетный менеджер [Homebrew](https://brew.sh/). Поэтому сначала установите его, выполнив следующую команду.

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

После того, как `brew` установлен, нужно выполнить следующую команду, чтобы добавить `Homebrew` в `PATH` и в сценарий профиля оболочки `bash`.

```bash
test -d ~/.linuxbrew && eval "$(~/.linuxbrew/bin/brew shellenv)"
test -d /home/linuxbrew/.linuxbrew && eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
test -r ~/.bash_profile && echo "eval \"\$($(brew --prefix)/bin/brew shellenv)\"" >> ~/.bash_profile
echo "eval \"\$($(brew --prefix)/bin/brew shellenv)\"" >> ~/.profile
```

После установки и настройки `brew`, можно приступать к установке `oh-my-posh`. Выполните следубщие команды.

```bash
brew tap jandedobbeleer/oh-my-posh
brew install oh-my-posh
```

```bash
sudo apt install unzip
```

```bash
mkdir -p $(brew --prefix)/oh-my-posh/themes
wget https://github.com/JanDeDobbeleer/oh-my-posh/releases/latest/download/themes.zip -O $(brew --prefix)/oh-my-posh/themes/themes.zip
unzip $(brew --prefix)/oh-my-posh/themes/themes.zip -d $(brew --prefix)/oh-my-posh/themes
chmod u+rw $(brew --prefix)/oh-my-posh/themes/*.json
rm $(brew --prefix)/oh-my-posh/themes/themes.zip
```

```bash
cp $(brew --prefix)/oh-my-posh/themes/jandedobbeleer.omp.json ~/jandedobbeleer.omp.json
```

```bash
eval "$(oh-my-posh --init --shell bash --config ~/jandedobbeleer.omp.json)"
```

<a name="terminal"></a>

# Настройка Windows Terminal для правильного отображения глифов

После запуска Windows Terminal вам нужно будет тольк сменить шрифт, иначе командная строка будет отображаться без глифов.

![assets/images/oh-my-posh/16.png](/assets/images/oh-my-posh/16.png)

Чтобы это исправить, зайдите в настройки Windows Terminal, выберите профиль по умолчанию и на вкладке `Appearance` установите нужный шрифт. Затем нажите `Save` и откройте новое окно терминала.

![assets/images/oh-my-posh/17.png](/assets/images/oh-my-posh/17.png)

На этот раз командная строка будет отображать глифы, но есть одна проблема. При открытии WSL-терминала, первая командная строка отображается с дефектом. В ней присутствуют пропуски. Я не понял почему это происходит. Если нажать `Enter`, то следующая строка отобразиться нормально.

![assets/images/oh-my-posh/17.png](/assets/images/oh-my-posh/17.png)

Я не придумал ничего лучше, чем добавить команду очистки экрана в файл `.profile`, чтобы она выполнялась каждый раз, при запуске сессии.

```bash
echo "clear" >> ~/.profile 
```

Теперь, если переоткрыть терминал, то всё будет выглядеть как надо.

![assets/images/oh-my-posh/19.png](/assets/images/oh-my-posh/19.png)

И на этом часть по настройке Windows Terminal завершена. Посмотрите другю мою статью, где я описываю, как настроить более приятный вид Windows Terminal.

<a name="code"></a>

# Настройка VSCode для правильного отображения глифов

Если вы откроете VS Code, и в нём откроете Terminal, то вы увидите, что лифы в нём тоже отображатся неправильно. Всё дело в настройках шрифтов.

![assets/images/oh-my-posh/19.png](/assets/images/oh-my-posh/19.png)

Зайдите в настройки, выберите `Terminal`, пролистайте до настройки `Integrated: Font Family` и введите название своего шрифта. В моём случае это `CaskaydiaCove NF`. Полное название настройки `terminal.integrated.fontFamily`.

![assets/images/oh-my-posh/20.png](/assets/images/oh-my-posh/20.png)

Если вы используете плагин `Remote - WSL` в VS Code, то возможно вам пригодится ещё один совет. Дело в том, что когда вы откроете новую сессию в WSL в VS Code, то заметите, что там ничего не поменялось. VS Code, при запуске bash в WSL, не читает данные из файла .profile, которые мы туда поместили.

![assets/images/oh-my-posh/21.png](/assets/images/oh-my-posh/21.png)

Чтобы это исправить, можно ввести команду

```bash
bash -l
```

Параметр -l (согласно справочной странице) заставляет «bash действовать так, как если бы он был вызван как оболочка входа в систему». Оболочки входа читают определенные файлы инициализации из вашего домашнего каталога, такие как `.profile`. Но чтобы не делать это каждый раз вручную, давайте изменим конфигурацию VS Code.

К уже имеющмся настройкам, если они есть, добавьте следующие. Сохраните и перезапустите WSL-сессию. На этот раз у Вас всё должно отображаться правильно.

![assets/images/oh-my-posh/22.png](/assets/images/oh-my-posh/22.png)

```json
"terminal.integrated.defaultProfile.linux": "bash",
    "terminal.integrated.profiles.linux": {
        "bash": {
            "path": "bash",
            "args": [
                "-l"
            ]
        }
    }
```

Вот и всё, чем я хотел поделиться в этой статье. Оставльяйте свои комментарии и отзывы. Всем мира и добра!
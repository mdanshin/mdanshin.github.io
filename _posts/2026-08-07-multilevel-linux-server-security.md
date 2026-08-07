---
layout: post
title: "Многоуровневая защита Linux-сервера с Telegram-мониторингом"
title_en: "Layered Linux Server Security with Telegram Monitoring"
categories: [ Администрирование ]
tags: [ Linux, Security, SSH, firewalld, Fail2ban, CrowdSec, AIDE, Telegram ]
image: assets/images/ssh-base/0.jpg
author: Mikhail
---

<div data-lang="ru" markdown="1">

Практическое руководство для Debian/Ubuntu и RHEL-подобных систем

> Версия статьи: 1.0, 7 августа 2026 года. Решение основано на реально работающей конфигурации CentOS Stream 9 и повторно сверено с её фактическим состоянием. Все адреса, ключи, токены, идентификаторы чатов и другие секреты исключены.

## Что мы строим

В этом руководстве мы собираем эшелонированную систему защиты Linux-сервера. Её компоненты решают разные задачи: ограничивают сетевой доступ, защищают SSH, обнаруживают и блокируют атаки, контролируют изменения важных файлов и сообщают администратору о событиях, требующих внимания. Сервер продолжает работать автономно: Telegram используется для уведомлений, а полные отчёты остаются на самом сервере.

После настройки сервер принимает только тот сетевой трафик, который нужен его сервисам. SSH допускает вход по ключам через отдельную административную учётную запись; root-вход и пароли отключены. Повторные попытки подбора автоматически блокируются, более сложные сценарии атак выявляет CrowdSec, целостность системных файлов контролирует AIDE, а обновления безопасности устанавливаются по расписанию. Все эти механизмы работают на самом сервере и не требуют постоянного участия администратора.

Администратор при этом видит, что происходит с защитой, и узнаёт о событиях, которые требуют проверки:

- сразу после входа по SSH или использования `sudo` приходит оперативное уведомление;
- после планового сканирования AIDE или rkhunter отправляется тревога, если найдены изменения или предупреждения;
- один раз в день приходит краткий отчёт о блокировках, неудачных SSH-попытках, памяти, диске, load average, необходимости перезагрузки и состоянии защитных сервисов.

Если Telegram недоступен, вход по SSH не блокируется. Плановые проверки продолжаются, а их отчёты сохраняются локально с правами `0600 root:root`. Это важная часть конструкции: канал оповещения может сломаться, но сбой уведомлений не должен превращаться в отказ сервера или уничтожать данные для расследования.

### Как устроена защита

Первый слой — сетевой firewall. Он разрешает только те порты, которые сервер действительно обслуживает: например, HTTPS и выбранный порт SSH. Всё остальное отбрасывается до того, как запрос попадёт в приложение. В этом решении `firewalld` управляет правилами nftables.

За firewall работает усиленный SSH:

- вход `root` запрещён;
- парольная и keyboard-interactive аутентификация отключены;
- доступ разрешён по публичным ключам;
- число попыток аутентификации ограничено;
- административная работа выполняется через отдельного пользователя и `sudo`;
- нестандартный порт уменьшает фоновый шум в журналах, хотя сам по себе не считается защитой.

Fail2ban читает журнал SSH и реагирует на повторяющиеся ошибки с одного адреса. После нескольких неудачных попыток он добавляет временное правило в firewall. Отдельный jail `recidive` может блокировать повторных нарушителей дольше. Принципиальная деталь: Fail2ban должен знать фактический числовой порт SSH. Значение `port = ssh` обычно означает порт 22 и не подходит, если sshd перенесён, например, на 2207.

CrowdSec решает другую задачу. Он анализирует SSH, системные и web-журналы по готовым сценариям, учитывает коллективную репутацию адресов и создаёт решения о блокировке. Сам Security Engine только обнаруживает события. Чтобы решения влияли на трафик, устанавливается firewall bouncer, который получает их через локальный API и применяет через nftables. Fail2ban и CrowdSec частично пересекаются, но работают на разных данных: Fail2ban хорошо закрывает простой локальный brute force, а CrowdSec распознаёт больше сценариев и использует общую базу наблюдений.

### Что происходит после успешного входа

SSH остаётся под контролем PAM. Когда открывается новая сессия, небольшой root-owned скрипт получает имя пользователя, удалённый адрес, сервис и TTY, экранирует эти значения и отправляет сообщение в Telegram. Такой же hook можно подключить к `sudo`, если администратору нужны уведомления о повышении привилегий.

PAM hook объявлен как `optional`. Он запускает отправку отдельно и всегда разрешает процессу входа продолжиться. Текст из PAM передаётся скрипту как данные, а не вставляется в `eval` или динамически создаваемую shell-команду. Это одновременно защищает от command injection и не создаёт зависимость доступа к серверу от Telegram API.

### Как контролируются файлы и состояние системы

AIDE строит базу контрольных сумм, владельцев, прав и других метаданных для выбранных файлов. Ежедневная проверка сравнивает текущее состояние с базой. Если файл добавлен, удалён или изменён, Telegram получает короткую сводку и первые пути, а полный отчёт записывается в root-only каталог. База не обновляется автоматически: иначе злоумышленник или ошибочное обновление могли бы незаметно стать новым «нормальным» состоянием.

rkhunter запускается отдельно и ищет известные признаки rootkit, подозрительные разрешения и необычные системные объекты. Его результаты требуют проверки человеком: этот инструмент эвристический и может реагировать на легитимные обновления. Команда `rkhunter --propupd` также не выполняется автоматически, потому что она объявляет текущее состояние доверенным.

Обе проверки запускают systemd timers ночью со случайной задержкой. `flock` не позволяет двум копиям тяжёлого сканера работать одновременно, `TimeoutStartSec` ограничивает зависший запуск, а logrotate сжимает и удаляет старые отчёты по заданной политике.

### Как система сообщает о собственных неисправностях

Мониторинг полезен только тогда, когда контролирует не только сервер, но и себя. Поэтому ежедневный дайджест не ограничивается проверкой, что timer включён. Для каждого oneshot-сервиса он читает `Result` и `ExecMainStatus` последнего запуска. Это позволяет отличить нормальный завершившийся AIDE scan от таймера, который формально активен, но уже несколько дней запускает падающий скрипт.

Telegram-токен и chat ID хранятся в отдельном root-only файле. Общая функция отправки задаёт короткие сетевые timeout, проверяет HTTP-ответ и поле `ok` в JSON, ограничивает длину сообщения и использует HTML escaping. Секреты и текст сообщения не передаются в аргументах процесса `curl`.

Автоматические security-обновления закрывают известные уязвимости через `unattended-upgrades` или `dnf-automatic`. Автоматическая перезагрузка выключена: если новое ядро или библиотека требуют reboot, это попадает в ежедневный дайджест. AIDE-база после обновления пакетов не принимается автоматически. Администратор сначала сверяет изменения с журналом пакетного менеджера и только потом вручную обновляет baseline.

### Как выглядит работа системы в обычный день

При штатной работе сервер почти не беспокоит администратора. Fail2ban применяет локальные баны, а CrowdSec firewall bouncer — решения CrowdSec. Чистые проверки AIDE и rkhunter не отправляют тревог. Один раз в день приходит короткий health report. Полные технические журналы остаются на сервере и ротируются.

Если начинается перебор SSH, Fail2ban блокирует источник после заданного числа ошибок. CrowdSec может независимо создать более широкое решение. Если кто-то успешно входит, администратор сразу видит пользователя и источник подключения. Если после обновления или взлома меняются системные файлы, AIDE показывает конкретные пути. Если сканер, Telegram API или systemd unit ломается, ошибка становится видна через статус сервиса и дайджест, а не теряется молча.

```text
Интернет
   │
   ├── firewalld / nftables ───────────── разрешает только нужные порты
   │
   ├── Fail2ban ───────────────────────── банит повторные ошибки SSH
   │
   ├── CrowdSec + firewall bouncer ───── сценарии атак и репутация адресов
   │
   └── sshd ───────────────────────────── ключи, запрет root и паролей
          │
          └── PAM ─────────────────────── уведомление о входе и sudo

Файловая система ── AIDE ─────────────── контроль целостности
Хост ────────────── rkhunter ──────────── дополнительная эвристика
Пакеты ──────────── unattended-upgrades /
                     dnf-automatic ────── security-обновления

systemd timers ──── расписание и состояние последних запусков
Telegram ────────── тревоги и ежедневный health report
Локальные журналы ─ полные root-only данные для расследования
```

Эта система уменьшает риск перебора учётных данных, входа с украденным паролем, незамеченных атак из web- и системных журналов, скрытых изменений файлов и пропущенных обновлений. Она также сокращает время между событием и реакцией администратора.

Она не заменяет резервные копии, TLS, безопасную разработку приложений, хранение секретов, защиту панели VPS-провайдера и заранее проверенный план восстановления после компрометации. Если злоумышленник уже получил полный root-доступ, локальные инструменты и отчёты тоже могут быть изменены. Для серверов с повышенными требованиями журналы дополнительно отправляют на отдельный хост или в SIEM, а базу AIDE хранят вне проверяемой машины.

## Поддерживаемые системы

Основной путь рассчитан на:

- Debian 12+ и Ubuntu 22.04+;
- RHEL 9, Rocky Linux 9, AlmaLinux 9, CentOS Stream 9;
- Fedora с поправкой на названия пакетов.

Команды выполняются от обычного административного пользователя через `sudo`. Перед началом убедитесь, что доступна аварийная web/VNC/serial-консоль VPS-провайдера.

## Важные правила безопасности

1. Не закрывайте текущую SSH-сессию, пока вход по ключу не проверен во второй сессии.
2. Сначала откройте новый SSH-порт в firewall, затем меняйте `sshd`.
3. Перед изменением PAM, SSH и firewall создавайте резервные копии.
4. Не обновляйте базу AIDE автоматически после тревоги. Сначала исследуйте каждое изменение.
5. Не храните Telegram-токен в Git, истории shell, аргументах процессов или доступных всем файлах.
6. Не используйте постоянный `NOPASSWD: ALL` для обычной учётной записи. Если автоматизации действительно нужен root, выделите отдельного пользователя и отдельный ключ.
7. CrowdSec без remediation component обнаруживает события, но не блокирует их.
8. Активный systemd timer не доказывает успешность последнего запуска. Проверяйте `Result` и `ExecMainStatus` сервиса.

---

# Часть I. Подготовка

## 1. Определяем дистрибутив и создаём резервную копию

```bash
. /etc/os-release
printf 'OS=%s %s\n' "$ID" "$VERSION_ID"
uname -r
command -v systemctl sudo curl python3 flock
```

Создайте каталог резервной копии:

```bash
BACKUP="/root/server-security-backup-$(date +%Y%m%d-%H%M%S)"
sudo install -d -m 0700 "$BACKUP"

sudo cp -a /etc/ssh "$BACKUP/ssh"
sudo cp -a /etc/pam.d "$BACKUP/pam.d"
sudo cp -a /etc/fail2ban "$BACKUP/fail2ban" 2>/dev/null || true
sudo firewall-cmd --list-all 2>/dev/null \
  | sudo tee "$BACKUP/firewalld-before.txt" >/dev/null || true
sudo nft list ruleset 2>/dev/null \
  | sudo tee "$BACKUP/nft-before.txt" >/dev/null || true
sudo systemctl list-unit-files \
  | sudo tee "$BACKUP/unit-files-before.txt" >/dev/null
```

Не копируйте архив с секретами в публичное хранилище. Каталог должен оставаться `root:root 0700`.

## 2. Устанавливаем базовые пакеты

### Debian/Ubuntu

```bash
sudo apt update
sudo apt install -y \
  openssh-server curl ca-certificates python3 util-linux \
  fail2ban aide rkhunter logrotate unattended-upgrades
```

Установите `firewalld`:

```bash
sudo apt install -y firewalld
```

### RHEL/Rocky/Alma/CentOS Stream/Fedora

```bash
sudo dnf install -y epel-release
sudo dnf install -y \
  openssh-server curl ca-certificates python3 util-linux \
  firewalld fail2ban fail2ban-firewalld aide rkhunter \
  logrotate dnf-automatic
```

Не включайте новый firewall, пока в его постоянной конфигурации не разрешён **текущий** SSH-порт:

```bash
CURRENT_SSH_PORT=$(sudo sshd -T | awk '$1 == "port" {print $2; exit}')
test -n "$CURRENT_SSH_PORT"

if systemctl is-active --quiet firewalld; then
  sudo firewall-cmd --permanent \
    --add-port="${CURRENT_SSH_PORT}/tcp"
  sudo firewall-cmd --reload
else
  sudo firewall-offline-cmd --zone=public \
    --add-port="${CURRENT_SSH_PORT}/tcp"
  sudo systemctl enable --now firewalld
fi

sudo firewall-cmd --query-port="${CURRENT_SSH_PORT}/tcp"
```

Проверьте пакеты и сервисы, а не полагайтесь на отсутствие ошибок в установщике:

```bash
systemctl is-active sshd 2>/dev/null || systemctl is-active ssh
systemctl is-active firewalld
command -v fail2ban-client aide rkhunter curl python3 flock
```

---

# Часть II. SSH и firewall без риска потерять доступ

## 3. Создаём административного пользователя и ключ

На **клиентском компьютере**, не на сервере:

```bash
ssh-keygen -t ed25519 -a 64 -C "admin@my-server"
```

Приватный файл `~/.ssh/id_ed25519` никогда никому не передавайте. На сервер устанавливается только `.pub`.

На сервере:

```bash
id -u admin >/dev/null 2>&1 \
  || sudo useradd --create-home --shell /bin/bash admin

if getent group sudo >/dev/null; then
  sudo usermod -aG sudo admin      # Debian/Ubuntu
elif getent group wheel >/dev/null; then
  sudo usermod -aG wheel admin     # RHEL-подобные
else
  echo 'Не найдена административная группа sudo/wheel' >&2
  exit 1
fi

sudo install -d -o admin -g admin -m 0700 /home/admin/.ssh
sudo test -e /home/admin/.ssh/authorized_keys \
  || sudo install -o admin -g admin -m 0600 /dev/null \
       /home/admin/.ssh/authorized_keys
sudo chown admin:admin /home/admin/.ssh/authorized_keys
sudo chmod 0600 /home/admin/.ssh/authorized_keys
```

Добавьте публичный ключ, не перезаписывая существующие:

```bash
printf '%s\n' 'ssh-ed25519 ЗАМЕНИТЕ_НА_СВОЙ_ПУБЛИЧНЫЙ_КЛЮЧ' \
  | sudo tee -a /home/admin/.ssh/authorized_keys >/dev/null
sudo sort -u -o /home/admin/.ssh/authorized_keys /home/admin/.ssh/authorized_keys
sudo chown admin:admin /home/admin/.ssh/authorized_keys
sudo chmod 0600 /home/admin/.ssh/authorized_keys
sudo restorecon -RF /home/admin/.ssh 2>/dev/null || true
```

Во второй локальной вкладке проверьте вход, запретив fallback на пароль:

```bash
ssh -o BatchMode=yes -o IdentitiesOnly=yes \
  -i ~/.ssh/id_ed25519 admin@SERVER_IP 'id; sudo -n true || true'
```

Если ключ не работает, **не отключайте пароль**.

## 4. Выбираем SSH-порт и заранее открываем firewall

Нестандартный порт уменьшает шум в логах, но не является самостоятельной защитой. В примерах используется переменная:

```bash
SSH_PORT=2207
```

Откройте новый порт до изменения SSH:

```bash
sudo firewall-cmd --permanent --add-port="${SSH_PORT}/tcp"
sudo firewall-cmd --reload
sudo firewall-cmd --query-port="${SSH_PORT}/tcp"
```

Если сервер предоставляет только SSH и web, итоговый firewall может выглядеть так:

```bash
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --remove-service=ssh
sudo firewall-cmd --reload
sudo firewall-cmd --list-all
```

Удаляйте стандартный `ssh` service только после проверки нового порта.

## 5. Усиливаем sshd

Лучше использовать отдельный drop-in:

```bash
sudo install -d -m 0755 /etc/ssh/sshd_config.d
sudoedit /etc/ssh/sshd_config.d/60-hardening.conf
```

Содержимое:

```sshconfig
Port 2207
PermitRootLogin no
PubkeyAuthentication yes
PasswordAuthentication no
KbdInteractiveAuthentication no
MaxAuthTries 3
X11Forwarding no
ClientAliveInterval 300
ClientAliveCountMax 2
UsePAM yes
```

Проверьте синтаксис и эффективные значения:

```bash
sudo sshd -t
sudo sshd -T | grep -E \
  '^(port|permitrootlogin|pubkeyauthentication|passwordauthentication|kbdinteractiveauthentication|maxauthtries|x11forwarding|clientaliveinterval|clientalivecountmax) '
```

Не используйте `systemctl restart sshd` вслепую. Сначала reload:

```bash
sudo systemctl reload sshd 2>/dev/null || sudo systemctl reload ssh
sudo ss -ltnp | grep ":${SSH_PORT} "
```

Проверьте новую сессию:

```bash
ssh -o BatchMode=yes -o IdentitiesOnly=yes \
  -i ~/.ssh/id_ed25519 -p 2207 admin@SERVER_IP 'printf "key login OK\n"'
```

Только после успеха можно закрыть старую сессию и удалить правило старого SSH-порта.

---

# Часть III. Fail2ban и CrowdSec

## 6. Настраиваем Fail2ban на фактический SSH-порт

Не используйте `port = ssh`, если sshd слушает нестандартный порт: имя сервиса обычно разрешается в `22/tcp`.

Создайте `/etc/fail2ban/jail.d/sshd.local`:

```ini
[DEFAULT]
backend = systemd
bantime = 1h
findtime = 10m
maxretry = 5
bantime.increment = true
bantime.factor = 2
bantime.maxtime = 1w
ignoreip = 127.0.0.1/8 ::1
banaction = firewallcmd-rich-rules
banaction_allports = firewallcmd-rich-rules

[sshd]
enabled = true
port = 2207
maxretry = 3

[recidive]
enabled = true
backend = systemd
bantime = 1w
findtime = 1d
maxretry = 5
banaction = firewallcmd-rich-rules
banaction_allports = firewallcmd-rich-rules
```

На RHEL с `fail2ban-firewalld` обычно уже создаётся `/etc/fail2ban/jail.d/00-firewalld.conf`. Если нет, добавьте в `[DEFAULT]`:

```ini
banaction = firewallcmd-rich-rules
banaction_allports = firewallcmd-rich-rules
```

Перед перезапуском:

```bash
sudo fail2ban-client -t
sudo systemctl enable --now fail2ban
sudo systemctl restart fail2ban
```

Дождитесь готовности приложения:

```bash
for i in $(seq 1 20); do
  sudo fail2ban-client ping >/dev/null 2>&1 && break
  sleep 1
done
sudo fail2ban-client ping
sudo fail2ban-client status
sudo fail2ban-client status sshd
```

Проверьте эффективные значения:

```bash
sudo fail2ban-client get sshd maxretry
sudo fail2ban-client get sshd findtime
sudo fail2ban-client get sshd bantime
sudo fail2ban-client -d | grep -A3 -B3 "'port', '2207'"
```

Не тестируйте бан с единственного адреса, через который администрируете сервер. Используйте отдельное соединение и заранее подготовленную консоль провайдера.

Разбан:

```bash
sudo fail2ban-client set sshd unbanip TEST_IP
```

## 7. Устанавливаем CrowdSec и firewall bouncer

CrowdSec состоит минимум из двух частей:

- Security Engine анализирует журналы и создаёт решения;
- remediation component применяет решения к трафику.

Актуальные официальные инструкции: <https://docs.crowdsec.net/u/getting_started/installation/linux/>.

Вместо безусловного `curl | sh` загрузите bootstrap отдельно и осмотрите его:

```bash
curl -fsSL https://install.crowdsec.net -o /tmp/install-crowdsec.sh
less /tmp/install-crowdsec.sh
sudo sh /tmp/install-crowdsec.sh
rm -f /tmp/install-crowdsec.sh
```

### Debian/Ubuntu

```bash
sudo apt update
apt-cache policy crowdsec
sudo apt install -y crowdsec crowdsec-firewall-bouncer-iptables
```

### RHEL/CentOS/Fedora

```bash
sudo dnf info crowdsec
sudo dnf install -y crowdsec crowdsec-firewall-bouncer-iptables
```

Официальная документация использует имя пакета `crowdsec-firewall-bouncer-iptables`; сам bouncer может работать в режиме nftables. Предпочитайте пакетную установку. Если бинарник установлен вручную и `rpm -qf`/`dpkg -S` не находит владельца, обновления и контроль происхождения становятся вашей ответственностью.

Включите и проверьте:

```bash
sudo systemctl enable --now crowdsec
sudo systemctl enable --now crowdsec-firewall-bouncer
sudo systemctl is-active crowdsec crowdsec-firewall-bouncer
sudo systemctl show crowdsec crowdsec-firewall-bouncer \
  -p Result -p ExecMainStatus
```

Установите коллекции по реально работающим сервисам:

```bash
sudo cscli collections install crowdsecurity/linux crowdsecurity/sshd
# Если есть Nginx:
sudo cscli collections install crowdsecurity/nginx \
  crowdsecurity/base-http-scenarios crowdsecurity/http-cve
sudo systemctl restart crowdsec
```

Проверьте источники журналов и метрики:

```bash
sudo cscli collections list
sudo cscli metrics
sudo cscli decisions list
sudo cscli bouncers list
sudo journalctl -u crowdsec -u crowdsec-firewall-bouncer \
  --since '30 minutes ago' --no-pager
```

Учитывайте важное различие: `cscli decisions list -o json` может возвращать список alerts, внутри которых находятся decisions. Для автоматизации не считайте строки таблицы; парсите JSON в соответствии с фактической версией.

Безопасный тест локального решения выполняйте для документального адреса, который не принадлежит вам:

```bash
sudo cscli decisions add --ip 192.0.2.123 --duration 2m --reason test
sudo cscli decisions list
sudo nft list ruleset | grep -i crowdsec
sudo cscli decisions delete --ip 192.0.2.123
```

Никогда не публикуйте API-ключ bouncer из `/etc/crowdsec/bouncers/*.yaml`.

---

# Часть IV. Общий Telegram-транспорт

## 8. Создаём Bot API-конфигурацию

Создайте бота через официального `@BotFather`, начните диалог с ним и получите chat ID. Не вставляйте токен прямо в команду shell: он попадёт в историю.

```bash
sudo install -d -o root -g root -m 0700 /etc/server-security-monitor
sudo test -e /etc/server-security-monitor/telegram.env \
  || sudo install -o root -g root -m 0600 /dev/null \
       /etc/server-security-monitor/telegram.env
sudo chown root:root /etc/server-security-monitor/telegram.env
sudo chmod 0600 /etc/server-security-monitor/telegram.env
sudoedit /etc/server-security-monitor/telegram.env
```

Содержимое:

```bash
TELEGRAM_BOT_TOKEN="ЗАМЕНИТЕ_НА_ТОКЕН"
TELEGRAM_CHAT_ID="ЗАМЕНИТЕ_НА_CHAT_ID"
```

Проверьте только структуру и права, не печатая значения:

```bash
sudo stat -c '%A %U:%G %n' /etc/server-security-monitor/telegram.env
sudo awk -F= '/^[A-Z_]+=/ {print $1"=<set>"}' \
  /etc/server-security-monitor/telegram.env
```

## 9. Общая библиотека

Создайте каталог:

```bash
sudo install -d -o root -g root -m 0750 \
  /usr/local/libexec/server-security-monitor
sudoedit /usr/local/libexec/server-security-monitor/common.sh
```

Содержимое `common.sh`:

```bash
#!/usr/bin/env bash
# Общие функции. Файл должен принадлежать root и не изменяться обычными пользователями.

SSM_CONF=${SSM_CONF:-/etc/server-security-monitor/telegram.env}
SSM_CURL=${SSM_CURL:-/usr/bin/curl}

load_telegram_config() {
  [[ -r "$SSM_CONF" ]] || {
    printf 'Telegram config is not readable: %s\n' "$SSM_CONF" >&2
    return 2
  }

  # Это root-only доверенный конфигурационный файл.
  # shellcheck disable=SC1090
  set -a
  . "$SSM_CONF"
  set +a

  : "${TELEGRAM_BOT_TOKEN:?TELEGRAM_BOT_TOKEN is missing}"
  : "${TELEGRAM_CHAT_ID:?TELEGRAM_CHAT_ID is missing}"
}

html_escape() {
  sed -e 's/&/\&amp;/g' -e 's/</\&lt;/g' -e 's/>/\&gt;/g'
}

tg_send() {
  local msg=${1:-}
  [[ -n "$msg" ]] || return 0
  load_telegram_config

  # Telegram принимает до 4096 символов; оставляем запас.
  if ((${#msg} > 3900)); then
    msg="${msg:0:3820}
…сообщение сокращено; полный отчёт сохранён на сервере"
  fi

  local response body
  body=$(CHAT_ID="$TELEGRAM_CHAT_ID" MESSAGE="$msg" python3 - <<'PY'
import os, urllib.parse
print(urllib.parse.urlencode({
    "chat_id": os.environ["CHAT_ID"],
    "text": os.environ["MESSAGE"],
    "parse_mode": "HTML",
    "disable_web_page_preview": "true",
}))
PY
  )

  # URL с токеном передаётся через отдельный FD, а POST body — через stdin:
  # токен, chat ID и текст не появляются в argv процесса curl.
  exec 3<<<"url = \"https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage\""
  response=$(printf '%s' "$body" | "$SSM_CURL" \
      --config /dev/fd/3 \
      --fail --silent --show-error \
      --connect-timeout 3 --max-time 12 \
      -X POST \
      -H 'Content-Type: application/x-www-form-urlencoded' \
      --data-binary @-) || {
    exec 3<&-
    return 1
  }
  exec 3<&-

  RESPONSE=$response python3 - <<'PY'
import json, os, sys
try:
    ok = json.loads(os.environ["RESPONSE"]).get("ok") is True
except Exception:
    ok = False
sys.exit(0 if ok else 1)
PY
}
```

Установите права и проверьте синтаксис:

```bash
sudo chown root:root /usr/local/libexec/server-security-monitor/common.sh
sudo chmod 0750 /usr/local/libexec/server-security-monitor/common.sh
sudo bash -n /usr/local/libexec/server-security-monitor/common.sh
```

Создайте тестовый sender `/usr/local/libexec/server-security-monitor/send-test.sh`:

```bash
#!/usr/bin/env bash
set -Eeuo pipefail
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
. /usr/local/libexec/server-security-monitor/common.sh
tg_send "✅ <b>Тест мониторинга</b> на <code>$(hostname -f 2>/dev/null || hostname)</code>"
```

```bash
sudo chmod 0750 /usr/local/libexec/server-security-monitor/send-test.sh
sudo /usr/local/libexec/server-security-monitor/send-test.sh
```

Не переходите дальше, пока тестовое сообщение не пришло.

---

# Часть V. AIDE и rkhunter

## 10. Инициализируем AIDE

AIDE хранит контрольные суммы и метаданные файлов. Его база сама является критическим активом.

### RHEL-подобные системы

```bash
sudo aide --config-check
sudo aide --init
sudo test -f /var/lib/aide/aide.db.new.gz
sudo install -o root -g root -m 0600 \
  /var/lib/aide/aide.db.new.gz /var/lib/aide/aide.db.gz
```

### Debian/Ubuntu

На Debian пути могут отличаться, а конфигурация может собираться из `/etc/aide/aide.conf.d`:

```bash
sudo aideinit
sudo update-aide.conf
sudo aide --config-check
```

Определите фактические пути из конфигурации:

```bash
sudo grep -RhsE '^(database|database_in|database_out)=' \
  /etc/aide.conf /etc/aide/aide.conf* /etc/aide/aide.conf.d 2>/dev/null
```

Финальная проверка должна вернуть код `0`:

```bash
sudo aide --check
printf 'AIDE rc=%s\n' "$?"
```

Коды `1`, `2` и `4` — битовая маска добавленных, удалённых и изменённых объектов. Их комбинации до `7` означают найденные изменения, а не обязательно поломку сканера.

## 11. Скрипт AIDE

```bash
sudo install -d -o root -g root -m 0700 \
  /var/log/server-security-monitor/aide
sudoedit /usr/local/libexec/server-security-monitor/aide-check.sh
```

```bash
#!/usr/bin/env bash
set -Eeuo pipefail
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
export LC_ALL=C
. /usr/local/libexec/server-security-monitor/common.sh

AIDE_BIN=${AIDE_BIN:-$(command -v aide)}
LOG_ROOT=/var/log/server-security-monitor/aide
LOCK_FILE=/run/lock/server-security-aide.lock
MAX_PATHS=30

install -d -o root -g root -m 0700 "$LOG_ROOT"
exec 9>"$LOCK_FILE"
flock -n 9 || exit 0

stamp=$(date '+%Y%m%d-%H%M%S')
report="$LOG_ROOT/aide-$stamp.log"

set +e
"$AIDE_BIN" --check >"$report" 2>&1
rc=$?
set -e
chmod 0600 "$report"

[[ $rc -eq 0 ]] && exit 0

summary=$(grep -iE \
  'Total number of entries:[[:space:]]*[0-9]+|Added entries:[[:space:]]*[0-9]+|Removed entries:[[:space:]]*[0-9]+|Changed entries:[[:space:]]*[0-9]+' \
  "$report" | head -n 4 || true)

paths=$(awk -v max="$MAX_PATHS" '
  /^[[:space:]]*(Added|Removed|Changed) entries:[[:space:]]*$/ {
    section=$0
    sub(/^[[:space:]]*/, "", section)
    next
  }
  section != "" && /:[[:space:]]+\// {
    if (!seen[section]++) print section
    print
    if (++count >= max) exit
  }
' "$report")

[[ -n "$summary" ]] || summary="AIDE exit code: $rc"
[[ -n "$paths" ]] || paths="Пути не извлечены; см. полный локальный отчёт."

summary_html=$(printf '%s' "$summary" | html_escape)
paths_html=$(printf '%s' "$paths" | html_escape)
host=$(hostname -f 2>/dev/null || hostname)

if (( rc <= 7 )); then
  title='🧬 <b>AIDE: изменения файлов</b>'
else
  title="🚨 <b>AIDE: ошибка проверки, код ${rc}</b>"
fi

tg_send "${title} на <code>${host}</code>
$(date '+%F %T %Z')
<pre>${summary_html}</pre>
<pre>${paths_html}</pre>
Полный отчёт: <code>${report}</code>"

# Изменения файлов — успешная доставка finding; ошибка сканера — ошибка unit.
(( rc <= 7 )) && exit 0
exit "$rc"
```

## 12. Скрипт rkhunter

```bash
sudo install -d -o root -g root -m 0700 \
  /var/log/server-security-monitor/rkhunter
sudoedit /usr/local/libexec/server-security-monitor/rkhunter-check.sh
```

```bash
#!/usr/bin/env bash
set -Eeuo pipefail
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
export LC_ALL=C
. /usr/local/libexec/server-security-monitor/common.sh

RKHUNTER_BIN=${RKHUNTER_BIN:-$(command -v rkhunter)}
LOG_ROOT=/var/log/server-security-monitor/rkhunter
LOCK_FILE=/run/lock/server-security-rkhunter.lock

install -d -o root -g root -m 0700 "$LOG_ROOT"
exec 9>"$LOCK_FILE"
flock -n 9 || exit 0

stamp=$(date '+%Y%m%d-%H%M%S')
report="$LOG_ROOT/rkhunter-$stamp.log"

set +e
"$RKHUNTER_BIN" --cronjob --report-warnings-only --nocolors \
  >"$report" 2>&1
rc=$?
set -e
chmod 0600 "$report"

if [[ -s "$report" ]]; then
  excerpt=$(head -n 35 "$report" | html_escape)
  host=$(hostname -f 2>/dev/null || hostname)
  tg_send "🦠 <b>rkhunter: предупреждения</b> на <code>${host}</code>
$(date '+%F %T %Z')
<pre>${excerpt}</pre>
Полный отчёт: <code>${report}</code>"
fi

# На распространённых сборках rc=1 сопровождает warnings; >=2 — ошибка запуска.
if (( rc >= 2 )); then
  [[ -s "$report" ]] || tg_send "🚨 <b>rkhunter: ошибка запуска</b>, код ${rc}"
  exit "$rc"
fi
exit 0
```

Никогда не запускайте `rkhunter --propupd` автоматически. Эта команда объявляет текущее состояние доверенным. Сначала подтвердите происхождение изменений через пакетный менеджер и журнал обновлений.

## 13. systemd units и timers

`/etc/systemd/system/aide-check.service`:

```ini
[Unit]
Description=AIDE file integrity check
After=local-fs.target network-online.target
Wants=network-online.target

[Service]
Type=oneshot
ExecStart=/usr/local/libexec/server-security-monitor/aide-check.sh
Nice=10
IOSchedulingClass=idle
UMask=0077
TimeoutStartSec=20min
```

`/etc/systemd/system/aide-check.timer`:

```ini
[Unit]
Description=Daily AIDE integrity check

[Timer]
OnCalendar=*-*-* 04:00:00
RandomizedDelaySec=900
Persistent=true

[Install]
WantedBy=timers.target
```

`/etc/systemd/system/rkhunter-check.service`:

```ini
[Unit]
Description=rkhunter rootkit scan
After=local-fs.target network-online.target
Wants=network-online.target

[Service]
Type=oneshot
ExecStart=/usr/local/libexec/server-security-monitor/rkhunter-check.sh
Nice=10
IOSchedulingClass=idle
UMask=0077
TimeoutStartSec=30min
```

`/etc/systemd/system/rkhunter-check.timer`:

```ini
[Unit]
Description=Daily rkhunter scan

[Timer]
OnCalendar=*-*-* 04:30:00
RandomizedDelaySec=900
Persistent=true

[Install]
WantedBy=timers.target
```

Установите права и активируйте:

```bash
sudo chown root:root \
  /usr/local/libexec/server-security-monitor/*.sh \
  /etc/systemd/system/{aide-check,rkhunter-check}.{service,timer}
sudo chmod 0750 /usr/local/libexec/server-security-monitor/*.sh
sudo chmod 0644 /etc/systemd/system/{aide-check,rkhunter-check}.{service,timer}

sudo bash -n /usr/local/libexec/server-security-monitor/*.sh
sudo systemd-analyze verify \
  /etc/systemd/system/aide-check.service \
  /etc/systemd/system/rkhunter-check.service
sudo systemctl daemon-reload
sudo systemctl enable --now aide-check.timer rkhunter-check.timer
```

Запустите реальные units:

```bash
sudo systemctl start aide-check.service
sudo systemctl start rkhunter-check.service
sudo systemctl show aide-check.service rkhunter-check.service \
  -p Result -p ExecMainStatus
sudo journalctl -u aide-check.service -u rkhunter-check.service \
  --since '1 hour ago' --no-pager
```

Oneshot-сервис после успешного завершения обычно имеет состояние `inactive`, и это нормально. Важны `Result=success` и `ExecMainStatus=0`.

---

# Часть VI. Мгновенные уведомления через PAM

## 14. Скрипты send-message и login-alert

PAM-переменные контролируются удалённым входом. Никогда не вставляйте их в `eval`, `bash -c` или создаваемую командную строку.

Сначала создайте `/usr/local/libexec/server-security-monitor/send-message.sh`:

```bash
#!/usr/bin/env bash
set -Eeuo pipefail
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
. /usr/local/libexec/server-security-monitor/common.sh
tg_send "${1:-}"
```

`/usr/local/libexec/server-security-monitor/login-alert.sh`:

```bash
#!/usr/bin/env bash
# Ошибка Telegram не должна блокировать login.
set -u
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

[[ ${PAM_TYPE:-} == open_session ]] || exit 0
. /usr/local/libexec/server-security-monitor/common.sh

case "${PAM_SERVICE:-unknown}" in
  sshd) icon='🔐'; kind='SSH-вход' ;;
  sudo) icon='🧨'; kind='sudo' ;;
  su)   icon='🔀'; kind='su' ;;
  *)    icon='👤'; kind=${PAM_SERVICE:-unknown} ;;
esac

user=$(printf '%s' "${PAM_USER:-?}" | html_escape)
source_host=$(printf '%s' "${PAM_RHOST:-local}" | html_escape)
service=$(printf '%s' "${PAM_SERVICE:-unknown}" | html_escape)
tty=$(printf '%s' "${PAM_TTY:-?}" | html_escape)
host=$(hostname -f 2>/dev/null || hostname)

msg="${icon} <b>${kind}</b> на <code>${host}</code>
Пользователь: <code>${user}</code>
Источник: <code>${source_host:-local}</code>
Сервис/TTY: <code>${service} / ${tty}</code>
$(date '+%F %T %Z')"

# Данные передаются как один argv и никогда не вычисляются shell повторно.
/usr/bin/setsid -f \
  /usr/local/libexec/server-security-monitor/send-message.sh \
  "$msg" >/dev/null 2>&1 || true
exit 0
```

```bash
sudo chown root:root \
  /usr/local/libexec/server-security-monitor/{send-message,login-alert}.sh
sudo chmod 0750 \
  /usr/local/libexec/server-security-monitor/{send-message,login-alert}.sh
sudo bash -n \
  /usr/local/libexec/server-security-monitor/{send-message,login-alert}.sh
```

## 15. Подключаем PAM безопасно

Сначала держите открытой текущую root/sudo-сессию и проверьте наличие консоли провайдера.

```bash
sudo cp -a /etc/pam.d/sshd "/etc/pam.d/sshd.bak.$(date +%s)"
sudo cp -a /etc/pam.d/sudo "/etc/pam.d/sudo.bak.$(date +%s)"
```

Добавьте в конец `/etc/pam.d/sshd`:

```pam
session optional pam_exec.so /usr/local/libexec/server-security-monitor/login-alert.sh
```

Опционально добавьте ту же строку в `/etc/pam.d/sudo`. Уведомления о каждом `sudo` могут быть шумными; на сервере с интенсивной автоматизацией лучше уведомлять только о SSH.

Ключевое слово должно быть `optional`, а не `required`: недоступность Telegram не должна лишать доступа к серверу.

Проверьте новый SSH-вход во второй сессии. Если он не работает, восстановите PAM-файл из резервной копии через текущую сессию или консоль.

---

# Часть VII. Ежедневный дайджест

## 16. Скрипт security-digest

`/usr/local/libexec/server-security-monitor/security-digest.sh`:

```bash
#!/usr/bin/env bash
set -Eeuo pipefail
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
export LC_ALL=C
. /usr/local/libexec/server-security-monitor/common.sh

exec 9>/run/lock/server-security-digest.lock
flock -n 9 || exit 0

f2b=$(fail2ban-client status sshd 2>/dev/null || true)
banned=$(printf '%s\n' "$f2b" | awk -F: '
  tolower($1) ~ /currently banned/ {gsub(/[^0-9]/,"",$2); print $2; exit}')
total=$(printf '%s\n' "$f2b" | awk -F: '
  tolower($1) ~ /total banned/ {gsub(/[^0-9]/,"",$2); print $2; exit}')

ssh_unit=sshd
systemctl cat ssh.service >/dev/null 2>&1 && ssh_unit=ssh
fails=$(journalctl -u "$ssh_unit" --since '24 hours ago' --no-pager \
  2>/dev/null | grep -ciE \
  'Failed password|Invalid user|authentication failure' || true)

cs_json=$(cscli decisions list -o json 2>/dev/null || true)
cs=$(printf '%s' "$cs_json" | python3 -c '
import json, sys
try:
    data=json.load(sys.stdin)
    if isinstance(data, list):
        # Некоторые версии возвращают alerts с вложенными decisions.
        print(sum(len(x.get("decisions", [])) if isinstance(x, dict) else 0
                  for x in data))
    elif isinstance(data, dict):
        print(len(data.get("decisions", [])))
    else:
        print("?")
except Exception:
    print("?")')

mem=$(free -m | awk '/^Mem:/{print $3"/"$2" MB"}')
disk=$(df -P / | awk 'NR==2{print $5}')
read -r l1 l5 l15 _ </proc/loadavg

if command -v needs-restarting >/dev/null 2>&1; then
  if needs-restarting -r >/dev/null 2>&1; then
    reboot_state='✅ ребут не нужен'
  else
    reboot_state='♻️ <b>НУЖЕН РЕБУТ</b>'
  fi
elif [[ -e /var/run/reboot-required ]]; then
  reboot_state='♻️ <b>НУЖЕН РЕБУТ</b>'
else
  reboot_state='✅ ребут не требуется или не определён'
fi

check_timer() {
  local timer=$1 service=$2
  systemctl is-active --quiet "$timer" &&
  systemctl is-enabled --quiet "$timer" &&
  [[ $(systemctl show "$service" -p Result --value 2>/dev/null) == success ]] &&
  [[ $(systemctl show "$service" -p ExecMainStatus --value 2>/dev/null) == 0 ]]
}

health=()
check_timer aide-check.timer aide-check.service \
  && health+=('AIDE✅') || health+=('AIDE⚠️')
check_timer rkhunter-check.timer rkhunter-check.service \
  && health+=('rkhunter✅') || health+=('rkhunter⚠️')
systemctl is-active --quiet crowdsec crowdsec-firewall-bouncer \
  && health+=('CrowdSec✅') || health+=('CrowdSec⚠️')
systemctl is-active --quiet fail2ban \
  && health+=('Fail2ban✅') || health+=('Fail2ban⚠️')

host=$(hostname -f 2>/dev/null || hostname)
tg_send "📋 <b>Дайджест ${host}</b> — $(date '+%F')
🔐 SSH забанено: ${banned:-?} (всего ${total:-?})
🛡 CrowdSec активных решений: ${cs:-?}
❌ Неудачных SSH за сутки: ${fails:-0}
🧠 RAM: ${mem} | 💾 Диск /: ${disk}
📈 load: ${l1}, ${l5}, ${l15}
${reboot_state}
🩺 ${health[*]}"
```

Unit `/etc/systemd/system/security-digest.service`:

```ini
[Unit]
Description=Daily security digest to Telegram
After=network-online.target crowdsec.service fail2ban.service
Wants=network-online.target

[Service]
Type=oneshot
ExecStart=/usr/local/libexec/server-security-monitor/security-digest.sh
Nice=10
IOSchedulingClass=idle
UMask=0077
TimeoutStartSec=2min
```

Timer `/etc/systemd/system/security-digest.timer`:

```ini
[Unit]
Description=Daily security digest to Telegram

[Timer]
OnCalendar=*-*-* 09:00:00
RandomizedDelaySec=900
Persistent=true

[Install]
WantedBy=timers.target
```

Активируйте и проверьте реальным запуском:

```bash
sudo chmod 0750 /usr/local/libexec/server-security-monitor/security-digest.sh
sudo systemd-analyze verify /etc/systemd/system/security-digest.service
sudo systemctl daemon-reload
sudo systemctl enable --now security-digest.timer
sudo systemctl start security-digest.service
sudo systemctl show security-digest.service -p Result -p ExecMainStatus
sudo systemctl list-timers --all | grep security-digest
```

---

# Часть VIII. Обновления и ротация

## 17. Автоматические security-обновления

### Debian/Ubuntu

```bash
sudo dpkg-reconfigure --priority=low unattended-upgrades
sudo systemctl enable --now unattended-upgrades
sudo unattended-upgrade --dry-run --debug
```

Проверьте `/etc/apt/apt.conf.d/50unattended-upgrades` и убедитесь, что включены только ожидаемые источники. Автоматическую перезагрузку по умолчанию оставьте выключенной; дайджест сообщит о `/var/run/reboot-required`.

### RHEL-подобные

В `/etc/dnf/automatic.conf`:

```ini
[commands]
upgrade_type = security
download_updates = yes
apply_updates = yes
reboot = never
```

```bash
sudo systemctl enable --now dnf-automatic-install.timer
sudo systemctl list-timers --all | grep dnf-automatic
```

Не обновляйте AIDE-базу автоматически сразу после установки пакетов. Сначала сопоставьте изменения с журналом пакетного менеджера.

## 18. logrotate

`/etc/logrotate.d/server-security-monitor`:

```text
/var/log/server-security-monitor/aide/*.log /var/log/server-security-monitor/rkhunter/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    su root root
    create 0600 root root
}
```

Проверка без ротации:

```bash
sudo logrotate -d /etc/logrotate.d/server-security-monitor
sudo find /var/log/server-security-monitor -type f \
  -printf '%m %u:%g %s %p\n'
```

Все отчёты должны быть `0600 root:root`.

---

# Часть IX. Полная проверка

## 19. Production checklist

### SSH и firewall

```bash
sudo sshd -t
sudo sshd -T | grep -E \
  '^(port|permitrootlogin|passwordauthentication|kbdinteractiveauthentication|pubkeyauthentication|maxauthtries) '
sudo ss -ltnp
sudo firewall-cmd --list-all
```

Ожидается:

- root login запрещён;
- пароли и keyboard-interactive выключены;
- публичные ключи включены;
- firewall содержит только необходимые сервисы и фактический SSH-порт.

### Fail2ban

```bash
sudo fail2ban-client ping
sudo fail2ban-client status
sudo fail2ban-client status sshd
sudo fail2ban-client -t
```

### CrowdSec

```bash
sudo systemctl is-active crowdsec crowdsec-firewall-bouncer
sudo cscli metrics
sudo cscli decisions list
sudo cscli bouncers list
sudo nft list ruleset | grep -i crowdsec
```

### Monitoring

```bash
sudo systemctl start aide-check.service
sudo systemctl start rkhunter-check.service
sudo systemctl start security-digest.service

sudo systemctl show \
  aide-check.service rkhunter-check.service security-digest.service \
  -p Result -p ExecMainStatus

sudo systemctl is-enabled \
  aide-check.timer rkhunter-check.timer security-digest.timer
sudo systemctl list-timers --all | grep -E \
  'aide-check|rkhunter-check|security-digest'
```

### Файлы и секреты

```bash
sudo stat -c '%A %U:%G %n' \
  /etc/server-security-monitor/telegram.env \
  /usr/local/libexec/server-security-monitor/*.sh \
  /var/log/server-security-monitor

sudo grep -RIlE \
  '[0-9]{6,12}:[A-Za-z0-9_-]{20,}' \
  /usr/local/libexec/server-security-monitor \
  /etc/systemd/system || true
```

Последняя команда не должна находить Telegram-токены в скриптах или units.

## 20. Негативные тесты

Проверьте отказ Telegram, временно указав несуществующий конфиг через переменную только для тестовой команды:

```bash
sudo SSM_CONF=/nonexistent \
  /usr/local/libexec/server-security-monitor/send-test.sh
```

Команда должна завершиться ошибкой, но SSH/PAM login не должен блокироваться.

Проверьте блокировку параллельного запуска:

```bash
sudo flock /run/lock/server-security-aide.lock sleep 15 &
sudo systemctl start aide-check.service
```

Второй запуск должен тихо завершиться, не создавая параллельный тяжёлый scan.

Не создавайте тестовое изменение в системном файле. Для AIDE используйте отдельный заранее включённый тестовый путь, например `/root/aide-test`, затем удалите его и исследуйте оба finding. После теста база не обновляется без ручной проверки.

---

# Часть X. Расследование и обслуживание

## 21. Что делать при тревоге AIDE

1. Не запускайте `aide --update`.
2. Сохраните полный отчёт и время события.
3. Для каждого пути выполните:

```bash
sudo stat /PATH/TO/FILE
sudo rpm -qf /PATH/TO/FILE 2>/dev/null || true
sudo dpkg -S /PATH/TO/FILE 2>/dev/null || true
sudo getcap /PATH/TO/FILE 2>/dev/null || true
sudo ls -lZ /PATH/TO/FILE 2>/dev/null || true
```

4. Сопоставьте время с обновлениями:

```bash
sudo dnf history info last 2>/dev/null || true
sudo grep -hE ' upgrade | install | remove ' /var/log/apt/history.log 2>/dev/null || true
```

5. Проверьте SSH/sudo и system journal вокруг времени изменения.
6. Если изменение ожидаемое, создайте резервную копию старой базы и выполните update вручную.
7. Если происхождение неизвестно, не уничтожайте evidence: ограничьте сеть, сохраните журналы и расследуйте с доверенного хоста.

### Безопасное обновление AIDE-базы

Пути различаются по дистрибутивам. Для RHEL-подобного варианта:

```bash
sudo aide --check
sudo aide --update
sudo test -f /var/lib/aide/aide.db.new.gz
sudo cp -a /var/lib/aide/aide.db.gz \
  "/var/lib/aide/aide.db.gz.bak.$(date +%s)"
sudo install -o root -g root -m 0600 \
  /var/lib/aide/aide.db.new.gz /var/lib/aide/aide.db.gz
sudo aide --check
```

Последняя команда обязана вернуть `0`. Не перенаправляйте update-отчёт внутрь каталога, который AIDE проверяет в том же запуске: это создаёт самопорождающиеся изменения.

## 22. rkhunter и ложные срабатывания

rkhunter — эвристический инструмент, а не доказательство компрометации. Проверяйте:

- принадлежность файла пакету;
- изменения после обновления;
- права, владельца, capabilities и SELinux context;
- наличие duplicate scheduler.

Некоторые пакеты устанавливают `/etc/cron.daily/rkhunter`, а вы дополнительно создаёте systemd timer. Это приводит к двойному запуску и иногда к очереди локальной почты. Проверьте:

```bash
sudo run-parts --test /etc/cron.daily | grep -i rkhunter || true
sudo systemctl is-enabled rkhunter-check.timer
sudo systemctl show rkhunter-check.service -p Result -p ExecMainStatus
```

Если custom timer полностью заменяет package cron, используйте документированный параметр отключения пакета. Если его нет, допустимо снять executable bit только с конкретного cron-файла, записав способ отката. Обновление пакета может вернуть этот bit.

## 23. Ежемесячное обслуживание

```bash
sudo sshd -t
sudo fail2ban-client -t
sudo cscli hub update
sudo cscli collections list
sudo cscli metrics
sudo systemctl --failed
sudo systemctl list-timers --all
sudo journalctl -p 0..3 --since '30 days ago'
sudo find /var/log/server-security-monitor -type f \
  -printf '%m %u:%g %TY-%Tm-%Td %p\n'
```

Не выполняйте автоматический `cscli hub upgrade` без чтения release notes и резервной копии конфигурации.

---

# Часть XI. Rollback и удаление

## 24. Быстрый rollback SSH/PAM

Через открытую аварийную сессию или консоль провайдера:

```bash
sudo cp -a "$BACKUP/ssh/." /etc/ssh/
sudo cp -a "$BACKUP/pam.d/." /etc/pam.d/
sudo sshd -t
sudo systemctl reload sshd 2>/dev/null || sudo systemctl reload ssh
```

Если переменная `BACKUP` уже потеряна, найдите каталог вручную в `/root/server-security-backup-*`.

## 25. Отключение monitoring-слоя

```bash
sudo systemctl disable --now \
  aide-check.timer rkhunter-check.timer security-digest.timer
sudo rm -f /etc/systemd/system/{aide-check,rkhunter-check,security-digest}.{service,timer}
sudo systemctl daemon-reload
```

Перед удалением PAM hook сначала удалите только строку с `server-security-monitor/login-alert.sh`, проверьте новый SSH-вход и лишь затем удаляйте скрипты.

```bash
sudo rm -rf /usr/local/libexec/server-security-monitor
sudo rm -f /etc/logrotate.d/server-security-monitor
```

Не удаляйте `/etc/server-security-monitor/telegram.env` и отчёты, пока не подтвердили, что они больше не нужны. Уничтожайте секреты осознанно:

```bash
sudo rm -f /etc/server-security-monitor/telegram.env
```

CrowdSec и Fail2ban удаляйте штатным пакетным менеджером только после остановки bouncer и проверки firewall:

```bash
sudo systemctl disable --now crowdsec-firewall-bouncer crowdsec fail2ban
sudo nft list ruleset
sudo firewall-cmd --list-all
```

---

# Реальный проверочный стенд

Архитектура статьи повторно сверена с работающим CentOS Stream 9 сервером. На момент проверки:

- SELinux — `Enforcing`;
- SSH слушал только нестандартный порт и имел `PermitRootLogin no`, `PasswordAuthentication no`, `KbdInteractiveAuthentication no`, `MaxAuthTries 3`;
- firewalld был активен и открывал только заявленные web-сервисы и SSH-порт;
- Fail2ban обслуживал `sshd` и `recidive`, использовал systemd backend и числовой SSH-порт;
- CrowdSec engine и firewall bouncer были активны, bouncer применял nftables-решения;
- AIDE, rkhunter, security digest и security updates запускались systemd timers с jitter и `Persistent=true`;
- последние oneshot-запуски имели `Result=success` и `ExecMainStatus=0`;
- Telegram-конфигурация была `0600 root:root`;
- локальные отчёты AIDE/rkhunter сохранялись как `0600 root:root` и ротировались;
- ежедневный дайджест и PAM-alerts использовали ограниченные сетевые timeout;
- AIDE-база существовала, а временная новая база не оставалась после принятого baseline.

Аудит также показал важный эксплуатационный урок: firewall bouncer мог быть рабочим, но его бинарник не принадлежал установленному RPM-пакету. Это не ломает защиту немедленно, однако ухудшает обновляемость и provenance. Для новых установок используйте официальный пакет и проверяйте владельца бинарника:

```bash
rpm -qf "$(command -v crowdsec-firewall-bouncer)" 2>/dev/null || true
dpkg -S "$(command -v crowdsec-firewall-bouncer)" 2>/dev/null || true
```

# Итог

Полученная система сочетает preventive controls, detection, remediation и уведомления:

- SSH-ключи и запрет root/паролей уменьшают поверхность аутентификации;
- firewall задаёт минимальную сетевую экспозицию;
- Fail2ban реагирует на локальные ошибки SSH;
- CrowdSec распознаёт более широкие сценарии и применяет коллективную репутацию;
- AIDE обнаруживает изменения файлов;
- rkhunter даёт дополнительный эвристический сигнал;
- автоматические security-обновления уменьшают окно известных уязвимостей;
- Telegram сообщает о событиях, но полные evidence остаются локально;
- systemd timers, locks, timeouts и проверка exit status делают мониторинг эксплуатационно надёжным.

Главное — не просто установить компоненты, а регулярно проверять, что они действительно работают: слушают правильные порты, применяют решения, успешно завершают проверки, сохраняют отчёты и доставляют уведомления без раскрытия секретов.

## Официальные источники

- OpenSSH manual: <https://man.openbsd.org/sshd_config>
- firewalld documentation: <https://firewalld.org/documentation/>
- Fail2ban project: <https://github.com/fail2ban/fail2ban>
- CrowdSec Linux installation: <https://docs.crowdsec.net/u/getting_started/installation/linux/>
- CrowdSec documentation: <https://docs.crowdsec.net/>
- AIDE project: <https://aide.github.io/>
- Debian AIDE manual: <https://manpages.debian.org/bookworm/aide/aide.1.en.html>
- rkhunter project: <https://rkhunter.sourceforge.net/>
- systemd timers: <https://www.freedesktop.org/software/systemd/man/latest/systemd.timer.html>
- Telegram Bot API: <https://core.telegram.org/bots/api>

</div>

<div data-lang="en" markdown="1">

A practical guide for Debian/Ubuntu and RHEL-like systems

> Article version: 1.0, 7 August 2026. The solution is based on a real, working CentOS Stream 9 configuration and was re-verified against its actual state. All addresses, keys, tokens, chat identifiers and other secrets have been removed.

## What we are building

In this guide we assemble a layered protection system for a Linux server. Its components solve different problems: they restrict network access, harden SSH, detect and block attacks, monitor changes to important files, and notify the administrator about events that require attention. The server keeps working autonomously: Telegram is used for notifications, while the full reports stay on the server itself.

After the setup, the server accepts only the network traffic its services need. SSH allows key-based login through a dedicated administrative account; root login and passwords are disabled. Repeated guessing attempts are blocked automatically, more complex attack scenarios are detected by CrowdSec, the integrity of system files is monitored by AIDE, and security updates are installed on a schedule. All of these mechanisms run on the server itself and do not require constant attention from the administrator.

At the same time, the administrator can see what is happening with the protection and learns about events that need to be checked:

- an immediate notification arrives right after an SSH login or a `sudo` invocation;
- after a scheduled AIDE or rkhunter scan, an alert is sent if changes or warnings are found;
- once a day a short report arrives covering bans, failed SSH attempts, memory, disk, load average, pending reboot and the state of the protective services.

If Telegram is unavailable, SSH login is not blocked. Scheduled checks continue, and their reports are stored locally with `0600 root:root` permissions. This is an important part of the design: the notification channel may break, but a notification failure must not turn into a server outage or destroy the data needed for an investigation.

### How the protection is arranged

The first layer is the network firewall. It permits only the ports the server actually serves: for example, HTTPS and the chosen SSH port. Everything else is dropped before the request reaches an application. In this solution, `firewalld` manages the nftables rules.

Behind the firewall runs a hardened SSH:

- `root` login is forbidden;
- password and keyboard-interactive authentication are disabled;
- access is granted by public keys;
- the number of authentication attempts is limited;
- administrative work is performed through a separate user and `sudo`;
- a non-standard port reduces background noise in the logs, although on its own it does not count as protection.

Fail2ban reads the SSH log and reacts to repeated errors from the same address. After several failed attempts it adds a temporary rule to the firewall. A separate `recidive` jail can ban repeat offenders for longer. One detail matters here: Fail2ban must know the actual numeric SSH port. The value `port = ssh` usually means port 22 and is not suitable if sshd has been moved to, say, 2207.

CrowdSec solves a different problem. It analyses SSH, system and web logs using ready-made scenarios, takes the collective reputation of addresses into account, and creates block decisions. The Security Engine itself only detects events. For decisions to affect traffic, a firewall bouncer is installed; it receives them through the local API and applies them via nftables. Fail2ban and CrowdSec partly overlap, but they work on different data: Fail2ban is good at shutting down simple local brute force, while CrowdSec recognises more scenarios and uses a shared observation database.

### What happens after a successful login

SSH stays under PAM control. When a new session opens, a small root-owned script receives the user name, remote address, service and TTY, escapes those values and sends a message to Telegram. The same hook can be attached to `sudo` if the administrator wants notifications about privilege escalation.

The PAM hook is declared as `optional`. It launches the send separately and always allows the login process to continue. The text coming from PAM is passed to the script as data; it is not inserted into `eval` or into a dynamically built shell command. That protects against command injection and at the same time keeps access to the server independent of the Telegram API.

### How files and system state are monitored

AIDE builds a database of checksums, owners, permissions and other metadata for the selected files. The daily check compares the current state against that database. If a file is added, removed or modified, Telegram receives a short summary and the first paths, while the full report is written to a root-only directory. The database is not updated automatically: otherwise an attacker or a faulty update could quietly become the new "normal" state.

rkhunter runs separately and looks for known rootkit signs, suspicious permissions and unusual system objects. Its results require human review: the tool is heuristic and may react to legitimate updates. The `rkhunter --propupd` command is also not run automatically, because it declares the current state trusted.

Both checks are started by systemd timers at night with a randomized delay. `flock` prevents two copies of a heavy scanner from running at the same time, `TimeoutStartSec` limits a hung run, and logrotate compresses and removes old reports according to the configured policy.

### How the system reports its own failures

Monitoring is only useful when it watches not just the server but also itself. That is why the daily digest does not stop at checking that a timer is enabled. For every oneshot service it reads `Result` and `ExecMainStatus` of the last run. This makes it possible to tell a normally finished AIDE scan from a timer that is formally active but has been launching a failing script for several days.

The Telegram token and chat ID are stored in a separate root-only file. The shared send function sets short network timeouts, checks the HTTP response and the `ok` field in the JSON, limits the message length and uses HTML escaping. Neither the secrets nor the message text are passed in the arguments of the `curl` process.

Automatic security updates close known vulnerabilities through `unattended-upgrades` or `dnf-automatic`. Automatic reboot is disabled: if a new kernel or library requires a reboot, that shows up in the daily digest. The AIDE database is not accepted automatically after a package update. The administrator first compares the changes against the package manager log and only then updates the baseline manually.

### What the system looks like on an ordinary day

In normal operation the server barely disturbs the administrator. Fail2ban applies local bans, and the CrowdSec firewall bouncer applies CrowdSec decisions. Clean AIDE and rkhunter checks send no alerts. Once a day a short health report arrives. The full technical logs stay on the server and are rotated.

If an SSH brute force starts, Fail2ban blocks the source after the configured number of errors. CrowdSec may independently create a broader decision. If someone logs in successfully, the administrator immediately sees the user and the source of the connection. If system files change after an update or a break-in, AIDE shows the exact paths. If a scanner, the Telegram API or a systemd unit breaks, the error becomes visible through the service status and the digest instead of being lost silently.

```text
Интернет
   │
   ├── firewalld / nftables ───────────── разрешает только нужные порты
   │
   ├── Fail2ban ───────────────────────── банит повторные ошибки SSH
   │
   ├── CrowdSec + firewall bouncer ───── сценарии атак и репутация адресов
   │
   └── sshd ───────────────────────────── ключи, запрет root и паролей
          │
          └── PAM ─────────────────────── уведомление о входе и sudo

Файловая система ── AIDE ─────────────── контроль целостности
Хост ────────────── rkhunter ──────────── дополнительная эвристика
Пакеты ──────────── unattended-upgrades /
                     dnf-automatic ────── security-обновления

systemd timers ──── расписание и состояние последних запусков
Telegram ────────── тревоги и ежедневный health report
Локальные журналы ─ полные root-only данные для расследования
```

This system reduces the risk of credential brute force, login with a stolen password, unnoticed attacks in web and system logs, hidden file changes and missed updates. It also shortens the time between an event and the administrator's response.

It does not replace backups, TLS, secure application development, secret storage, protection of the VPS provider's control panel, and a recovery plan for a compromise that has been tested in advance. If an attacker has already obtained full root access, the local tools and reports can be modified as well. For servers with stricter requirements, logs are additionally shipped to a separate host or to a SIEM, and the AIDE database is kept outside the machine being checked.

## Supported systems

The main path targets:

- Debian 12+ and Ubuntu 22.04+;
- RHEL 9, Rocky Linux 9, AlmaLinux 9, CentOS Stream 9;
- Fedora, allowing for different package names.

The commands are run as a regular administrative user through `sudo`. Before you start, make sure the emergency web/VNC/serial console of the VPS provider is available.

## Important safety rules

1. Do not close the current SSH session until key-based login has been verified in a second session.
2. Open the new SSH port in the firewall first, and only then change `sshd`.
3. Back up PAM, SSH and firewall configuration before changing them.
4. Do not update the AIDE database automatically after an alert. Investigate every change first.
5. Do not keep the Telegram token in Git, in shell history, in process arguments or in world-readable files.
6. Do not use a permanent `NOPASSWD: ALL` for a regular account. If automation really needs root, give it a dedicated user and a dedicated key.
7. Without a remediation component, CrowdSec detects events but does not block them.
8. An active systemd timer does not prove that the last run succeeded. Check the service's `Result` and `ExecMainStatus`.

---

# Part I. Preparation

## 1. Identifying the distribution and making a backup

```bash
. /etc/os-release
printf 'OS=%s %s\n' "$ID" "$VERSION_ID"
uname -r
command -v systemctl sudo curl python3 flock
```

Create the backup directory:

```bash
BACKUP="/root/server-security-backup-$(date +%Y%m%d-%H%M%S)"
sudo install -d -m 0700 "$BACKUP"

sudo cp -a /etc/ssh "$BACKUP/ssh"
sudo cp -a /etc/pam.d "$BACKUP/pam.d"
sudo cp -a /etc/fail2ban "$BACKUP/fail2ban" 2>/dev/null || true
sudo firewall-cmd --list-all 2>/dev/null \
  | sudo tee "$BACKUP/firewalld-before.txt" >/dev/null || true
sudo nft list ruleset 2>/dev/null \
  | sudo tee "$BACKUP/nft-before.txt" >/dev/null || true
sudo systemctl list-unit-files \
  | sudo tee "$BACKUP/unit-files-before.txt" >/dev/null
```

Do not copy an archive containing secrets to public storage. The directory must stay `root:root 0700`.

## 2. Installing the base packages

### Debian/Ubuntu

```bash
sudo apt update
sudo apt install -y \
  openssh-server curl ca-certificates python3 util-linux \
  fail2ban aide rkhunter logrotate unattended-upgrades
```

Install `firewalld`:

```bash
sudo apt install -y firewalld
```

### RHEL/Rocky/Alma/CentOS Stream/Fedora

```bash
sudo dnf install -y epel-release
sudo dnf install -y \
  openssh-server curl ca-certificates python3 util-linux \
  firewalld fail2ban fail2ban-firewalld aide rkhunter \
  logrotate dnf-automatic
```

Do not enable the new firewall until its permanent configuration allows the **current** SSH port:

```bash
CURRENT_SSH_PORT=$(sudo sshd -T | awk '$1 == "port" {print $2; exit}')
test -n "$CURRENT_SSH_PORT"

if systemctl is-active --quiet firewalld; then
  sudo firewall-cmd --permanent \
    --add-port="${CURRENT_SSH_PORT}/tcp"
  sudo firewall-cmd --reload
else
  sudo firewall-offline-cmd --zone=public \
    --add-port="${CURRENT_SSH_PORT}/tcp"
  sudo systemctl enable --now firewalld
fi

sudo firewall-cmd --query-port="${CURRENT_SSH_PORT}/tcp"
```

Verify the packages and services instead of relying on the absence of errors from the installer:

```bash
systemctl is-active sshd 2>/dev/null || systemctl is-active ssh
systemctl is-active firewalld
command -v fail2ban-client aide rkhunter curl python3 flock
```

---

# Part II. SSH and the firewall without risking access

## 3. Creating the administrative user and the key

On the **client machine**, not on the server:

```bash
ssh-keygen -t ed25519 -a 64 -C "admin@my-server"
```

Never hand the private file `~/.ssh/id_ed25519` to anyone. Only the `.pub` file is installed on the server.

On the server:

```bash
id -u admin >/dev/null 2>&1 \
  || sudo useradd --create-home --shell /bin/bash admin

if getent group sudo >/dev/null; then
  sudo usermod -aG sudo admin      # Debian/Ubuntu
elif getent group wheel >/dev/null; then
  sudo usermod -aG wheel admin     # RHEL-подобные
else
  echo 'Не найдена административная группа sudo/wheel' >&2
  exit 1
fi

sudo install -d -o admin -g admin -m 0700 /home/admin/.ssh
sudo test -e /home/admin/.ssh/authorized_keys \
  || sudo install -o admin -g admin -m 0600 /dev/null \
       /home/admin/.ssh/authorized_keys
sudo chown admin:admin /home/admin/.ssh/authorized_keys
sudo chmod 0600 /home/admin/.ssh/authorized_keys
```

Add the public key without overwriting the existing ones:

```bash
printf '%s\n' 'ssh-ed25519 ЗАМЕНИТЕ_НА_СВОЙ_ПУБЛИЧНЫЙ_КЛЮЧ' \
  | sudo tee -a /home/admin/.ssh/authorized_keys >/dev/null
sudo sort -u -o /home/admin/.ssh/authorized_keys /home/admin/.ssh/authorized_keys
sudo chown admin:admin /home/admin/.ssh/authorized_keys
sudo chmod 0600 /home/admin/.ssh/authorized_keys
sudo restorecon -RF /home/admin/.ssh 2>/dev/null || true
```

In a second local tab, verify the login while forbidding a fallback to a password:

```bash
ssh -o BatchMode=yes -o IdentitiesOnly=yes \
  -i ~/.ssh/id_ed25519 admin@SERVER_IP 'id; sudo -n true || true'
```

If the key does not work, **do not disable passwords**.

## 4. Choosing the SSH port and opening the firewall in advance

A non-standard port reduces log noise, but it is not a protection measure on its own. The examples use a variable:

```bash
SSH_PORT=2207
```

Open the new port before changing SSH:

```bash
sudo firewall-cmd --permanent --add-port="${SSH_PORT}/tcp"
sudo firewall-cmd --reload
sudo firewall-cmd --query-port="${SSH_PORT}/tcp"
```

If the server provides only SSH and web, the resulting firewall may look like this:

```bash
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --remove-service=ssh
sudo firewall-cmd --reload
sudo firewall-cmd --list-all
```

Remove the standard `ssh` service only after the new port has been verified.

## 5. Hardening sshd

It is better to use a separate drop-in:

```bash
sudo install -d -m 0755 /etc/ssh/sshd_config.d
sudoedit /etc/ssh/sshd_config.d/60-hardening.conf
```

Contents:

```sshconfig
Port 2207
PermitRootLogin no
PubkeyAuthentication yes
PasswordAuthentication no
KbdInteractiveAuthentication no
MaxAuthTries 3
X11Forwarding no
ClientAliveInterval 300
ClientAliveCountMax 2
UsePAM yes
```

Check the syntax and the effective values:

```bash
sudo sshd -t
sudo sshd -T | grep -E \
  '^(port|permitrootlogin|pubkeyauthentication|passwordauthentication|kbdinteractiveauthentication|maxauthtries|x11forwarding|clientaliveinterval|clientalivecountmax) '
```

Do not run `systemctl restart sshd` blindly. Reload first:

```bash
sudo systemctl reload sshd 2>/dev/null || sudo systemctl reload ssh
sudo ss -ltnp | grep ":${SSH_PORT} "
```

Verify a new session:

```bash
ssh -o BatchMode=yes -o IdentitiesOnly=yes \
  -i ~/.ssh/id_ed25519 -p 2207 admin@SERVER_IP 'printf "key login OK\n"'
```

Only after this succeeds may you close the old session and remove the rule for the old SSH port.

---

# Part III. Fail2ban and CrowdSec

## 6. Pointing Fail2ban at the actual SSH port

Do not use `port = ssh` if sshd listens on a non-standard port: the service name usually resolves to `22/tcp`.

Create `/etc/fail2ban/jail.d/sshd.local`:

```ini
[DEFAULT]
backend = systemd
bantime = 1h
findtime = 10m
maxretry = 5
bantime.increment = true
bantime.factor = 2
bantime.maxtime = 1w
ignoreip = 127.0.0.1/8 ::1
banaction = firewallcmd-rich-rules
banaction_allports = firewallcmd-rich-rules

[sshd]
enabled = true
port = 2207
maxretry = 3

[recidive]
enabled = true
backend = systemd
bantime = 1w
findtime = 1d
maxretry = 5
banaction = firewallcmd-rich-rules
banaction_allports = firewallcmd-rich-rules
```

On RHEL with `fail2ban-firewalld`, `/etc/fail2ban/jail.d/00-firewalld.conf` is usually created already. If it is not, add this to `[DEFAULT]`:

```ini
banaction = firewallcmd-rich-rules
banaction_allports = firewallcmd-rich-rules
```

Before restarting:

```bash
sudo fail2ban-client -t
sudo systemctl enable --now fail2ban
sudo systemctl restart fail2ban
```

Wait until the application is ready:

```bash
for i in $(seq 1 20); do
  sudo fail2ban-client ping >/dev/null 2>&1 && break
  sleep 1
done
sudo fail2ban-client ping
sudo fail2ban-client status
sudo fail2ban-client status sshd
```

Check the effective values:

```bash
sudo fail2ban-client get sshd maxretry
sudo fail2ban-client get sshd findtime
sudo fail2ban-client get sshd bantime
sudo fail2ban-client -d | grep -A3 -B3 "'port', '2207'"
```

Do not test a ban from the only address you use to administer the server. Use a separate connection and a provider console prepared in advance.

Unbanning:

```bash
sudo fail2ban-client set sshd unbanip TEST_IP
```

## 7. Installing CrowdSec and the firewall bouncer

CrowdSec consists of at least two parts:

- the Security Engine analyses logs and creates decisions;
- the remediation component applies the decisions to traffic.

Current official instructions: <https://docs.crowdsec.net/u/getting_started/installation/linux/>.

Instead of an unconditional `curl | sh`, download the bootstrap separately and inspect it:

```bash
curl -fsSL https://install.crowdsec.net -o /tmp/install-crowdsec.sh
less /tmp/install-crowdsec.sh
sudo sh /tmp/install-crowdsec.sh
rm -f /tmp/install-crowdsec.sh
```

### Debian/Ubuntu

```bash
sudo apt update
apt-cache policy crowdsec
sudo apt install -y crowdsec crowdsec-firewall-bouncer-iptables
```

### RHEL/CentOS/Fedora

```bash
sudo dnf info crowdsec
sudo dnf install -y crowdsec crowdsec-firewall-bouncer-iptables
```

The official documentation uses the package name `crowdsec-firewall-bouncer-iptables`; the bouncer itself can operate in nftables mode. Prefer installation from packages. If the binary is installed manually and `rpm -qf`/`dpkg -S` finds no owner, updates and provenance control become your responsibility.

Enable and verify:

```bash
sudo systemctl enable --now crowdsec
sudo systemctl enable --now crowdsec-firewall-bouncer
sudo systemctl is-active crowdsec crowdsec-firewall-bouncer
sudo systemctl show crowdsec crowdsec-firewall-bouncer \
  -p Result -p ExecMainStatus
```

Install the collections that match the services you actually run:

```bash
sudo cscli collections install crowdsecurity/linux crowdsecurity/sshd
# Если есть Nginx:
sudo cscli collections install crowdsecurity/nginx \
  crowdsecurity/base-http-scenarios crowdsecurity/http-cve
sudo systemctl restart crowdsec
```

Check the log sources and the metrics:

```bash
sudo cscli collections list
sudo cscli metrics
sudo cscli decisions list
sudo cscli bouncers list
sudo journalctl -u crowdsec -u crowdsec-firewall-bouncer \
  --since '30 minutes ago' --no-pager
```

Keep an important difference in mind: `cscli decisions list -o json` may return a list of alerts that contain decisions inside them. For automation, do not count table rows; parse the JSON according to the version you actually have.

Run a safe test of a local decision against a documentation address that does not belong to you:

```bash
sudo cscli decisions add --ip 192.0.2.123 --duration 2m --reason test
sudo cscli decisions list
sudo nft list ruleset | grep -i crowdsec
sudo cscli decisions delete --ip 192.0.2.123
```

Never publish the bouncer API key from `/etc/crowdsec/bouncers/*.yaml`.

---

# Part IV. The shared Telegram transport

## 8. Creating the Bot API configuration

Create a bot through the official `@BotFather`, start a chat with it and obtain the chat ID. Do not paste the token directly into a shell command: it will end up in the history.

```bash
sudo install -d -o root -g root -m 0700 /etc/server-security-monitor
sudo test -e /etc/server-security-monitor/telegram.env \
  || sudo install -o root -g root -m 0600 /dev/null \
       /etc/server-security-monitor/telegram.env
sudo chown root:root /etc/server-security-monitor/telegram.env
sudo chmod 0600 /etc/server-security-monitor/telegram.env
sudoedit /etc/server-security-monitor/telegram.env
```

Contents:

```bash
TELEGRAM_BOT_TOKEN="ЗАМЕНИТЕ_НА_ТОКЕН"
TELEGRAM_CHAT_ID="ЗАМЕНИТЕ_НА_CHAT_ID"
```

Check only the structure and the permissions, without printing the values:

```bash
sudo stat -c '%A %U:%G %n' /etc/server-security-monitor/telegram.env
sudo awk -F= '/^[A-Z_]+=/ {print $1"=<set>"}' \
  /etc/server-security-monitor/telegram.env
```

## 9. The shared library

Create the directory:

```bash
sudo install -d -o root -g root -m 0750 \
  /usr/local/libexec/server-security-monitor
sudoedit /usr/local/libexec/server-security-monitor/common.sh
```

Contents of `common.sh`:

```bash
#!/usr/bin/env bash
# Общие функции. Файл должен принадлежать root и не изменяться обычными пользователями.

SSM_CONF=${SSM_CONF:-/etc/server-security-monitor/telegram.env}
SSM_CURL=${SSM_CURL:-/usr/bin/curl}

load_telegram_config() {
  [[ -r "$SSM_CONF" ]] || {
    printf 'Telegram config is not readable: %s\n' "$SSM_CONF" >&2
    return 2
  }

  # Это root-only доверенный конфигурационный файл.
  # shellcheck disable=SC1090
  set -a
  . "$SSM_CONF"
  set +a

  : "${TELEGRAM_BOT_TOKEN:?TELEGRAM_BOT_TOKEN is missing}"
  : "${TELEGRAM_CHAT_ID:?TELEGRAM_CHAT_ID is missing}"
}

html_escape() {
  sed -e 's/&/\&amp;/g' -e 's/</\&lt;/g' -e 's/>/\&gt;/g'
}

tg_send() {
  local msg=${1:-}
  [[ -n "$msg" ]] || return 0
  load_telegram_config

  # Telegram принимает до 4096 символов; оставляем запас.
  if ((${#msg} > 3900)); then
    msg="${msg:0:3820}
…сообщение сокращено; полный отчёт сохранён на сервере"
  fi

  local response body
  body=$(CHAT_ID="$TELEGRAM_CHAT_ID" MESSAGE="$msg" python3 - <<'PY'
import os, urllib.parse
print(urllib.parse.urlencode({
    "chat_id": os.environ["CHAT_ID"],
    "text": os.environ["MESSAGE"],
    "parse_mode": "HTML",
    "disable_web_page_preview": "true",
}))
PY
  )

  # URL с токеном передаётся через отдельный FD, а POST body — через stdin:
  # токен, chat ID и текст не появляются в argv процесса curl.
  exec 3<<<"url = \"https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage\""
  response=$(printf '%s' "$body" | "$SSM_CURL" \
      --config /dev/fd/3 \
      --fail --silent --show-error \
      --connect-timeout 3 --max-time 12 \
      -X POST \
      -H 'Content-Type: application/x-www-form-urlencoded' \
      --data-binary @-) || {
    exec 3<&-
    return 1
  }
  exec 3<&-

  RESPONSE=$response python3 - <<'PY'
import json, os, sys
try:
    ok = json.loads(os.environ["RESPONSE"]).get("ok") is True
except Exception:
    ok = False
sys.exit(0 if ok else 1)
PY
}
```

Set the permissions and check the syntax:

```bash
sudo chown root:root /usr/local/libexec/server-security-monitor/common.sh
sudo chmod 0750 /usr/local/libexec/server-security-monitor/common.sh
sudo bash -n /usr/local/libexec/server-security-monitor/common.sh
```

Create a test sender `/usr/local/libexec/server-security-monitor/send-test.sh`:

```bash
#!/usr/bin/env bash
set -Eeuo pipefail
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
. /usr/local/libexec/server-security-monitor/common.sh
tg_send "✅ <b>Тест мониторинга</b> на <code>$(hostname -f 2>/dev/null || hostname)</code>"
```

```bash
sudo chmod 0750 /usr/local/libexec/server-security-monitor/send-test.sh
sudo /usr/local/libexec/server-security-monitor/send-test.sh
```

Do not move on until the test message has arrived.

---

# Part V. AIDE and rkhunter

## 10. Initializing AIDE

AIDE stores checksums and file metadata. Its database is itself a critical asset.

### RHEL-like systems

```bash
sudo aide --config-check
sudo aide --init
sudo test -f /var/lib/aide/aide.db.new.gz
sudo install -o root -g root -m 0600 \
  /var/lib/aide/aide.db.new.gz /var/lib/aide/aide.db.gz
```

### Debian/Ubuntu

On Debian the paths may differ, and the configuration may be assembled from `/etc/aide/aide.conf.d`:

```bash
sudo aideinit
sudo update-aide.conf
sudo aide --config-check
```

Determine the actual paths from the configuration:

```bash
sudo grep -RhsE '^(database|database_in|database_out)=' \
  /etc/aide.conf /etc/aide/aide.conf* /etc/aide/aide.conf.d 2>/dev/null
```

The final check must return code `0`:

```bash
sudo aide --check
printf 'AIDE rc=%s\n' "$?"
```

Codes `1`, `2` and `4` form a bit mask of added, removed and changed objects. Their combinations up to `7` mean that changes were found, not necessarily that the scanner is broken.

## 11. The AIDE script

```bash
sudo install -d -o root -g root -m 0700 \
  /var/log/server-security-monitor/aide
sudoedit /usr/local/libexec/server-security-monitor/aide-check.sh
```

```bash
#!/usr/bin/env bash
set -Eeuo pipefail
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
export LC_ALL=C
. /usr/local/libexec/server-security-monitor/common.sh

AIDE_BIN=${AIDE_BIN:-$(command -v aide)}
LOG_ROOT=/var/log/server-security-monitor/aide
LOCK_FILE=/run/lock/server-security-aide.lock
MAX_PATHS=30

install -d -o root -g root -m 0700 "$LOG_ROOT"
exec 9>"$LOCK_FILE"
flock -n 9 || exit 0

stamp=$(date '+%Y%m%d-%H%M%S')
report="$LOG_ROOT/aide-$stamp.log"

set +e
"$AIDE_BIN" --check >"$report" 2>&1
rc=$?
set -e
chmod 0600 "$report"

[[ $rc -eq 0 ]] && exit 0

summary=$(grep -iE \
  'Total number of entries:[[:space:]]*[0-9]+|Added entries:[[:space:]]*[0-9]+|Removed entries:[[:space:]]*[0-9]+|Changed entries:[[:space:]]*[0-9]+' \
  "$report" | head -n 4 || true)

paths=$(awk -v max="$MAX_PATHS" '
  /^[[:space:]]*(Added|Removed|Changed) entries:[[:space:]]*$/ {
    section=$0
    sub(/^[[:space:]]*/, "", section)
    next
  }
  section != "" && /:[[:space:]]+\// {
    if (!seen[section]++) print section
    print
    if (++count >= max) exit
  }
' "$report")

[[ -n "$summary" ]] || summary="AIDE exit code: $rc"
[[ -n "$paths" ]] || paths="Пути не извлечены; см. полный локальный отчёт."

summary_html=$(printf '%s' "$summary" | html_escape)
paths_html=$(printf '%s' "$paths" | html_escape)
host=$(hostname -f 2>/dev/null || hostname)

if (( rc <= 7 )); then
  title='🧬 <b>AIDE: изменения файлов</b>'
else
  title="🚨 <b>AIDE: ошибка проверки, код ${rc}</b>"
fi

tg_send "${title} на <code>${host}</code>
$(date '+%F %T %Z')
<pre>${summary_html}</pre>
<pre>${paths_html}</pre>
Полный отчёт: <code>${report}</code>"

# Изменения файлов — успешная доставка finding; ошибка сканера — ошибка unit.
(( rc <= 7 )) && exit 0
exit "$rc"
```

## 12. The rkhunter script

```bash
sudo install -d -o root -g root -m 0700 \
  /var/log/server-security-monitor/rkhunter
sudoedit /usr/local/libexec/server-security-monitor/rkhunter-check.sh
```

```bash
#!/usr/bin/env bash
set -Eeuo pipefail
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
export LC_ALL=C
. /usr/local/libexec/server-security-monitor/common.sh

RKHUNTER_BIN=${RKHUNTER_BIN:-$(command -v rkhunter)}
LOG_ROOT=/var/log/server-security-monitor/rkhunter
LOCK_FILE=/run/lock/server-security-rkhunter.lock

install -d -o root -g root -m 0700 "$LOG_ROOT"
exec 9>"$LOCK_FILE"
flock -n 9 || exit 0

stamp=$(date '+%Y%m%d-%H%M%S')
report="$LOG_ROOT/rkhunter-$stamp.log"

set +e
"$RKHUNTER_BIN" --cronjob --report-warnings-only --nocolors \
  >"$report" 2>&1
rc=$?
set -e
chmod 0600 "$report"

if [[ -s "$report" ]]; then
  excerpt=$(head -n 35 "$report" | html_escape)
  host=$(hostname -f 2>/dev/null || hostname)
  tg_send "🦠 <b>rkhunter: предупреждения</b> на <code>${host}</code>
$(date '+%F %T %Z')
<pre>${excerpt}</pre>
Полный отчёт: <code>${report}</code>"
fi

# На распространённых сборках rc=1 сопровождает warnings; >=2 — ошибка запуска.
if (( rc >= 2 )); then
  [[ -s "$report" ]] || tg_send "🚨 <b>rkhunter: ошибка запуска</b>, код ${rc}"
  exit "$rc"
fi
exit 0
```

Never run `rkhunter --propupd` automatically. That command declares the current state trusted. First confirm the origin of the changes through the package manager and the update log.

## 13. systemd units and timers

`/etc/systemd/system/aide-check.service`:

```ini
[Unit]
Description=AIDE file integrity check
After=local-fs.target network-online.target
Wants=network-online.target

[Service]
Type=oneshot
ExecStart=/usr/local/libexec/server-security-monitor/aide-check.sh
Nice=10
IOSchedulingClass=idle
UMask=0077
TimeoutStartSec=20min
```

`/etc/systemd/system/aide-check.timer`:

```ini
[Unit]
Description=Daily AIDE integrity check

[Timer]
OnCalendar=*-*-* 04:00:00
RandomizedDelaySec=900
Persistent=true

[Install]
WantedBy=timers.target
```

`/etc/systemd/system/rkhunter-check.service`:

```ini
[Unit]
Description=rkhunter rootkit scan
After=local-fs.target network-online.target
Wants=network-online.target

[Service]
Type=oneshot
ExecStart=/usr/local/libexec/server-security-monitor/rkhunter-check.sh
Nice=10
IOSchedulingClass=idle
UMask=0077
TimeoutStartSec=30min
```

`/etc/systemd/system/rkhunter-check.timer`:

```ini
[Unit]
Description=Daily rkhunter scan

[Timer]
OnCalendar=*-*-* 04:30:00
RandomizedDelaySec=900
Persistent=true

[Install]
WantedBy=timers.target
```

Set the permissions and activate:

```bash
sudo chown root:root \
  /usr/local/libexec/server-security-monitor/*.sh \
  /etc/systemd/system/{aide-check,rkhunter-check}.{service,timer}
sudo chmod 0750 /usr/local/libexec/server-security-monitor/*.sh
sudo chmod 0644 /etc/systemd/system/{aide-check,rkhunter-check}.{service,timer}

sudo bash -n /usr/local/libexec/server-security-monitor/*.sh
sudo systemd-analyze verify \
  /etc/systemd/system/aide-check.service \
  /etc/systemd/system/rkhunter-check.service
sudo systemctl daemon-reload
sudo systemctl enable --now aide-check.timer rkhunter-check.timer
```

Start the real units:

```bash
sudo systemctl start aide-check.service
sudo systemctl start rkhunter-check.service
sudo systemctl show aide-check.service rkhunter-check.service \
  -p Result -p ExecMainStatus
sudo journalctl -u aide-check.service -u rkhunter-check.service \
  --since '1 hour ago' --no-pager
```

After finishing successfully, a oneshot service is usually in the `inactive` state, and that is normal. What matters is `Result=success` and `ExecMainStatus=0`.

---

# Part VI. Instant notifications through PAM

## 14. The send-message and login-alert scripts

The PAM variables are controlled by the remote login. Never insert them into `eval`, `bash -c` or a command line you build.

First create `/usr/local/libexec/server-security-monitor/send-message.sh`:

```bash
#!/usr/bin/env bash
set -Eeuo pipefail
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
. /usr/local/libexec/server-security-monitor/common.sh
tg_send "${1:-}"
```

`/usr/local/libexec/server-security-monitor/login-alert.sh`:

```bash
#!/usr/bin/env bash
# Ошибка Telegram не должна блокировать login.
set -u
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

[[ ${PAM_TYPE:-} == open_session ]] || exit 0
. /usr/local/libexec/server-security-monitor/common.sh

case "${PAM_SERVICE:-unknown}" in
  sshd) icon='🔐'; kind='SSH-вход' ;;
  sudo) icon='🧨'; kind='sudo' ;;
  su)   icon='🔀'; kind='su' ;;
  *)    icon='👤'; kind=${PAM_SERVICE:-unknown} ;;
esac

user=$(printf '%s' "${PAM_USER:-?}" | html_escape)
source_host=$(printf '%s' "${PAM_RHOST:-local}" | html_escape)
service=$(printf '%s' "${PAM_SERVICE:-unknown}" | html_escape)
tty=$(printf '%s' "${PAM_TTY:-?}" | html_escape)
host=$(hostname -f 2>/dev/null || hostname)

msg="${icon} <b>${kind}</b> на <code>${host}</code>
Пользователь: <code>${user}</code>
Источник: <code>${source_host:-local}</code>
Сервис/TTY: <code>${service} / ${tty}</code>
$(date '+%F %T %Z')"

# Данные передаются как один argv и никогда не вычисляются shell повторно.
/usr/bin/setsid -f \
  /usr/local/libexec/server-security-monitor/send-message.sh \
  "$msg" >/dev/null 2>&1 || true
exit 0
```

```bash
sudo chown root:root \
  /usr/local/libexec/server-security-monitor/{send-message,login-alert}.sh
sudo chmod 0750 \
  /usr/local/libexec/server-security-monitor/{send-message,login-alert}.sh
sudo bash -n \
  /usr/local/libexec/server-security-monitor/{send-message,login-alert}.sh
```

## 15. Attaching PAM safely

First keep the current root/sudo session open and make sure the provider console is available.

```bash
sudo cp -a /etc/pam.d/sshd "/etc/pam.d/sshd.bak.$(date +%s)"
sudo cp -a /etc/pam.d/sudo "/etc/pam.d/sudo.bak.$(date +%s)"
```

Add this to the end of `/etc/pam.d/sshd`:

```pam
session optional pam_exec.so /usr/local/libexec/server-security-monitor/login-alert.sh
```

Optionally add the same line to `/etc/pam.d/sudo`. Notifications about every `sudo` can be noisy; on a server with heavy automation it is better to notify about SSH only.

The keyword must be `optional`, not `required`: an unavailable Telegram must not deprive you of access to the server.

Verify a new SSH login in a second session. If it does not work, restore the PAM file from the backup through the current session or the console.

---

# Part VII. The daily digest

## 16. The security-digest script

`/usr/local/libexec/server-security-monitor/security-digest.sh`:

```bash
#!/usr/bin/env bash
set -Eeuo pipefail
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
export LC_ALL=C
. /usr/local/libexec/server-security-monitor/common.sh

exec 9>/run/lock/server-security-digest.lock
flock -n 9 || exit 0

f2b=$(fail2ban-client status sshd 2>/dev/null || true)
banned=$(printf '%s\n' "$f2b" | awk -F: '
  tolower($1) ~ /currently banned/ {gsub(/[^0-9]/,"",$2); print $2; exit}')
total=$(printf '%s\n' "$f2b" | awk -F: '
  tolower($1) ~ /total banned/ {gsub(/[^0-9]/,"",$2); print $2; exit}')

ssh_unit=sshd
systemctl cat ssh.service >/dev/null 2>&1 && ssh_unit=ssh
fails=$(journalctl -u "$ssh_unit" --since '24 hours ago' --no-pager \
  2>/dev/null | grep -ciE \
  'Failed password|Invalid user|authentication failure' || true)

cs_json=$(cscli decisions list -o json 2>/dev/null || true)
cs=$(printf '%s' "$cs_json" | python3 -c '
import json, sys
try:
    data=json.load(sys.stdin)
    if isinstance(data, list):
        # Некоторые версии возвращают alerts с вложенными decisions.
        print(sum(len(x.get("decisions", [])) if isinstance(x, dict) else 0
                  for x in data))
    elif isinstance(data, dict):
        print(len(data.get("decisions", [])))
    else:
        print("?")
except Exception:
    print("?")')

mem=$(free -m | awk '/^Mem:/{print $3"/"$2" MB"}')
disk=$(df -P / | awk 'NR==2{print $5}')
read -r l1 l5 l15 _ </proc/loadavg

if command -v needs-restarting >/dev/null 2>&1; then
  if needs-restarting -r >/dev/null 2>&1; then
    reboot_state='✅ ребут не нужен'
  else
    reboot_state='♻️ <b>НУЖЕН РЕБУТ</b>'
  fi
elif [[ -e /var/run/reboot-required ]]; then
  reboot_state='♻️ <b>НУЖЕН РЕБУТ</b>'
else
  reboot_state='✅ ребут не требуется или не определён'
fi

check_timer() {
  local timer=$1 service=$2
  systemctl is-active --quiet "$timer" &&
  systemctl is-enabled --quiet "$timer" &&
  [[ $(systemctl show "$service" -p Result --value 2>/dev/null) == success ]] &&
  [[ $(systemctl show "$service" -p ExecMainStatus --value 2>/dev/null) == 0 ]]
}

health=()
check_timer aide-check.timer aide-check.service \
  && health+=('AIDE✅') || health+=('AIDE⚠️')
check_timer rkhunter-check.timer rkhunter-check.service \
  && health+=('rkhunter✅') || health+=('rkhunter⚠️')
systemctl is-active --quiet crowdsec crowdsec-firewall-bouncer \
  && health+=('CrowdSec✅') || health+=('CrowdSec⚠️')
systemctl is-active --quiet fail2ban \
  && health+=('Fail2ban✅') || health+=('Fail2ban⚠️')

host=$(hostname -f 2>/dev/null || hostname)
tg_send "📋 <b>Дайджест ${host}</b> — $(date '+%F')
🔐 SSH забанено: ${banned:-?} (всего ${total:-?})
🛡 CrowdSec активных решений: ${cs:-?}
❌ Неудачных SSH за сутки: ${fails:-0}
🧠 RAM: ${mem} | 💾 Диск /: ${disk}
📈 load: ${l1}, ${l5}, ${l15}
${reboot_state}
🩺 ${health[*]}"
```

The `/etc/systemd/system/security-digest.service` unit:

```ini
[Unit]
Description=Daily security digest to Telegram
After=network-online.target crowdsec.service fail2ban.service
Wants=network-online.target

[Service]
Type=oneshot
ExecStart=/usr/local/libexec/server-security-monitor/security-digest.sh
Nice=10
IOSchedulingClass=idle
UMask=0077
TimeoutStartSec=2min
```

The `/etc/systemd/system/security-digest.timer` timer:

```ini
[Unit]
Description=Daily security digest to Telegram

[Timer]
OnCalendar=*-*-* 09:00:00
RandomizedDelaySec=900
Persistent=true

[Install]
WantedBy=timers.target
```

Activate it and verify with a real run:

```bash
sudo chmod 0750 /usr/local/libexec/server-security-monitor/security-digest.sh
sudo systemd-analyze verify /etc/systemd/system/security-digest.service
sudo systemctl daemon-reload
sudo systemctl enable --now security-digest.timer
sudo systemctl start security-digest.service
sudo systemctl show security-digest.service -p Result -p ExecMainStatus
sudo systemctl list-timers --all | grep security-digest
```

---

# Part VIII. Updates and rotation

## 17. Automatic security updates

### Debian/Ubuntu

```bash
sudo dpkg-reconfigure --priority=low unattended-upgrades
sudo systemctl enable --now unattended-upgrades
sudo unattended-upgrade --dry-run --debug
```

Check `/etc/apt/apt.conf.d/50unattended-upgrades` and make sure only the expected sources are enabled. Leave automatic reboot disabled by default; the digest will report `/var/run/reboot-required`.

### RHEL-like

In `/etc/dnf/automatic.conf`:

```ini
[commands]
upgrade_type = security
download_updates = yes
apply_updates = yes
reboot = never
```

```bash
sudo systemctl enable --now dnf-automatic-install.timer
sudo systemctl list-timers --all | grep dnf-automatic
```

Do not update the AIDE database automatically right after packages have been installed. First correlate the changes with the package manager log.

## 18. logrotate

`/etc/logrotate.d/server-security-monitor`:

```text
/var/log/server-security-monitor/aide/*.log /var/log/server-security-monitor/rkhunter/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    su root root
    create 0600 root root
}
```

A check without rotating:

```bash
sudo logrotate -d /etc/logrotate.d/server-security-monitor
sudo find /var/log/server-security-monitor -type f \
  -printf '%m %u:%g %s %p\n'
```

All reports must be `0600 root:root`.

---

# Part IX. Full verification

## 19. Production checklist

### SSH and the firewall

```bash
sudo sshd -t
sudo sshd -T | grep -E \
  '^(port|permitrootlogin|passwordauthentication|kbdinteractiveauthentication|pubkeyauthentication|maxauthtries) '
sudo ss -ltnp
sudo firewall-cmd --list-all
```

Expected:

- root login is forbidden;
- passwords and keyboard-interactive are disabled;
- public keys are enabled;
- the firewall contains only the required services and the actual SSH port.

### Fail2ban

```bash
sudo fail2ban-client ping
sudo fail2ban-client status
sudo fail2ban-client status sshd
sudo fail2ban-client -t
```

### CrowdSec

```bash
sudo systemctl is-active crowdsec crowdsec-firewall-bouncer
sudo cscli metrics
sudo cscli decisions list
sudo cscli bouncers list
sudo nft list ruleset | grep -i crowdsec
```

### Monitoring

```bash
sudo systemctl start aide-check.service
sudo systemctl start rkhunter-check.service
sudo systemctl start security-digest.service

sudo systemctl show \
  aide-check.service rkhunter-check.service security-digest.service \
  -p Result -p ExecMainStatus

sudo systemctl is-enabled \
  aide-check.timer rkhunter-check.timer security-digest.timer
sudo systemctl list-timers --all | grep -E \
  'aide-check|rkhunter-check|security-digest'
```

### Files and secrets

```bash
sudo stat -c '%A %U:%G %n' \
  /etc/server-security-monitor/telegram.env \
  /usr/local/libexec/server-security-monitor/*.sh \
  /var/log/server-security-monitor

sudo grep -RIlE \
  '[0-9]{6,12}:[A-Za-z0-9_-]{20,}' \
  /usr/local/libexec/server-security-monitor \
  /etc/systemd/system || true
```

The last command must not find any Telegram tokens in the scripts or units.

## 20. Negative tests

Test a Telegram failure by temporarily pointing at a non-existent config through a variable set for the test command only:

```bash
sudo SSM_CONF=/nonexistent \
  /usr/local/libexec/server-security-monitor/send-test.sh
```

The command must exit with an error, but SSH/PAM login must not be blocked.

Test that a parallel run is blocked:

```bash
sudo flock /run/lock/server-security-aide.lock sleep 15 &
sudo systemctl start aide-check.service
```

The second run must exit quietly without starting a second heavy scan.

Do not create a test change in a system file. For AIDE, use a separate test path that was included in advance, for example `/root/aide-test`, then remove it and investigate both findings. After the test, the database is not updated without a manual check.

---

# Part X. Investigation and maintenance

## 21. What to do when AIDE raises an alert

1. Do not run `aide --update`.
2. Save the full report and the time of the event.
3. For every path, run:

```bash
sudo stat /PATH/TO/FILE
sudo rpm -qf /PATH/TO/FILE 2>/dev/null || true
sudo dpkg -S /PATH/TO/FILE 2>/dev/null || true
sudo getcap /PATH/TO/FILE 2>/dev/null || true
sudo ls -lZ /PATH/TO/FILE 2>/dev/null || true
```

4. Correlate the time with updates:

```bash
sudo dnf history info last 2>/dev/null || true
sudo grep -hE ' upgrade | install | remove ' /var/log/apt/history.log 2>/dev/null || true
```

5. Check SSH/sudo and the system journal around the time of the change.
6. If the change is expected, back up the old database and run the update manually.
7. If the origin is unknown, do not destroy evidence: restrict the network, preserve the logs and investigate from a trusted host.

### Updating the AIDE database safely

The paths differ between distributions. For the RHEL-like variant:

```bash
sudo aide --check
sudo aide --update
sudo test -f /var/lib/aide/aide.db.new.gz
sudo cp -a /var/lib/aide/aide.db.gz \
  "/var/lib/aide/aide.db.gz.bak.$(date +%s)"
sudo install -o root -g root -m 0600 \
  /var/lib/aide/aide.db.new.gz /var/lib/aide/aide.db.gz
sudo aide --check
```

The last command must return `0`. Do not redirect the update report into a directory that AIDE checks in the same run: that creates self-generated changes.

## 22. rkhunter and false positives

rkhunter is a heuristic tool, not proof of a compromise. Check:

- whether the file belongs to a package;
- changes made after an update;
- permissions, owner, capabilities and the SELinux context;
- whether a duplicate scheduler exists.

Some packages install `/etc/cron.daily/rkhunter` while you additionally create a systemd timer. That leads to a double run and sometimes to a queue of local mail. Check:

```bash
sudo run-parts --test /etc/cron.daily | grep -i rkhunter || true
sudo systemctl is-enabled rkhunter-check.timer
sudo systemctl show rkhunter-check.service -p Result -p ExecMainStatus
```

If the custom timer fully replaces the package cron job, use the package's documented disable option. If there is none, it is acceptable to remove the executable bit from that specific cron file only, while recording how to revert it. A package update may restore that bit.

## 23. Monthly maintenance

```bash
sudo sshd -t
sudo fail2ban-client -t
sudo cscli hub update
sudo cscli collections list
sudo cscli metrics
sudo systemctl --failed
sudo systemctl list-timers --all
sudo journalctl -p 0..3 --since '30 days ago'
sudo find /var/log/server-security-monitor -type f \
  -printf '%m %u:%g %TY-%Tm-%Td %p\n'
```

Do not run an automatic `cscli hub upgrade` without reading the release notes and backing up the configuration.

---

# Part XI. Rollback and removal

## 24. Fast SSH/PAM rollback

Through an open emergency session or the provider console:

```bash
sudo cp -a "$BACKUP/ssh/." /etc/ssh/
sudo cp -a "$BACKUP/pam.d/." /etc/pam.d/
sudo sshd -t
sudo systemctl reload sshd 2>/dev/null || sudo systemctl reload ssh
```

If the `BACKUP` variable has already been lost, find the directory manually under `/root/server-security-backup-*`.

## 25. Disabling the monitoring layer

```bash
sudo systemctl disable --now \
  aide-check.timer rkhunter-check.timer security-digest.timer
sudo rm -f /etc/systemd/system/{aide-check,rkhunter-check,security-digest}.{service,timer}
sudo systemctl daemon-reload
```

Before removing the PAM hook, first delete only the line with `server-security-monitor/login-alert.sh`, verify a new SSH login, and only then remove the scripts.

```bash
sudo rm -rf /usr/local/libexec/server-security-monitor
sudo rm -f /etc/logrotate.d/server-security-monitor
```

Do not delete `/etc/server-security-monitor/telegram.env` and the reports until you have confirmed that they are no longer needed. Destroy secrets deliberately:

```bash
sudo rm -f /etc/server-security-monitor/telegram.env
```

Remove CrowdSec and Fail2ban with the regular package manager only after stopping the bouncer and checking the firewall:

```bash
sudo systemctl disable --now crowdsec-firewall-bouncer crowdsec fail2ban
sudo nft list ruleset
sudo firewall-cmd --list-all
```

---

# The real verification setup

The architecture described in this article was re-verified against a working CentOS Stream 9 server. At the time of the check:

- SELinux was `Enforcing`;
- SSH listened only on a non-standard port and had `PermitRootLogin no`, `PasswordAuthentication no`, `KbdInteractiveAuthentication no`, `MaxAuthTries 3`;
- firewalld was active and opened only the declared web services and the SSH port;
- Fail2ban served `sshd` and `recidive`, used the systemd backend and the numeric SSH port;
- the CrowdSec engine and the firewall bouncer were active, and the bouncer applied nftables decisions;
- AIDE, rkhunter, the security digest and security updates were started by systemd timers with jitter and `Persistent=true`;
- the last oneshot runs had `Result=success` and `ExecMainStatus=0`;
- the Telegram configuration was `0600 root:root`;
- the local AIDE/rkhunter reports were stored as `0600 root:root` and rotated;
- the daily digest and the PAM alerts used bounded network timeouts;
- the AIDE database existed, and no temporary new database was left behind after the baseline had been accepted.

The audit also revealed an important operational lesson: the firewall bouncer could be working while its binary did not belong to an installed RPM package. This does not break the protection immediately, but it does degrade updatability and provenance. For new installations, use the official package and check the owner of the binary:

```bash
rpm -qf "$(command -v crowdsec-firewall-bouncer)" 2>/dev/null || true
dpkg -S "$(command -v crowdsec-firewall-bouncer)" 2>/dev/null || true
```

# Conclusion

The resulting system combines preventive controls, detection, remediation and notifications:

- SSH keys and the ban on root/password login reduce the authentication surface;
- the firewall defines the minimal network exposure;
- Fail2ban reacts to local SSH errors;
- CrowdSec recognises broader scenarios and applies collective reputation;
- AIDE detects file changes;
- rkhunter provides an additional heuristic signal;
- automatic security updates shrink the window of known vulnerabilities;
- Telegram reports events, while the full evidence stays local;
- systemd timers, locks, timeouts and exit status checks make the monitoring operationally reliable.

The main point is not simply to install the components, but to check regularly that they really work: that they listen on the right ports, apply decisions, complete their checks successfully, store reports and deliver notifications without exposing secrets.

## Official sources

- OpenSSH manual: <https://man.openbsd.org/sshd_config>
- firewalld documentation: <https://firewalld.org/documentation/>
- Fail2ban project: <https://github.com/fail2ban/fail2ban>
- CrowdSec Linux installation: <https://docs.crowdsec.net/u/getting_started/installation/linux/>
- CrowdSec documentation: <https://docs.crowdsec.net/>
- AIDE project: <https://aide.github.io/>
- Debian AIDE manual: <https://manpages.debian.org/bookworm/aide/aide.1.en.html>
- rkhunter project: <https://rkhunter.sourceforge.net/>
- systemd timers: <https://www.freedesktop.org/software/systemd/man/latest/systemd.timer.html>
- Telegram Bot API: <https://core.telegram.org/bots/api>

</div>

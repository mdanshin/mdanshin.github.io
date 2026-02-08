---
title: "Обратная связь"
title_en: "Contact"
permalink: "/contact.html"
---

<form action="https://formspree.io/{{site.email}}" method="POST">    
<p class="mb-4">
    <span data-lang="ru">Вы можете связаться со мной используя эту форму обратной связи или написать письмо на {{site.email}}. Я отвечу Вам как только смогу.</span>
    <span data-lang="en">You can contact me using this form or send an email to {{site.email}}. I'll reply as soon as I can.</span>
</p>
<div class="form-group row">
<div class="col-md-6">
<input class="form-control" type="text" name="name" placeholder="Имя*" data-i18n-placeholder-ru="Имя*" data-i18n-placeholder-en="Name*" required>
</div>
<div class="col-md-6">
<input class="form-control" type="email" name="_replyto" placeholder="E-mail*" data-i18n-placeholder-ru="E-mail*" data-i18n-placeholder-en="E-mail*" required>
</div>
</div>
<textarea rows="8" class="form-control mb-3" name="message" placeholder="Сообщение*" data-i18n-placeholder-ru="Сообщение*" data-i18n-placeholder-en="Message*" required></textarea>    
<input class="btn btn-success" type="submit" value="Отправить" data-i18n-value-ru="Отправить" data-i18n-value-en="Send">
</form>

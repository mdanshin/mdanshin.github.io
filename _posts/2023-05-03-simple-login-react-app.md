---
layout: post
title:  "Авторизация в React - базовые сведения"
categories: [ Программирование ]
tags: [ JavaScript, React ]
image: assets/images/simple-login-react-app/0.jpg
author: Mikhail
---

***В этой статье я хочу рассказать об архитектуре приложения, реализующего функцию аутентификации и авторизации. Статья построена на минималистичном примере. Тут главное понять концепцию. Сделав это, приложение можно дополнить новым функционалом и включить в любое своё приложение.***

Для того, чтобы сделать функционал авторизации нужно иметь back-end приложение с API, при вызове которого мы будем получать информацию о том, что пользователь прошёл авторизацию. И front-end приложение, которое будет запрашивать API. В этой статье я хочу поговорить об архитектуре front-end приложения и не буду останавливаться на особенностях beck-end. По сути авторизация будет фейковая. Но концепция, заложенная в архитектуру, без проблем может быть адаптирована для использования с реальной системой авторизации. Следующую статью я посвящу back-end. В ней я покажу пример простого API для авторизации и регистрации пользователей. Хранить и получать данные мы будем из базы даннх. А наше front-end приложение научится запрашивать этот API с использованием билиотеки Axios. В итоге весь проект будет выложен на GitHub.

Я использую Rect и React Router. В нашем приложении у нас будет главная форма, не требующая авторизацию, и одна страница, вход на которую возможен только после успешной авторизации.

> Для лучшего понимания того, что изложено в этой статье, убедитесь, что вы хорошо знаете, что такое [custom Hook](https://react.dev/learn/escape-hatches#reusing-logic-with-custom-hooks) и [Context](https://react.dev/reference/react#context-hooks), а так же как работает библиотека [React Router](https://reactrouter.com/en/main). Иначе вам будет сложно понять, как тут всё устроено.

Основная концепция заключается в том, что при переходе по ссылке, приложение проверяет состояние переменной `isAuthenticated` и в зависимости от этого пускает на страницу или перенаправляет на форму ввода пароля.

> Вместо переменной может быть всё, что угодно. Например, JWT access и/или refresh token, SID пользователя, или что-то ещё. И хранить, и получать эти данные можно из разных мест - Local Storage в браузере, Active Directory, БД, Web сервис или API. Всё зависит от сложности нашего приложения и типа авторизации, который мы хотим реализовать.

Для самых нетерпеливых, приведу полный листинг приложения, которое реализует описанную концепцию и дам комментарии по тексту. Возможно, что этого будет достаточно для понимания. Далее, в этой статье, я покажу как декомпозировать этот код и опишу каждый компонент отдельно.

Для начала:

{% include codeHeader.html %}
```bash
#Создаем новое React приложение с TypeScript шаблоном в директории dms-auth-simple с помощью команды npx create-react-app
npx create-react-app dms-auth-simple --template typescript

#Переходим в созданную директорию
cd dms-auth-simple/

#Устанавливаем библиотеку react-router-dom с помощью команды npm install
npm install --save react-router-dom

#Открываем приложение в редакторе кода Visual Studio Code
code .

#Запускаем приложение
npm start
```

Далее полный листинг кода приложения. Можете посмотреть его в [сodesandbox.io](https://codesandbox.io/s/dms-auth-simple-heqccp) и поиграться.

{% include codeHeader.html %}
```tsx
// Импортируем необходимые модули из библиотеки react
import { createContext, useContext, useState } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate, Outlet, useLocation, useNavigate, Link } from 'react-router-dom';

// Определяем тип контекста с двумя полями: isAuthenticated и setAuth
type AuthContextType = {
  isAuthenticated: boolean; // флаг, показывающий, аутентифицирован ли пользователь
  setAuth: (auth: boolean) => void; // функция для изменения значения isAuthenticated
};

// Создаем контекст с типом AuthContextType и начальными значениями по умолчанию
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  setAuth: () => { },
});

// Компонент App является корневым компонентом приложения
function App() {
  const [isAuthenticated, setAuth] = useState<boolean>(false); // определяем состояние isAuthenticated

  return (
    // оборачиваем компонент в Router, чтобы использовать роутинг
    <Router>
      {/* используем контекст для передачи значения isAuthenticated и функции setAuth вниз по иерархии компонентов */}
      <AuthContext.Provider value={% raw %}{{ isAuthenticated, setAuth }}{% endraw %}>
        <Routes>
          {/* обычные маршруты */}
          <Route path="/" element={<Main />} />
          <Route path="/login" element={<Login />} />

          {/* защищённые маршруты */}
          <Route element={<PrivateRoute />}>
            <Route path='/admin' element={<Admin />} />
            {/* другие защищённые маршруты */}
          </Route>
        </Routes>
      </AuthContext.Provider>
    </Router>

  );
}

// Компонент PrivateRoute используется для защиты определенных маршрутов в приложении.
const PrivateRoute = () => {
  const { isAuthenticated } = useContext(AuthContext); // используем контекст для получения значения isAuthenticated
  const location = useLocation(); // получаем текущий маршрут с помощью хука useLocation()

  return (
    // если пользователь авторизован, то рендерим дочерние элементы текущего маршрута, используя компонент Outlet
    isAuthenticated === true ?
      <Outlet />
      // если пользователь не авторизован, то перенаправляем его на маршрут /login с помощью компонента Navigate
      // свойство replace указывает, что текущий маршрут будет заменен на новый, чтобы пользователь не мог вернуться
      // обратно, используя кнопку "назад" в браузере.
      :
      <Navigate to="/login" state={% raw %}{{ from: location }}{% endraw %} replace />
  );
}

// Компонент Login отображает страницу авторизации и обрабатывает вход пользователя.
const Login = () => {
  const { setAuth } = useContext(AuthContext); // используем контекст для получения значений isAuthenticated и setAuth

  const navigate = useNavigate(); // используем хук useNavigate для навигации по маршрутам
  const location = useLocation(); // используем хук useLocation для получения текущего маршрута
  
  // получаем маршрут, на который нужно перенаправить пользователя после авторизации
  const from = location.state?.from?.pathname || '/'; 

  return (
    <>
      <div>Login</div>
      <button type={'button'} onClick={() => {
        setAuth(true); // устанавливаем флаг isAuthenticated в true
        navigate(from, { replace: true }); // перенаправляем пользователя на страницу, которую он запрашивал до авторизации
      }}>Login</button>
    </>
  );
}

// Компонент Main отображает главную страницу приложения.
const Main = () => {
  return (
    <>
      <div>Main</div>
      <Link to='/admin'>Go to Admin Page</Link>
    </>
  );
}

// Компонент Admin отображает страницу для администратора.
const Admin = () => {
  return (
    <>
      <div>Admin</div>
      <Link to='/main'>Go to Main Page</Link>
    </>
  );
}

// Компонент App является корневым компонентом приложения и содержит маршруты и контекст для авторизации.
export default App;
```

Теперь давайте обо всём с самого начала и подробнее, с декомпозицией кода.

Вот как выглядит окончательная структура проекта

```
├── src
│   ├── App.tsx
│   ├── components
│   │   ├── Navbar.tsx
│   │   └── PrivateRoute.tsx
│   ├── context
│   │   └── AuthProvider.tsx
│   ├── hooks
│   │   └── useAuth.tsx
│   ├── index.tsx
│   ├── pages
│   │   ├── Admin.tsx
│   │   ├── Login.tsx
│   │   ├── Logout.tsx
│   │   ├── Main.tsx
│   └── routes
│       └── routes.tsx
```

## Создание структуры проекта

Можно сразу создать все папки и файлы. Или создавать их по ходу чтения. Пока мы не дойдём до конца, проект будет не рабочим. И это нормально. Как только мы создадим все компоненты, то приложение заработает как надо.

{% include codeHeader.html %}
```bash
#Создаем новое React приложение с TypeScript шаблоном в директории dms-auth-simple с помощью команды npx create-react-app
npx create-react-app dms-auth-simple --template typescript

#Переходим в созданную директорию
cd dms-auth-simple/

# создаём структуру папок и файлы, необходимые для проекта
mkdir ./src/components/
touch ./src/components/Navbar.tsx
touch ./src/components/PrivateRoute.tsx

mkdir ./src/context/
touch ./src/context/AuthProvider.tsx

mkdir ./src/hooks/
touch ./src/hooks/useAuth.tsx

mkdir ./src/pages/
touch ./src/pages/Admin.tsx
touch ./src/pages/Login.tsx
touch ./src/pages/Logout.tsx
touch ./src/pages/Main.tsx

mkdir ./src/routes
touch ./src/routes/routes.tsx

#Устанавливаем библиотеку react-router-dom с помощью команды npm install
npm install --save react-router-dom
```

Затем запускаем проект

{% include codeHeader.html %}
```bash
#Открываем приложение в редакторе кода Visual Studio Code
code .

#Запускаем приложение
npm start
```

Сразу после запуска вы увидите сообщение об ошибке потому, что сейчас в нём есть пустые компоненты. Просто закройте это сообщение в правом верхнем углу и продолжайте.

![assets/images/simple-login-react-app/1.png](/assets/images/simple-login-react-app/1.png)

Для удобства привожу ссылку на те разделы статьи, где рассматривается соответствующий модуль.

* [App.tsx](#App)
* [Navbar.tsx](#Navbar)
* [PrivateRoute.tsx](#PrivateRoute)
* [AuthProvider.tsx](#AuthProvider)
* [useAuth.tsx](#useAuth)
* [index.tsx](#index)
* [Admin.tsx](#Admin)
* [Login.tsx](#Login)
* [Logout.tsx](#Logout)
* [Main.tsx](#Main)
* [Admin.tsx](#Admin)
* [routes.tsx](#routes)

Допустим у нас есть несколько маршрутов. В представленном ниже примере они себя ведут как обычно и тут пока нет никакой авторизации. При входе на сайт нас перенаправляют на компонент Main. Так же сейчас доступны все приведённые маршруты.

```tsx
import { Route, Routes } from 'react-router-dom';
import Login from '../pages/Login';
import Main from '../pages/Main';
import Admin from '../pages/Admin';

export const useRoutes = () => {

  return (
    <Routes>
      <Route path="/" element={<Main />} />
      <Route path="/login" element={<Login />} />
      <Route path="/admin" element={<Admin />} />
    </Routes>
  )
}

export default useRoutes
```

Наша задача, сделать так, чтобы при переходе по маршруту `/admin`, сначала выполнялась проверка - пользователь авторизован или нет. Если да, то предоставлять ему маршрут `/admin`, а если нет, то перенаправлять его на страницу авторизации.

Для этого воспользуемся [вложенными маршрутами](https://reactrouter.com/en/main/start/overview#nested-routes) из библиотеки React Router и хуком [Outlet](https://reactrouter.com/en/main/components/outlet).

Вот как будут выглядеть вложенные маршруты.

<a name="Routes"></a>

## Routes

./src/routes/routes.tsx

{% include codeHeader.html %}
```tsx
import { Route, Routes } from 'react-router-dom';
import { PrivateRoute } from '../components/PrivateRoute';
import Main from '../pages/Main';
import Login from '../pages/Login';
import Admin from '../pages/Admin';
import Logout from '../pages/Logout';

export const useRoutes = () => {

  return (
    <Routes>
      <Route index element={<Main />} />
      <Route path="/" element={<Main />} />
      <Route path="/login" element={<Login />} />
      
      <Route element={<PrivateRoute />}>
        <Route path='/admin' element={<Admin />} />
        <Route path="/logout" element={<Logout />} />
      </Route>

    </Routes>
  )
}

export default useRoutes
```

Хочу отметить, что маршруты я поместил в отдельный кастомный хук `useRoutes`. А затем подключил в компоненте `App`

<a name="App"></a>

## App

./src/App.tsx

{% include codeHeader.html %}
```tsx
import Navbar from './components/Navbar';
import useRoutes from './routes/routes';

const App = () => {
  const routes = useRoutes()

  return (
    <>
      <Navbar />
      {routes}
    </>
  )
};

export default App;
```

Компонент Navbar предельно прост. Думаю, что тут ничего не нуждается в пояснениях.

<a name="Navbar"></a>

## Navbar

./src/components/Navbar.tsx

{% include codeHeader.html %}
```tsx
import { Link } from 'react-router-dom'
import useAuth from '../hooks/useAuth'

function Navbar() {
  const { isAuthenticated } = useAuth()
  return (
    <>
      <h1>Welcome</h1>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/admin">Admin</Link>
        {isAuthenticated ? <Link to="/logout">Logout</Link> : <Link to="/login">Login</Link>}
      </nav>
    </>
  )
}

export default Navbar
```

<a name="PrivateRoute"></a>

## PrivateRoute

Вся магия происходит в компоненте `PrivateRoute`. В нём заложена логика, предоставлять пользователю запрошенный маршрут или перенаправить на страницу авторизации.

Давайте рассмотрим компонент `PrivateRoute` подробнее. Ниже приведено детальное описание кода, а далее рассмотрен хук `useAuth`, который предоставляет информацию о статусе пользователя.

./src/components/PrivateRoute.tsx

{% include codeHeader.html %}
```tsx
// Импортируем необходимые модули из библиотеки react-router-dom и пользовательский хук useAuth
import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";

// Определяем функциональный компонент PrivateRoute
export const PrivateRoute = () => {

  // Получаем значение isAuthenticated из пользовательского хука useAuth
  const { isAuthenticated } = useAuth()

  // Получаем текущий маршрут из хука useLocation
  const location = useLocation()

  // Возвращаем условный оператор для рендеринга компонентов на основе состояния isAuthenticated
  return (
    // Если пользователь авторизован, то рендерим дочерние элементы текущего маршрута, используя компонент Outlet
    isAuthenticated === true ?
      <Outlet />
      // Если пользователь не авторизован, то перенаправляем его на маршрут /login с помощью компонента Navigate.
      // Свойство replace указывает, что текущий маршрут будет заменен на новый, чтобы пользователь не мог вернуться обратно, используя кнопку "назад" в браузере.
      :
      <Navigate to="/login" state={% raw %}{{ from: location }}{% endraw %} replace />
  )
};
```

Этот код экспортирует компонент `PrivateRoute`, который использует `React Router` для предоставления маршрута только аутентифицированным пользователям.

Компонент использует два хука из библиотеки react-router-dom. Первый хук, `Outlet`, используется для рендеринга вложенных маршрутов внутри компонента. Второй хук, `useLocation`, используется для получения текущего URL.

> Подробнее о хуке Outlet можно [почитать](https://reactrouter.com/en/main/components/outlet) в официальной документации React Router.

Компонент также использует кастомный хук `useAuth`, который возвращает объект, содержащий информацию об аутентификации пользователя.

Если `isAuthenticated` равно `true`, компонент `PrivateRoute` отображает `<Outlet />`, то есть вложенные маршруты. Если `isAuthenticated` равно `false`, компонент перенаправляет пользователя на страницу входа, используя компонент `<Navigate />`. 

***

```js
      <Navigate to="/login" state={% raw %}{{from: location}}{% endraw %} replace />
```

Посмтрите на строку выше. Хочу отметить, что код `state={% raw %}{{from: location}}{% endraw %} replace` не имеет прямого отношения к авторизации и вы можете пока не обращать на него внимание.

Эта часть кода используется для установки нового состояния и перенаправления пользователя на другую страницу приложения с помощью компонента `<Navigate>` из библиотеки react-router-dom.

Свойство `state` передает объект с данными, которые можно передать на другую страницу вместе с запросом перенаправления. В данном случае, объект ***{from: location}*** содержит информацию о том, откуда пользователь был перенаправлен, и передает эту информацию на страницу `/login`.

Свойство `replace` используется для замены текущей страницы в истории браузера на страницу перенаправления, вместо добавления новой страницы в историю. Это означает, что пользователь не сможет вернуться к предыдущей странице, используя кнопку "назад" в браузере.

***

Таким образом, компонент `PrivateRoute` используется для ограничения доступа к защищенным маршрутам только для авторизованных пользователей, перенаправляя пользователей на страницу входа, если они не авторизованы.

```tsx
...
const { isAuthenticated } = useAuth()
...
    isAuthenticated === true ?
```

Как видно, всё, что делает этот компонент - это получает результат из хука `useAuth` и решает предоставлять запрошенный маршрут  или перенаправить на страницу `/login` для ввода логина/пароля.

<a name="useAuth"></a>

## useAuth 

Хук `useAuth` тоже предельно простой. Его единственная задача сначала импортировать, а потом экспортировать контекст.

./src/hooks/useAuth.tsx

{% include codeHeader.html %}
```tsx
import { useContext } from "react"
import AuthContext from "../context/AuthProvider"

function useAuth() {
  return (
    useContext(AuthContext)
  )
}

export default useAuth
```

Этот код экспортирует кастомный хук `useAuth`, который использует хук `useContext` из библиотеки `react` для получения объекта контекста `AuthContext`, созданного ранее в файле `AuthProvider.js` (см. ниже).

Когда `useAuth` вызывается внутри функционального компонента, он возвращает значение контекста `AuthContext`, которое было передано в компонент-провайдер `AuthProvider`. После этого, объект контекста может быть использован в компоненте, который вызвал useAuth.

<a name="AuthProvider"></a>

## AuthProvider

Создаём контекст тоже самым примитивным образом.

./src/context/AuthProvider.tsx

{% include codeHeader.html %}
```tsx
import { createContext, useState } from "react";

// Определяем тип контекста
type AuthContextType = {
  isAuthenticated: boolean; // флаг, показывающий, аутентифицирован ли пользователь
  setAuth: (auth: boolean) => void; // функция для изменения значения isAuthenticated
};

// Создаем контекст с типом AuthContextType и начальными значениями по умолчанию
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  setAuth: () => { },
});

// Создаем компонент провайдера, который предоставляет данные контекста всем дочерним компонентам
export const AuthProvider = ({ children }: { children: JSX.Element }) => {
  // Используем хук useState для создания переменной isAuthenticated и функции setAuth для ее изменения
  const [isAuthenticated, setAuth] = useState<boolean>(false);
  
  // Возвращаем контекст провайдера, передавая значения isAuthenticated и setAuth в качестве значения контекста
  return (
    <AuthContext.Provider value={% raw %}{{ isAuthenticated, setAuth }}{% endraw %}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

```

Этот код экспортирует объект контекста `AuthContext`, созданный с помощью `createContext` из библиотеки `react`. Контекст создается для того, тобы разные компоненты приложения имели к нему доступ и могли считывать инорфмацию о статусе авторизации пользователя и/или изменять её.

В нашем примере, определен тип `AuthContextType` с двумя свойствами: `isAuthenticated` - логическое значение, указывающее, аутентифицирован ли пользователь, и setAuth - функция, принимающая логический аргумент и устанавливающая значение `isAuthenticated`.

В компоненте `AuthProvider`, используется хук `useState` для создания состояния `isAuthenticated` и `setAuth`, которые инициализируются значением `false`. Затем, компонент-провайдер `<AuthContext.Provider>` оборачивает дочерние элементы приложения и передает в контекст объект `AuthContextType`, содержащий текущее значение `isAuthenticated` и функцию `setAuth`, которую можно использовать для установки значения `isAuthenticated` из дочерних компонентов.

Наконец, экспортируется сам объект `AuthContext`. Это позволяет другим компонентам использовать данные, хранящиеся в контексте `AuthContext`, с помощью хука `useContext`.

> Если вы ранее не работали с контекстом, то возможно этот [простеший пример](https://gist.github.com/mdanshin/a32560926c69d06b33d427534abbf225) вам поможет понять суть.

И в конце, не забываем обернуть наше приложение в созданный контекст.

<a name="index"></a>

## index

./src/index.tsx

{% include codeHeader.html %}
```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider';
import App from './App';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <Router>
      <AuthProvider>
        <App />
      </AuthProvider>
    </Router>
  </React.StrictMode>
);
```

Работа оставшейся части приложения сводится к тому, чтобы изменять значение переменной `isAuthenticated` в нужный момент. По умолчанию значение `isAuthenticated` равняется `false`. И мы не сможем попасть по запрошенному нами маршруту, т.к. в компоненте `PrivateRoute` имеется тернальный оператор, `isAuthenticated === true ? <Outlet /> : <Navigate to="/login" replace />` который перенаправит наш вызов на страницу `Login`, пока значение переменной будет `false`. Таким образом нам осталось только сделать страницу `Login`, вызвать там API нашего back-end-а или любым другим способом убедиться, что пользователь ввёл правильные имя и пароль и поменять значение `isAuthenticated` на `true` путём вызова метода setAuth.

<a name="Login"></a>

## Login

./src/pages/Login.tsx

{% include codeHeader.html %}
```tsx
import useAuth from '../hooks/useAuth';
import { useLocation, useNavigate } from 'react-router-dom';

const Login = () => {
  const { setAuth } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'

  return (
    <>
      <div>Login</div>
      <button type={'button'} onClick={() => {
        setAuth(true)
        navigate(from, { replace: true });
      }}>Login</button>
    </>
  )
}

export default Login
```

Это самая простая форма, чтобы не перегружать статью. Тут всего одна кнопка, которая по нажатию меняет состояние переменной `isAuthenticated` через функцию `setAuth()`. Конечно, в реально работе этот компонент будет сложнее. Нам понадобятся инпуты для ввода логина/пароля, валидация, вызов API, обработчик ответа, вывод сообщений об ошибках. Но в учебном примере всем этим можно пренебречь для простоты изложения. Тем более, что суть от этого совершенно не меняется. Всё сводится к установке значения переменной.

И в заключении реализуем недостающие компоненты Logout, Main и Admin

<a name="Logout"></a>

## Logout

./src/pages/Logout.tsx

{% include codeHeader.html %}
```tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

function Logout() {
  const { setAuth } = useAuth()
  const navigate = useNavigate();
  
  useEffect(() => {
    setAuth(false)
    navigate('/');
  }, [setAuth, navigate])

  return (
    <div>Logout</div>
  )
}

export default Logout
```

<a name="Main"></a>

## Main

./src/pages/Main.tsx

{% include codeHeader.html %}
```tsx
const Main = () => {
  return (
    <h1>Main</h1>
  )
}

export default Main
```

<a name="Admin"></a>

## Admin

./src/pages/Admin.tsx

{% include codeHeader.html %}
```tsx
const Admin = () => {
  return (
    <h1>Admin</h1>
  )
}

export default Admin
```

Приведённый выше пример приложения - это самый примитивный вариант. Здесь значение переменной `isAuthenticated` задаётся нажатием на кнопку и вызывом метода `setAuth(true)`. Но ничто не мешает вам применить более сложную логику. Например при нажатии на кнопку, вы можете вызывать API, передавать логин/пароль и получать ответ. И в зависимости от ответа устанавливать значение переменной в `true` или `false`

Сколько бы сложную реализацию аутентификации вы не делали, в основе будет лежать примерно такой принцип:

1. Защита маршрута путём проверки разрешено пользователю получить доступ к странице или нет. Критерием для доступа может служить текущее значение переменной, наличие токена доступа, наличие определённой роли что-то ещё или всё сразу.

2. Перенаправление на страницу авторизации

3. Получение подтверждения, что пользователь ввёл правильные логин/пароль

4. Перенаправление на запрошенную страницу

Одним из примеров реализации, может быть запрос JWT-токена доступа в ответ на ввод логина и пароля. Затем мы можем сохранить токен в localStorage и проверять его наличие каждый раз, при запросе защищённой страницы. Если токен имеется, то отправлять его на проверку и если проверка будет пройдена, то считать пользователя аутентифицированным.

> О том, что такое JWT я писал в своей статье [JWT - коротко о главном](https://danshin.ms/jwt-quick-start/).

Другой, более правильный пример реализации, использование пары Refresh и Access токенов. Когда пользователь первый раз получает пару AccessToken/RefreshToken, то RefreshToken сохраняется как в базе данных на стороне сервера, вместе с id пользователя или другим уникальным идентификатором, так и на стороне клиента(пользователя). Как правило это HttpOnly-Cookie, которая хранится в браузере. Если после отправки AccessToken клиент получает ошибку 401 (Unauthorized Error), он отправляет RefreshToken на обновление токенов (/api/refresh) и после валидации RefreshToken сервер предоставляет новую пару AccessToken/RefreshToken. Клиент их принимает и заново отправляет AccessToken. Если на этот раз валидация прошла успешно, то сервер предоставляет доступ к запрашиваемому ресурсу.

Если же и RefreshToken не прошёл проверку, то пользователя просят заново пройти процесс аутентификации - ввести логин/пароль и заново получить пару AccessToken/RefreshToken.

> Обратите внимание, что данная схема не предполагает хранение AccessToken-а. Он как одноразовый пароль - получили, ввели и забыли. Нужно сказать, что время жизни AccessToken-а нужно устанавливать всегда маленькое, несколько секунд. А вот время RefreshToken-а должно быть такое, чтобы, с одной стороны, не надоедать пользователю частым вводом логина/пароля, с другой, не хранить его долго потому, что он может быть украден или скомпрометирован. Например, RefreshToken можно хранить 30 дней.

Буду рад обсудить с вами данную статью в своей Телеграм группе. Присоединяйтесь - [https://t.me/danshin_ms](https://t.me/danshin_ms).

P.S.
Посмотрите мой проект формы [Login](https://danshin.ms/dms-login-page-autumn/). Ссылка на [GitHub](https://github.com/mdanshin/dms-login-page-autumn). Форма сделана с использованием HTML и CSS. 

![assets/images/simple-login-react-app/2.png](/assets/images/simple-login-react-app/2.png)

В будущем я её переделаю под React и включу в этот проект по авторизации.
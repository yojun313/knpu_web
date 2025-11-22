# KNPU_WEB

## Homepage

- URL: [https://knpu.re.kr](https://knpu.re.kr)
- Architecture
    
    ```
    Homepage
    ├── app
    │   └── public
    │       └── assets
    │           ├── img
    │           │   └── team    
    │           └── video
    ├── admin.py
    ├── app
    │   ├── package-lock.json
    │   ├── package.json
    │   ├── public
    │   │   ├── assets
    │   │   │   ├── .DS_Store
    │   │   │   └── img
    │   │   │       ├── portfolio
    │   │   │       └── team
    │   │   │           └── default.jpg
    │   │   ├── css
    │   │   │   └── styles.css
    │   │   ├── homepage.html
    │   │   ├── js
    │   │   │   └── scripts.js
    │   │   ├── kemkim_manual.html
    │   │   ├── manager.html
    │   │   ├── manager_download.html
    │   │   ├── publications.html
    │   │   ├── team.html
    │   │   └── tool.html
    │   └── server.js
    ├── server
    │   ├── app
    │   │   ├── __init__.py
    │   │   ├── config.py
    │   │   ├── db
    │   │   │   ├── __init__.py
    │   │   │   └── papers.json
    │   │   ├── libs
    │   │   │   ├── jwt.py
    │   │   │   └── upload_image.py
    │   │   ├── main.py
    │   │   ├── models.py
    │   │   └── routes
    │   │       ├── __init__.py
    │   │       ├── edit_routes.py
    │   │       ├── image_routes.py
    │   │       ├── member_routes.py
    │   │       ├── news_routes.py
    │   │       └── paper_routes.py
    │   └── run.py
    └── setup.sh
    ```
    

## Crawler

- URL: [https://crawler.knpu.re.kr](https://crawler.knpu.re.kr)
- Architecture
    
    ```
    crawler
    ├── crawler_worker.js
    ├── package-lock.json
    ├── package.json
    ├── public
    │   ├── crawl_add.html
    │   └── crawl_dashboard.html
    └── server.js
    ```
    

## Dashboard

- URL: [https://dashboard.knpu.re.kr](https://dashboard.knpu.re.kr)
- Architecture
    
    ```
    dashboard
    ├── .gitignore
    ├── app
    │   ├── api
    │   │   ├── auth
    │   │   │   ├── .DS_Store
    │   │   │   ├── login
    │   │   │   │   └── route.ts
    │   │   │   └── logout
    │   │   │       └── route.ts
    │   │   ├── bugs
    │   │   │   ├── [id]
    │   │   │   │   └── route.ts
    │   │   │   └── route.ts
    │   │   ├── crawler
    │   │   │   └── route.ts
    │   │   ├── log
    │   │   │   ├── route.ts
    │   │   │   └── today
    │   │   │       └── route.ts
    │   │   ├── stats
    │   │   │   └── route.ts
    │   │   └── users
    │   │       ├── .DS_Store
    │   │       ├── [uid]
    │   │       │   └── route.ts
    │   │       ├── list
    │   │       │   └── route.ts
    │   │       └── route.ts
    │   ├── dashboard
    │   │   ├── bugs
    │   │   │   ├── loading.tsx
    │   │   │   └── page.tsx
    │   │   ├── crawler
    │   │   │   ├── loading.tsx
    │   │   │   └── page.tsx
    │   │   ├── layout.tsx
    │   │   ├── log
    │   │   │   ├── loading.tsx
    │   │   │   └── page.tsx
    │   │   ├── page.tsx
    │   │   └── users
    │   │       ├── loading.tsx
    │   │       └── page.tsx
    │   ├── globals.css
    │   ├── layout.tsx
    │   ├── login
    │   │   └── page.tsx
    │   └── page.tsx
    ├── components
    │   ├── bug-detail-dialog.tsx
    │   ├── dashboard-layout.tsx
    │   ├── stat-card.tsx
    │   ├── theme-provider.tsx
    │   ├── ui
    │   │   ├── accordion.tsx
    │   │   ├── alert-dialog.tsx
    │   │   ├── alert.tsx
    │   │   ├── aspect-ratio.tsx
    │   │   ├── avatar.tsx
    │   │   ├── badge.tsx
    │   │   ├── breadcrumb.tsx
    │   │   ├── button-group.tsx
    │   │   ├── button.tsx
    │   │   ├── calendar.tsx
    │   │   ├── card.tsx
    │   │   ├── carousel.tsx
    │   │   ├── chart.tsx
    │   │   ├── checkbox.tsx
    │   │   ├── collapsible.tsx
    │   │   ├── command.tsx
    │   │   ├── context-menu.tsx
    │   │   ├── dialog.tsx
    │   │   ├── drawer.tsx
    │   │   ├── dropdown-menu.tsx
    │   │   ├── empty.tsx
    │   │   ├── field.tsx
    │   │   ├── form.tsx
    │   │   ├── hover-card.tsx
    │   │   ├── input-group.tsx
    │   │   ├── input-otp.tsx
    │   │   ├── input.tsx
    │   │   ├── item.tsx
    │   │   ├── kbd.tsx
    │   │   ├── label.tsx
    │   │   ├── menubar.tsx
    │   │   ├── navigation-menu.tsx
    │   │   ├── pagination.tsx
    │   │   ├── popover.tsx
    │   │   ├── progress.tsx
    │   │   ├── radio-group.tsx
    │   │   ├── resizable.tsx
    │   │   ├── scroll-area.tsx
    │   │   ├── select.tsx
    │   │   ├── separator.tsx
    │   │   ├── sheet.tsx
    │   │   ├── sidebar.tsx
    │   │   ├── skeleton.tsx
    │   │   ├── slider.tsx
    │   │   ├── sonner.tsx
    │   │   ├── spinner.tsx
    │   │   ├── switch.tsx
    │   │   ├── table.tsx
    │   │   ├── tabs.tsx
    │   │   ├── textarea.tsx
    │   │   ├── toast.tsx
    │   │   ├── toaster.tsx
    │   │   ├── toggle-group.tsx
    │   │   ├── toggle.tsx
    │   │   ├── tooltip.tsx
    │   │   ├── use-mobile.tsx
    │   │   └── use-toast.ts
    │   └── user-detail-dialog.tsx
    ├── components.json
    ├── hooks
    │   ├── use-mobile.ts
    │   └── use-toast.ts
    ├── lib
    │   ├── auth.ts
    │   ├── mongodb.ts
    │   ├── types.ts
    │   └── utils.ts
    ├── middleware.ts
    ├── next.config.mjs
    ├── package-lock.json
    ├── package.json
    ├── pnpm-lock.yaml
    ├── postcss.config.mjs
    ├── public
    │   ├── placeholder-logo.png
    │   ├── placeholder-logo.svg
    │   ├── placeholder-user.jpg
    │   ├── placeholder.jpg
    │   └── placeholder.svg
    ├── styles
    │   └── globals.css
    └── tsconfig.json
    ```
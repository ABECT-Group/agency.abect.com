# Git workflow: гілки, коміти, pull request

Як працюють над репозиторієм **https://github.com/ABECT-Group/agency.abect.com** власник і розробник (зокрема разом із Claude).

## 1. Ролі

| | Власник проекту | Розробник |
|---|---|---|
| Доступ до репозиторію | Admin | Collaborator з правом **Write** |
| Де працює | рев'ю й мердж PR | **лише у своїх гілках** |
| Коміти в `main` | за потреби — напряму (власник у *Bypass list* ruleset) | ❌ ніколи (GitHub не дозволить) |
| Відкриває PR | за потреби | ✅ на кожну задачу |
| Мерджить PR у `main` | ✅ тільки він | ❌ |
| Деплой на VPS | ✅ тільки він, тільки з `main` | ❌ |
| Секрети (`.env.*` на сервері), `scripts/`, `mongodb/` | ✅ | ❌ немає доступу й не потрібно |

**`main` = те, що на проді.** У `main` потрапляє лише перевірений і змерджений власником код.

## 2. Назви гілок

Одна задача — одна гілка, завжди від свіжого `main`. Латиниця, kebab-case:

| Префікс | Для чого | Приклад |
|---|---|---|
| `feature/` | нова функціональність | `feature/blog-search` |
| `fix/` | виправлення бага | `fix/calculator-price-rounding` |
| `docs/` | лише документація | `docs/update-api` |
| `chore/` | залежності, конфіги, рефакторинг без зміни поведінки | `chore/update-payload` |

## 3. Робочий цикл розробника

### 3.1 Перший раз

```bash
git clone https://github.com/ABECT-Group/agency.abect.com.git
cd agency.abect.com
npm install
cp .env.example .env        # свої DATABASE_URI (Atlas або локальний Mongo) і PAYLOAD_SECRET
npm run dev                 # http://localhost:3000, адмінка /admin
```

Продакшн-база й секрети розробнику не потрібні: для розробки — власна MongoDB (Atlas free tier або локальна).

### 3.2 Нова задача

```bash
git switch main
git pull --ff-only
git switch -c feature/<коротка-назва>
```

### 3.3 Робота й коміти

- Комітити невеликими логічними кроками.
- Формат повідомлення — [Conventional Commits](https://www.conventionalcommits.org/): `тип: що зроблено` (українською або англійською).
  ```
  feat: пошук по блогу
  fix: округлення ціни в калькуляторі
  docs: оновлено api.md
  chore: оновлено payload до 3.94
  ```
- Не комітити: `.env*`, `media/`, `.next/`, `node_modules/` (вони в `.gitignore` — не обходити).
- `git add <файли>` або `git add -p`, а не наосліп `git add .`, — щоб не захопити зайве.

### 3.4 Перед pull request

```bash
git fetch origin
git merge origin/main           # підтягнути свіжий main у свою гілку, розв'язати конфлікти
npm run typecheck
npm run lint                    # 0 помилок і 0 попереджень
npm run build                   # якщо зачеплені сторінки, конфіги, залежності
```

І оновити документацію за [`../CLAUDE.md`](../CLAUDE.md) (крок 5): запис у `docs/changelogs/YYYY-MM-DD.md` (з назвою гілки), короткий опис дня в індексі `changelog.md`, `docs/issues/*`.

> Уже запушені гілки **не ребейзимо** й не робимо `push --force` — лише `merge origin/main`. Так історія PR не ламається.

### 3.5 Пуш і pull request

```bash
git push -u origin feature/<коротка-назва>
gh pr create --base main --title "feat: пошук по блогу"     # опис — за шаблоном
```

Без `gh`: відкрити `https://github.com/ABECT-Group/agency.abect.com/compare/main...feature/<коротка-назва>` → **Create pull request**.

Опис PR заповнюється за шаблоном (`.github/pull_request_template.md`): що зроблено, як перевірено, чи потрібні дії при деплої (нові env-змінні, міграції, зміни nginx тощо).

### 3.6 Після рев'ю

- Зауваження власника виправляються **новими комітами в ту саму гілку** → `git push`. PR оновлюється сам.
- Після мерджу:
  ```bash
  git switch main
  git pull --ff-only
  git branch -d feature/<коротка-назва>
  ```
  Гілку на GitHub видаляє власник при мерджі (або автоматично, див. 4.1).

### 3.7 Конфлікти в документації

Найчастіше конфліктують `docs/changelogs/*.md` і `docs/issues/current.md`. Правило: **зберегти обидва записи**. У ченджлозі — новіші зверху; номери `ISS-XXX`, якщо збіглися, — перенумерувати свої на наступні вільні.

## 4. Власник

### 4.1 Одноразове налаштування GitHub

1. **Додати розробника:** репозиторій → *Settings* → *Collaborators and teams* → *Add people* → роль **Write**.
2. **Захистити `main`:** *Settings* → *Rules* → *Rulesets* → *New branch ruleset*:
   - Target: `main` (Default branch);
   - ✅ *Restrict deletions*, ✅ *Block force pushes*;
   - ✅ *Require a pull request before merging* (Required approvals — 1, якщо рев'ю обов'язкове для всіх; для власника можна додати себе в *Bypass list*);
   - *Enforcement status*: **Active**.
   Після цього навіть із правом Write напряму запушити в `main` неможливо.
3. *Settings* → *General* → *Pull Requests*: увімкнути **Allow squash merging** і **Automatically delete head branches**.

### 4.2 Рев'ю PR

Чекліст:
- [ ] Зміна відповідає задачі, нічого зайвого (особливо `package-lock.json`, `access`, `next.config.mjs`, `Dockerfile`).
- [ ] Немає секретів, `.env`, великих бінарників.
- [ ] Оновлені `docs/changelogs/*` і, за потреби, `docs/issues/*`, `docs/*.md`.
- [ ] У PR описано, як перевірено, і чи треба щось робити при деплої.
- [ ] За бажанням — локально: `gh pr checkout <номер>` → `npm ci && npm run typecheck && npm run lint && npm run build`.

### 4.3 Мердж і деплой

- Мердж: **Squash and merge** (одна задача = один коміт у `main`, заголовок — назва PR).
- Деплой після мерджу: `/home/admin/www/abect/scripts/restart.sh` на VPS (див. [deployment.md](deployment.md)). Деплоїться завжди `main`.

## 5. Робота з Claude

Розробник працює з Claude Code у цьому репозиторії. Claude читає [`../CLAUDE.md`](../CLAUDE.md) і зобов'язаний:

1. **На старті кожної сесії спитати, в якій гілці працюємо**, і перемкнутися на неї (або створити нову від `main`). Без цього — жодних дій із кодом.
2. Ніколи не працювати й не комітити в `main`.
3. Комітити, пушити й відкривати PR лише на прохання розробника; ніколи не мерджити PR.
4. Не робити `push --force`, `reset --hard`, rebase запушених гілок без прямого прохання.
5. Вести ченджлог і issues за правилами `CLAUDE.md`.

Підказка розробнику для старту сесії: «Працюємо в гілці `feature/…`, задача — …».

# Git workflow: гілки, коміти, превʼю

Як працюють над репозиторієм **https://github.com/ABECT-Group/agency.abect.com** власник і розробник (зокрема разом із Claude).

**Коротко:** розробник робить гілку під задачу → комітить і пушить її → Vercel сам викладає превʼю гілки → власник дивиться превʼю й сам зливає гілку в `main` → деплой `main` на VPS.
**Pull request не потрібні.**

```
feature/задача  ──push──►  превʼю на Vercel (автоматично)
                                  │  власник перевіряє
                                  ▼
                               main  ──►  деплой на VPS (прод)
```

## 1. Ролі

| | Власник проекту | Розробник |
|---|---|---|
| Доступ до репозиторію | Admin | Collaborator з правом **Write** |
| Де працює | `main` | **лише у своїх гілках** |
| Пушить у `main` | ✅ тільки він (злиття гілок розробника) | ❌ ніколи |
| Перевіряє зміни | ✅ на превʼю Vercel і в коді гілки | — |
| Деплой на VPS | ✅ тільки він, тільки з `main` | ❌ |
| Секрети (`.env.*` на сервері), `scripts/`, `mongodb/` | ✅ | ❌ немає доступу й не потрібно |

**`main` = те, що на проді.** У `main` потрапляє лише перевірений власником код.

## 2. Назви гілок

Одна задача — одна гілка, завжди від свіжого `main`. Латиниця, kebab-case:

| Префікс | Для чого | Приклад |
|---|---|---|
| `feature/` | нова функціональність | `feature/blog-search` |
| `fix/` | виправлення бага | `fix/calculator-price-rounding` |
| `docs/` | лише документація | `docs/update-api` |
| `chore/` | залежності, конфіги, рефакторинг без зміни поведінки | `chore/update-payload` |

Назва гілки потрапляє в адресу превʼю на Vercel, тому коротка й зрозуміла назва — зручніше.

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

### 3.4 Перед тим як сказати «готово»

```bash
git fetch origin
git merge origin/main           # підтягнути свіжий main у свою гілку, розв'язати конфлікти
npm run typecheck
npm run lint                    # 0 помилок і 0 попереджень
npm run build                   # якщо зачеплені сторінки, конфіги, залежності
```

І оновити документацію за [`../CLAUDE.md`](../CLAUDE.md) (крок 5): запис у `docs/changelogs/YYYY-MM-DD.md` (з назвою гілки), короткий опис дня в індексі `changelog.md`, `docs/issues/*`.

> Уже запушені гілки **не ребейзимо** й не робимо `push --force` — лише `merge origin/main`.

### 3.5 Пуш — і все

```bash
git push -u origin feature/<коротка-назва>      # перший раз
git push                                        # наступні рази
```

Після пушу **Vercel автоматично збирає превʼю гілки** (1–3 хвилини). Pull request відкривати не потрібно.

Повідомити власника: назва гілки + посилання на превʼю + що зроблено й чи потрібні дії при деплої (нові env-змінні, зміни nginx тощо).

### 3.6 Після перевірки

- Зауваження власника виправляються **новими комітами в ту саму гілку** → `git push` (превʼю оновиться само).
- Коли власник злив гілку в `main`:
  ```bash
  git switch main
  git pull --ff-only
  git branch -d feature/<коротка-назва>
  ```

### 3.7 Конфлікти в документації

Найчастіше конфліктують `docs/changelogs/*.md` і `docs/issues/current.md`. Правило: **зберегти обидва записи**. У ченджлозі — новіші зверху; номери `ISS-XXX`, якщо збіглися, — перенумерувати свої на наступні вільні.

## 4. Превʼю на Vercel

Репозиторій підключено до Vercel. Він сам викладає **кожен пуш у кожну гілку, крім `main`**:

- `main` на Vercel не деплоїться — це заборонено у [`../vercel.json`](../vercel.json) (`git.deploymentEnabled.main: false`). Прод — лише VPS.
- У кожної гілки є **постійна адреса**, яка завжди показує її останній коміт:
  `https://<проект>-git-<назва-гілки>-<команда>.vercel.app` (`/` у назві гілки стає `-`).
- Посилання видно у Vercel → *Deployments* і на GitHub біля коміту (статус ✓ → *Details*).
- Превʼю працює на **тестовій базі** (змінні середовища Vercel для *Preview*), не на продакшн-даних.
- **Превʼю не індексується.** На Vercel `APP_ENV` автоматично `preview` (навіть якщо змінну не задано): `robots.txt` → `Disallow: /`, порожній `sitemap.xml`, заголовок `X-Robots-Tag: noindex, nofollow` на всіх сторінках (`src/utils/env.ts`, `next.config.mjs`).
- **Заявки з превʼю** йдуть у Telegram з позначкою «🧪 ТЕСТОВЕ СЕРЕДОВИЩЕ», назвою гілки й посиланням на превʼю. Щоб вони не потрапляли в робочий чат, у Vercel можна вказати окремий тестовий `TELEGRAM_CHAT_ID` / `TELEGRAM_THREAD_ID` (або не задавати `TELEGRAM_*` зовсім — тоді заявки лише зберігаються в тестовій базі).
- Завантажені на превʼю в адмінку файли не зберігаються (на Vercel немає постійного диска).
- Деплой `main`, який Vercel робить **одноразово при імпорті проекту**, `vercel.json` не скасовує — його можна видалити в *Deployments*. Наступні пуші в `main` Vercel уже пропускає.
- На Vercel сайт бере дані з CMS за адресою самого деплою (`VERCEL_URL`), а не `127.0.0.1` (`src/client/lib/payload-fetch.ts`). Якщо превʼю закриті *Deployment Protection*, потрібен секрет обходу — див. 5.1, п. 3.

## 5. Власник

### 5.1 Одноразове налаштування

1. **GitHub — додати розробника:** репозиторій → *Settings* → *Collaborators and teams* → *Add people* → роль **Write**.
2. **GitHub — захистити `main`:** *Settings* → *Rules* → *Rulesets* → *New branch ruleset*:
   - Target: `main` (Default branch);
   - ✅ *Restrict updates* (пушити в `main` може лише той, хто в *Bypass list*) — додати себе в *Bypass list*;
   - ✅ *Restrict deletions*, ✅ *Block force pushes*;
   - **не** вмикати *Require a pull request before merging*;
   - *Enforcement status*: **Active**.
3. **Vercel:**
   - *Add New → Project* → імпортувати `ABECT-Group/agency.abect.com` (за потреби дати Vercel GitHub App доступ до організації).
   - *Settings → Environment Variables* для **Preview**:
     | Змінна | Значення |
     |---|---|
     | `DATABASE_URI` | тестова MongoDB Atlas (*Network Access* `0.0.0.0/0`), **не** продакшн |
     | `PAYLOAD_SECRET` | власний випадковий рядок, **не** такий, як на проді |
     | `APP_ENV` | `preview` (необовʼязково — на Vercel це значення за замовчуванням) |
     | `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `TELEGRAM_THREAD_ID` | за бажанням — бажано тестовий чат/гілку; заявки прийдуть з позначкою «ТЕСТОВЕ СЕРЕДОВИЩЕ» |
   - `NEXT_PUBLIC_SERVER_URL` на Vercel **не задавати** (адреса превʼю щоразу інша; сайт визначає її сам).
   - *Settings → Deployment Protection* → **Protection Bypass for Automation** → *Add secret* (створює `VERCEL_AUTOMATION_BYPASS_SECRET`). Без цього захищене превʼю не може читати дані з самого себе й показує «Помилка сервера». Альтернатива — вимкнути *Vercel Authentication* для Preview (тоді превʼю відкриті всім, хто має посилання).
   - Після зміни змінних — *Redeploy* потрібного деплою.

### 5.2 Перевірка гілки

- [ ] Превʼю на Vercel відкривається, зміни виглядають як треба (десктоп і мобільний, UA і EN).
- [ ] Зміна відповідає задачі, нічого зайвого (особливо `package-lock.json`, `access`, `next.config.mjs`, `Dockerfile`):
  ```bash
  git fetch origin
  git log --oneline main..origin/feature/<гілка>
  git diff main...origin/feature/<гілка> --stat
  ```
- [ ] Немає секретів, `.env`, великих бінарників.
- [ ] Оновлені `docs/changelogs/*` і, за потреби, `docs/issues/*`, `docs/*.md`.
- [ ] За бажанням — локально: `git switch feature/<гілка>` → `npm ci && npm run typecheck && npm run lint && npm run build`.

### 5.3 Злиття в `main` і деплой

```bash
git switch main
git pull --ff-only
git fetch origin
git merge origin/feature/<гілка>      # якщо гілка від свіжого main — це fast-forward
git push
```

Далі — реліз: на VPS запустити `scripts/restart-frontend.sh` у теці проекту (див. [deployment.md](deployment.md#регулярний-реліз)). Окремої гілки `prod` немає: **що в `main`, те й на проді**, тому в `main` зливати лише перевірене. Гілку після злиття можна видалити: `git push origin --delete feature/<гілка>`.

## 6. Робота з Claude

Розробник працює з Claude Code у цьому репозиторії. Claude читає [`../CLAUDE.md`](../CLAUDE.md) і зобов'язаний:

1. **На старті кожної сесії спитати, в якій гілці працюємо**, і перемкнутися на неї (або створити нову від `main`). Без цього — жодних дій із кодом.
2. Ніколи не працювати й не комітити в `main` (виняток — пряме прохання власника).
3. Комітити й пушити лише на прохання розробника. Pull request не створювати.
4. Не робити `push --force`, `reset --hard`, rebase запушених гілок без прямого прохання.
5. Вести ченджлог і issues за правилами `CLAUDE.md`.

Підказка розробнику для старту сесії: «Працюємо в гілці `feature/…`, задача — …».

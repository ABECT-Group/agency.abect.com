import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import './PrivacyPolicy.scss';
import { SITE_URL } from '@/client/config/site';

type Params = { params: Promise<{ locale: string }> };

// Нічого не пререндеримо на білді: у Docker-білді немає БД, і сторінки «застигали» б порожніми.
// Кожна сторінка рендериться при першому запиті й кешується до revalidateTag('all') (ISS-022).
export function generateStaticParams() {
	return [];
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale } = await params;
  const isUa = locale === 'ua';
  const title = isUa ? 'Політика конфіденційності | ABECT' : 'Privacy Policy | ABECT';
  const description = isUa
    ? 'Політика конфіденційності веб-студії ABECT. Які дані ми збираємо, як їх використовуємо та зберігаємо.'
    : 'Privacy Policy of ABECT web studio. What data we collect, how we use and store it.';
  const fullUrl = isUa ? `${SITE_URL}/privacy-policy` : `${SITE_URL}/en/privacy-policy`;

  return {
    title,
    description,
    robots: { index: true, follow: true },
    alternates: {
      canonical: fullUrl,
      languages: {
        'uk-UA': `${SITE_URL}/privacy-policy`,
        'en-US': `${SITE_URL}/en/privacy-policy`,
        'x-default': `${SITE_URL}/en/privacy-policy`,
      },
    },
    openGraph: {
      title,
      description,
      url: fullUrl,
      siteName: 'ABECT',
      locale: isUa ? 'uk_UA' : 'en_US',
      type: 'website',
    },
  };
}

export default async function PrivacyPolicyPage({ params }: Params) {
  const { locale } = await params;
  setRequestLocale(locale);
  const isUa = locale === 'ua';

  return (
    <main className="privacy-policy">
      <div className="container">
        <article className="privacy-policy__content">
          {isUa ? <ContentUA /> : <ContentEN />}
        </article>
      </div>
    </main>
  );
}

function ContentUA() {
  const updated = '18 квітня 2026';
  return (
    <>
      <h1>Політика конфіденційності</h1>
      <p className="privacy-policy__updated">Останнє оновлення: {updated}</p>

      <section>
        <h2>1. Хто ми</h2>
        <p>
          ABECT — українська веб-студія. Адреса електронної пошти:{' '}
          <a href="mailto:support@agency.abect.com">support@agency.abect.com</a>. Ми є контролером персональних
          даних, які ви надаєте через наш сайт.
        </p>
      </section>

      <section>
        <h2>2. Які дані ми збираємо</h2>
        <p>Ми збираємо дані виключно через форми зворотного зв&apos;язку на сайті:</p>
        <ul>
          <li><strong>Контактна форма:</strong> ім&apos;я, телефон або email, повідомлення (опціонально).</li>
          <li>
            <strong>Калькулятор вартості:</strong> ім&apos;я, телефон або email, повідомлення, а також
            вибрані параметри проекту (тип сайту, платформа, кількість сторінок, додаткові послуги,
            терміни). Ці дані допомагають нам підготувати точну пропозицію.
          </li>
        </ul>
        <p>Ми не збираємо платіжних даних, паролів та іншої чутливої інформації.</p>
      </section>

      <section>
        <h2>3. Мета збору даних</h2>
        <p>Дані збираються виключно для:</p>
        <ul>
          <li>Зв&apos;язку з вами щодо вашого запиту або проекту.</li>
          <li>Підготовки комерційної пропозиції.</li>
          <li>Ведення бази клієнтів для управління замовленнями.</li>
        </ul>
      </section>

      <section>
        <h2>4. Де зберігаються дані</h2>
        <p>
          Всі заявки зберігаються в адміністративній панелі сайту (Payload CMS) на захищеному
          сервері. Доступ до даних мають лише уповноважені співробітники ABECT.
        </p>
      </section>

      <section>
        <h2>5. Строки зберігання</h2>
        <p>
          Ми зберігаємо ваші дані протягом невизначеного терміну — доки менеджер вважає їх
          актуальними для ведення бізнесу. Ви маєте право в будь-який момент запросити видалення
          своїх даних, надіславши запит на{' '}
          <a href="mailto:support@agency.abect.com">support@agency.abect.com</a>.
        </p>
      </section>

      <section>
        <h2>6. Передача третім особам</h2>
        <p>
          Ми не продаємо та не передаємо ваші дані третім особам для маркетингових цілей. Однак при
          надходженні заявки ми надсилаємо повідомлення у закритий Telegram-канал команди ABECT.
          Це повідомлення містить ваше ім&apos;я, контакт та суть запиту — виключно для швидкого
          реагування нашими менеджерами.
        </p>
        <p>
          Telegram — застосунок третьої сторони ({' '}
          <a href="https://telegram.org/privacy" target="_blank" rel="noopener noreferrer">
            Політика конфіденційності Telegram
          </a>
          ). Повідомлення надходить у закритий приватний канал, недоступний публічно.
        </p>
      </section>

      <section>
        <h2>7. Cookies та аналітика</h2>
        <p>Ми використовуємо такі інструменти аналітики:</p>
        <ul>
          <li>
            <strong>Microsoft Clarity</strong> — записує сесії та теплові карти для покращення
            зручності сайту. Не містить персональної ідентифікуючої інформації.{' '}
            <a href="https://privacy.microsoft.com/privacystatement" target="_blank" rel="noopener noreferrer">
              Політика конфіденційності Microsoft
            </a>
            .
          </li>
          <li>
            <strong>Google Analytics</strong> — збирає знеособлену статистику відвідувань (сторінки,
            час на сайті, джерела трафіку).{' '}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
              Політика конфіденційності Google
            </a>
            .
          </li>
        </ul>
        <p>
          Ви можете відмовитись від аналітичних cookies через банер на сайті. Технічно необхідні
          cookies (сесія, локаль) не вимагають згоди.
        </p>
      </section>

      <section>
        <h2>8. Ваші права (GDPR)</h2>
        <p>Якщо ви перебуваєте на території ЄС, ви маєте право:</p>
        <ul>
          <li>Отримати копію своїх даних.</li>
          <li>Виправити неточні дані.</li>
          <li>Вимагати видалення своїх даних («право на забуття»).</li>
          <li>Обмежити або заперечити обробку.</li>
          <li>Перенести дані.</li>
        </ul>
        <p>
          Для реалізації прав звертайтесь: <a href="mailto:support@agency.abect.com">support@agency.abect.com</a>.
          Ми відповімо протягом 30 днів.
        </p>
      </section>

      <section>
        <h2>9. Зміни до політики</h2>
        <p>
          Ми можемо оновлювати цю політику. Актуальна версія завжди доступна на цій сторінці. Дата
          оновлення вказана вгорі.
        </p>
      </section>

      <section>
        <h2>10. Контакти</h2>
        <p>
          З питань конфіденційності:{' '}
          <a href="mailto:support@agency.abect.com">support@agency.abect.com</a>
          <br />
          Telegram: <a href="https://t.me/+380980275819" target="_blank" rel="noopener noreferrer">+380 98 027 5819</a>
        </p>
      </section>
    </>
  );
}

function ContentEN() {
  const updated = 'April 18, 2026';
  return (
    <>
      <h1>Privacy Policy</h1>
      <p className="privacy-policy__updated">Last updated: {updated}</p>

      <section>
        <h2>1. Who We Are</h2>
        <p>
          ABECT is a Ukrainian web studio. Email:{' '}
          <a href="mailto:support@agency.abect.com">support@agency.abect.com</a>. We are the data controller for
          personal data you provide through our website.
        </p>
      </section>

      <section>
        <h2>2. What Data We Collect</h2>
        <p>We collect data only through contact forms on our website:</p>
        <ul>
          <li><strong>Contact form:</strong> name, phone or email, message (optional).</li>
          <li>
            <strong>Cost calculator:</strong> name, phone or email, message, plus selected project
            parameters (site type, platform, number of pages, additional services, timeline). This
            data helps us prepare an accurate proposal.
          </li>
        </ul>
        <p>We do not collect payment data, passwords, or other sensitive information.</p>
      </section>

      <section>
        <h2>3. Purpose of Collection</h2>
        <p>Data is collected solely to:</p>
        <ul>
          <li>Contact you regarding your request or project.</li>
          <li>Prepare a commercial proposal.</li>
          <li>Maintain a client database for order management.</li>
        </ul>
      </section>

      <section>
        <h2>4. Where Data Is Stored</h2>
        <p>
          All inquiries are stored in the website admin panel (Payload CMS) on a secured server.
          Only authorized ABECT staff have access.
        </p>
      </section>

      <section>
        <h2>5. Retention Period</h2>
        <p>
          We store your data for an indefinite period — as long as our manager considers it relevant
          for business operations. You can request deletion at any time by emailing{' '}
          <a href="mailto:support@agency.abect.com">support@agency.abect.com</a>.
        </p>
      </section>

      <section>
        <h2>6. Third-Party Sharing</h2>
        <p>
          We do not sell or share your data with third parties for marketing purposes. However, when
          an inquiry is submitted, we send a notification to a private ABECT Telegram channel. This
          message includes your name, contact, and request summary — solely for quick response by our
          managers.
        </p>
        <p>
          Telegram is a third-party service (
          <a href="https://telegram.org/privacy" target="_blank" rel="noopener noreferrer">
            Telegram Privacy Policy
          </a>
          ). The message goes to a private channel not publicly accessible.
        </p>
      </section>

      <section>
        <h2>7. Cookies &amp; Analytics</h2>
        <p>We use the following analytics tools:</p>
        <ul>
          <li>
            <strong>Microsoft Clarity</strong> — records sessions and heatmaps to improve usability.
            Does not contain personally identifying information.{' '}
            <a href="https://privacy.microsoft.com/privacystatement" target="_blank" rel="noopener noreferrer">
              Microsoft Privacy Statement
            </a>
            .
          </li>
          <li>
            <strong>Google Analytics</strong> — collects anonymized visit statistics (pages, time on
            site, traffic sources).{' '}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
              Google Privacy Policy
            </a>
            .
          </li>
        </ul>
        <p>
          You may decline analytics cookies via the banner on the site. Technically necessary cookies
          (session, locale) do not require consent.
        </p>
      </section>

      <section>
        <h2>8. Your Rights (GDPR)</h2>
        <p>If you are located in the EU, you have the right to:</p>
        <ul>
          <li>Receive a copy of your data.</li>
          <li>Correct inaccurate data.</li>
          <li>Request erasure of your data (&ldquo;right to be forgotten&rdquo;).</li>
          <li>Restrict or object to processing.</li>
          <li>Data portability.</li>
        </ul>
        <p>
          To exercise these rights, contact us at{' '}
          <a href="mailto:support@agency.abect.com">support@agency.abect.com</a>. We will respond within 30 days.
        </p>
      </section>

      <section>
        <h2>9. Changes to This Policy</h2>
        <p>
          We may update this policy. The current version is always available on this page. The
          update date is shown above.
        </p>
      </section>

      <section>
        <h2>10. Contact</h2>
        <p>
          Privacy questions:{' '}
          <a href="mailto:support@agency.abect.com">support@agency.abect.com</a>
          <br />
          Telegram:{' '}
          <a href="https://t.me/+380980275819" target="_blank" rel="noopener noreferrer">+380 98 027 5819</a>
        </p>
      </section>
    </>
  );
}

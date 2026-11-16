---
slug: payment-systems-online-store-monobank-liqpay-portmone-stripe
title: Payment systems for an online store: Monobank, LiqPay, Portmone, Stripe
description: We compare popular payment services for an online store: fees, features, website integration and payment security (PCI DSS). What to choose for selling in Ukraine and abroad.
metaTitle: Payment systems for an online store: a comparison | ABECT
metaDescription: Monobank, LiqPay, Portmone or Stripe: a comparison of fees and features, how to connect payments to your website and how to keep payments secure under PCI DSS.
metaKeywords: payment system for online store, internet acquiring, monobank acquiring, liqpay, portmone, stripe ukraine, online payments
---

Payment is the final step before a purchase and one of the most sensitive parts of an online store. If the right payment method is missing, the form is confusing or the payment page looks untrustworthy, the customer closes the tab with a full cart.

Let's look at four popular solutions — Monobank, LiqPay, Portmone and Stripe — and what to pay attention to when choosing.

> Payment providers' fees and terms change regularly and depend on your contract and turnover. The figures below are approximate; check current terms on the providers' websites before connecting.

## What to look at when choosing

- **Transaction fee** — a percentage of the payment amount, sometimes plus a fixed fee.
- **Payment methods** — Visa/Mastercard cards, Apple Pay, Google Pay, instalments, payment in the bank's app.
- **Settlement time** — how quickly the money reaches your account.
- **Refunds** — whether you can refund from the dashboard or via the API.
- **Integrations** — ready-made modules for your platform (WooCommerce, Shopify, Horoshop) or a convenient API for a custom site.
- **Fiscal receipts** — whether the service can automatically generate fiscal receipts via a software cash register (PRRO) or integrate with one.
- **Currencies and countries** — whether you can accept payments from foreign customers.

## Monobank (internet acquiring)

Acquiring from monobank for business is a popular choice among sole proprietors and small businesses.

- **Fee:** approximately from 1.3% per successful card payment; exact rates are in the monobank business dashboard.
- **Features:** card payments, Apple Pay / Google Pay, instalments for monobank customers, a convenient dashboard, built-in fiscal receipt tools.
- **Integration:** ready-made modules for common CMSs and a clear API with a hosted payment page.
- **Best for:** Ukrainian sole proprietors and companies that want to start accepting payments quickly with minimal paperwork.

## LiqPay (PrivatBank)

One of the oldest and most widely used payment services in Ukraine.

- **Fee:** approximately from 1.5% for Ukrainian cards; higher for cards issued by foreign banks.
- **Features:** cards, Apple Pay / Google Pay, Privat24, PrivatBank instalments, subscriptions (recurring payments), refunds from the dashboard.
- **Integration:** modules for almost every popular platform, SDKs and detailed documentation.
- **Best for:** stores that value PrivatBank's broad customer base and recurring payments.

## Portmone

A Ukrainian payment service that is strong in recurring payments and service businesses.

- **Fee:** depends on the plan and turnover — agreed individually.
- **Features:** card payments, Apple Pay / Google Pay, recurring payments, invoicing, payment links.
- **Integration:** API, hosted payment page, CMS modules.
- **Best for:** service businesses with subscriptions, invoices and repeat payments.

## Stripe

The international leader in online payments, with the best documentation and developer tools.

- **Important caveat:** at the time of writing, Stripe does not open accounts for companies registered in Ukraine. To use it, you need a company in a country where Stripe operates (for example, in the EU, the UK or the US).
- **Fee:** depends on the account's country and the card's origin; for European cards — from roughly 1.5% plus a fixed per-transaction fee.
- **Features:** dozens of payment methods, multi-currency, subscriptions (Stripe Billing), invoices, fraud protection (Radar), ready-made payment pages (Checkout).
- **Best for:** brands selling to international markets that have a foreign legal entity.

## The comparison in brief

- **Easiest start for a sole proprietor in Ukraine:** Monobank.
- **Maximum reach among Ukrainian shoppers and recurring payments:** LiqPay.
- **Services with subscriptions and invoices:** Portmone.
- **Selling abroad through a foreign company:** Stripe.

It's often best to combine two services: a main one for Ukrainian customers and a backup or international one — so you don't depend on a single provider.

## Integrating payments into your website

There are three main ways to connect payments:

1. **The provider's hosted payment page (redirect).** After checkout the customer goes to the service's page and returns after paying. The simplest and safest option: card details never pass through your site at all.
2. **An embedded widget.** The provider's payment form opens in a window on your site. More convenient for the customer, while the card details are still processed by the provider.
3. **Your own form via the API.** Maximum control over the design, but the highest security requirements — this only makes sense for large projects.

### What you must do during integration

- Process the **callback / webhook** from the payment service and confirm the order only after receiving it, not because the customer returned to the site.
- Verify the **signature** of every message from the provider — otherwise the "paid" status can be forged.
- Test payments in **test mode (sandbox)**, including errors and refunds.
- Pass the data needed for a **fiscal receipt** if your business is required to issue one.

## Payment security and PCI DSS

**PCI DSS** is an international security standard for anyone who accepts, processes or stores payment card data. The good news: if you use the provider's hosted payment page or widget, most of the compliance burden falls on the provider, leaving you with a minimal set of requirements.

Basic rules for an online store:

- **Never store** card numbers, CVVs or expiry dates in your database.
- Use **HTTPS** across the entire site.
- Support **3-D Secure** — additional payment confirmation in the bank's app reduces fraud and disputed transactions.
- Keep your CMS, plugins and site dependencies up to date.
- Restrict access to the admin panel: strong passwords, two-factor authentication, separate roles for staff.

## Summary

For most Ukrainian online stores the best start is Monobank or LiqPay with a hosted payment page or widget: quick to connect, familiar payment methods for customers and minimal security requirements on your side. Stripe is worth considering when the business expands into international markets and has a legal entity abroad for that.

ABECT connects payments and delivery to [online stores](/en/services) — with correct status handling, signature verification and testing of every scenario. Find out the estimated cost in our [calculator](/en/calculator).

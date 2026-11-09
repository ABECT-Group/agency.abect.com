'use client';

import { JSX, useState, useEffect, useRef, FormEvent } from 'react';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter, Link } from '@/client/i18n/navigation';
import { submitLead, isValidContact } from '@/client/lib/leads';
import './ContactModal.scss';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type FormState = 'idle' | 'loading' | 'error';

export default function ContactModal({ isOpen, onClose }: ContactModalProps): JSX.Element | null {
  const t = useTranslations('ContactForm');
  const router = useRouter();
  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  const [formState, setFormState] = useState<FormState>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Form fields
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [message, setMessage] = useState('');
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  // Validation errors
  const [nameError, setNameError] = useState('');
  const [contactError, setContactError] = useState('');
  const [privacyError, setPrivacyError] = useState('');

  // Focus first input when opened
  useEffect(() => {
    if (isOpen && firstInputRef.current) {
      setTimeout(() => {
        firstInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Handle ESC key and body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.setProperty('--scrollbar-compensation', `${scrollbarWidth}px`);
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = `${scrollbarWidth}px`;

    document.addEventListener('keydown', handleEsc);

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      document.documentElement.style.removeProperty('--scrollbar-compensation');
    };
  }, [isOpen, onClose]);

  // Handle click outside
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === modalRef.current) {
      onClose();
    }
  };

  // Reset form
  const resetForm = () => {
    setName('');
    setContact('');
    setMessage('');
    setPrivacyAccepted(false);
    setNameError('');
    setContactError('');
    setPrivacyError('');
    setFormState('idle');
    setErrorMessage('');
  };

  const handleClose = () => {
    onClose();
  };

  // Validate form
  const validateForm = (): boolean => {
    let isValid = true;

    if (!name.trim() || name.trim().length < 2) {
      setNameError(t('validation.nameRequired'));
      isValid = false;
    } else {
      setNameError('');
    }

    if (!contact.trim()) {
      setContactError(t('validation.contactRequired'));
      isValid = false;
    } else if (!isValidContact(contact)) {
      setContactError(t('validation.contactInvalid'));
      isValid = false;
    } else {
      setContactError('');
    }

    if (!privacyAccepted) {
      setPrivacyError(t('validation.privacyRequired'));
      isValid = false;
    } else {
      setPrivacyError('');
    }

    return isValid;
  };

  // Handle submit
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setFormState('loading');
    setErrorMessage('');

    const result = await submitLead({
      type: 'simple',
      name: name.trim(),
      contact: contact.trim(),
      message: message.trim() || undefined,
    });

    if (result.success) {
      resetForm();
      onClose();
      const token = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
      router.push(`/thx?form=simple&token=${token}`);
    } else {
      setFormState('error');
      setErrorMessage(result.error || t('errorMessage'));
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="contact-modal"
      ref={modalRef}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-modal-title"
    >
      <div className="contact-modal__content">
        {/* Close button */}
        <button
          type="button"
          className="contact-modal__close"
          onClick={handleClose}
          aria-label={t('closeButton')}
        >
          <X size={24} />
        </button>

        {/* Header */}
        <header className="contact-modal__header">
          <h2 id="contact-modal-title">{t('title')}</h2>
          <p>{t('subtitle')}</p>
        </header>

        {/* Error message */}
        {formState === 'error' && (
          <div className="contact-modal__error">
            <AlertCircle size={20} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form className="contact-modal__form" onSubmit={handleSubmit}>
          <div className={`contact-modal__field ${nameError ? 'contact-modal__field--error' : ''}`}>
            <label htmlFor="contact-name">{t('nameLabel')}</label>
            <input
              ref={firstInputRef}
              type="text"
              id="contact-name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('namePlaceholder')}
              disabled={formState === 'loading'}
              autoComplete="name"
            />
            {nameError && <span className="contact-modal__field-error">{nameError}</span>}
          </div>

          <div className={`contact-modal__field ${contactError ? 'contact-modal__field--error' : ''}`}>
            <label htmlFor="contact-contact">{t('contactLabel')}</label>
            <input
              type="text"
              id="contact-contact"
              name="contact"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder={t('contactPlaceholder')}
              disabled={formState === 'loading'}
              autoComplete="tel email"
            />
            {contactError && <span className="contact-modal__field-error">{contactError}</span>}
          </div>

          <div className="contact-modal__field">
            <label htmlFor="contact-message">{t('messageLabel')}</label>
            <textarea
              id="contact-message"
              name="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('messagePlaceholder')}
              disabled={formState === 'loading'}
              rows={4}
              maxLength={500}
            />
          </div>

          <label className={`contact-modal__privacy-check ${privacyError ? 'contact-modal__privacy-check--error' : ''}`}>
            <input
              type="checkbox"
              checked={privacyAccepted}
              onChange={(e) => setPrivacyAccepted(e.target.checked)}
              disabled={formState === 'loading'}
            />
            <span>
              {t('privacyCheckbox')}{' '}
              <Link href="/privacy-policy" target="_blank" className="contact-modal__privacy-link">
                {t('privacyLink')}
              </Link>
            </span>
          </label>
          {privacyError && <span className="contact-modal__field-error">{privacyError}</span>}

          <button
            type="submit"
            className="contact-modal__submit cta"
            disabled={formState === 'loading'}
          >
            {formState === 'loading' ? (
              <>
                <Loader2 size={20} className="contact-modal__spinner" />
                {t('loadingButton')}
              </>
            ) : (
              t('submitButton')
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

'use client';

import { ChangeEvent, FormEvent, JSX, useRef, useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/client/i18n/navigation';
import { createThxToken, isValidContact, submitLead } from '@/client/lib/leads';
import FloatingDecor from '@/client/components/FloatingDecor/FloatingDecor';
import './DiscussProject.scss';

/** Група послуг для списку (тип послуги з CMS → послуги цього типу) */
export type ServiceGroup = { label: string; options: { value: string; label: string }[] };

// Останній пункт списку — завжди є, навіть якщо послуг у CMS немає
const OTHER = 'other';

// Ті самі обмеження перевіряє сервер (/api/leads, collections/LeadFiles.ts); тут — щоб підказати одразу
const FILE_EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'png', 'jpg', 'jpeg', 'webp'];
const FILE_MAX_MB = 10;

type Errors = Partial<Record<'name' | 'contact' | 'privacy' | 'file', string>>;

type DiscussProjectProps = {
	/** Послуги з CMS, згруповані за типом (DiscussProjectSection) */
	serviceGroups: ServiceGroup[];
};

/**
 * «Обговорити проєкт» — форма заявки внизу головної (Figma «ABECT», Desktop 6: 226:31, 166:313, 171:29,
 * поля 226:33 … 227:44, синій 3D-об'єкт 182:11). Заявка — `type: 'simple'` у /api/leads:
 * тип сайту й коментар ідуть у повідомлення (окремих полів у колекції leads немає).
 */
export default function DiscussProject({ serviceGroups }: DiscussProjectProps): JSX.Element {
	const t = useTranslations('HomePage.Discuss');
	const tForm = useTranslations('ContactForm');
	const router = useRouter();

	const [name, setName] = useState('');
	const [contact, setContact] = useState('');
	const [serviceSlug, setServiceSlug] = useState('');
	// Назва обраної послуги — у коментар заявки (у колекції leads окремого поля немає)
	const serviceLabel =
		serviceSlug === OTHER
			? t('serviceOther')
			: serviceGroups.flatMap((group) => group.options).find((option) => option.value === serviceSlug)?.label;
	const [comment, setComment] = useState('');
	const [privacyAccepted, setPrivacyAccepted] = useState(false);
	const [file, setFile] = useState<File | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [errors, setErrors] = useState<Errors>({});
	const [submitError, setSubmitError] = useState('');
	const [loading, setLoading] = useState(false);

	const validate = (): Errors => {
		const next: Errors = {};
		if (name.trim().length < 2) next.name = tForm('validation.nameRequired');
		if (!contact.trim()) next.contact = tForm('validation.contactRequired');
		else if (!isValidContact(contact.trim())) next.contact = tForm('validation.contactInvalid');
		if (!privacyAccepted) next.privacy = tForm('validation.privacyRequired');
		return next;
	};

	const clearFile = () => {
		setFile(null);
		if (fileInputRef.current) fileInputRef.current.value = '';
	};

	const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
		const selected = event.target.files?.[0] ?? null;
		if (!selected) return;

		const extension = selected.name.split('.').pop()?.toLowerCase() ?? '';
		let fileError: string | undefined;
		if (!FILE_EXTENSIONS.includes(extension)) fileError = t('fileTypeError');
		else if (selected.size > FILE_MAX_MB * 1024 * 1024) fileError = t('fileSizeError', { size: FILE_MAX_MB });

		setErrors((prev) => ({ ...prev, file: fileError }));
		if (fileError) {
			clearFile();
			return;
		}
		setFile(selected);
	};

	const handleSubmit = async (event: FormEvent) => {
		event.preventDefault();
		const nextErrors = validate();
		setErrors(nextErrors);
		if (Object.keys(nextErrors).length > 0) return;

		setLoading(true);
		setSubmitError('');

		const message = [
			serviceLabel ? `${t('serviceLabel')}: ${serviceLabel}` : '',
			comment.trim()
		]
			.filter(Boolean)
			.join('\n\n');

		const result = await submitLead({
			type: 'simple',
			name: name.trim(),
			contact: contact.trim(),
			message: message || undefined,
			file
		});

		if (result.success) {
			router.push(`/thx?form=simple&token=${createThxToken()}`);
			return;
		}

		setLoading(false);
		setSubmitError(result.error || tForm('errorMessage'));
	};

	return (
		<section className="discuss" id="discuss" aria-labelledby="discuss-title">
			<div className="container container--design">
				<div className="discuss__inner">
					<FloatingDecor className="discuss__decor" src="/images/decor/blob.png" width={420} height={402} revealDelay={0.15} />

					<div className="discuss__content">
						<h2 className="discuss__title" id="discuss-title" data-reveal="">
							{t('title')}
						</h2>
						<p className="discuss__subtitle" data-reveal="">
							{t('subtitle')}
						</p>

						<form className="discuss__form" onSubmit={handleSubmit} noValidate data-reveal="">
							<div className="discuss__field">
								<label className="discuss__sr" htmlFor="discuss-name">
									{t('namePlaceholder')}
								</label>
								<input
									id="discuss-name"
									className={`discuss__input${errors.name ? ' discuss__input--error' : ''}`}
									type="text"
									name="name"
									autoComplete="name"
									placeholder={t('namePlaceholder')}
									value={name}
									onChange={(event) => setName(event.target.value)}
									disabled={loading}
									aria-invalid={Boolean(errors.name)}
									aria-describedby={errors.name ? 'discuss-name-error' : undefined}
									maxLength={100}
								/>
								{errors.name && (
									<span className="discuss__error" id="discuss-name-error">
										{errors.name}
									</span>
								)}
							</div>

							<div className="discuss__field">
								<label className="discuss__sr" htmlFor="discuss-contact">
									{t('contactPlaceholder')}
								</label>
								<input
									id="discuss-contact"
									className={`discuss__input${errors.contact ? ' discuss__input--error' : ''}`}
									type="text"
									name="contact"
									autoComplete="tel email"
									placeholder={t('contactPlaceholder')}
									value={contact}
									onChange={(event) => setContact(event.target.value)}
									disabled={loading}
									aria-invalid={Boolean(errors.contact)}
									aria-describedby={errors.contact ? 'discuss-contact-error' : undefined}
									maxLength={320}
								/>
								{errors.contact && (
									<span className="discuss__error" id="discuss-contact-error">
										{errors.contact}
									</span>
								)}
							</div>

							<div className="discuss__field discuss__field--select">
								<label className="discuss__sr" htmlFor="discuss-service">
									{t('serviceLabel')}
								</label>
								<select
									id="discuss-service"
									className="discuss__input discuss__select"
									name="service"
									value={serviceSlug}
									onChange={(event) => setServiceSlug(event.target.value)}
									disabled={loading}
								>
									<option value="">{t('servicePlaceholder')}</option>
									{serviceGroups.map((group) =>
										group.label ? (
											<optgroup key={group.label} label={group.label}>
												{group.options.map((option) => (
													<option key={option.value} value={option.value}>
														{option.label}
													</option>
												))}
											</optgroup>
										) : (
											group.options.map((option) => (
												<option key={option.value} value={option.value}>
													{option.label}
												</option>
											))
										)
									)}
									<option value={OTHER}>{t('serviceOther')}</option>
								</select>
							</div>

							<div className="discuss__field">
								<label className="discuss__sr" htmlFor="discuss-comment">
									{t('commentPlaceholder')}
								</label>
								<textarea
									id="discuss-comment"
									className="discuss__input discuss__textarea"
									name="message"
									placeholder={t('commentPlaceholder')}
									value={comment}
									onChange={(event) => setComment(event.target.value)}
									disabled={loading}
									rows={3}
									maxLength={1500}
								/>
							</div>

							<div className="discuss__file">
								<input
									ref={fileInputRef}
									id="discuss-file"
									className="discuss__file-input"
									type="file"
									name="file"
									accept={FILE_EXTENSIONS.map((ext) => `.${ext}`).join(',')}
									onChange={handleFileChange}
									disabled={loading}
									aria-describedby="discuss-file-hint"
								/>
								{file ? (
									<span className="discuss__file-chosen">
										<span className="discuss__file-name">{file.name}</span>
										<button type="button" className="discuss__file-remove" onClick={clearFile} disabled={loading}>
											{t('removeFile')}
										</button>
									</span>
								) : (
									<label htmlFor="discuss-file" className="discuss__file-label">
										{t('attachFile')}
									</label>
								)}
								<span className="discuss__file-hint" id="discuss-file-hint">
									{t('fileHint', { size: FILE_MAX_MB })}
								</span>
							</div>
							{errors.file && <span className="discuss__error">{errors.file}</span>}

							<label className={`discuss__privacy${errors.privacy ? ' discuss__privacy--error' : ''}`}>
								<input
									type="checkbox"
									checked={privacyAccepted}
									onChange={(event) => setPrivacyAccepted(event.target.checked)}
									disabled={loading}
								/>
								<span>
									{tForm('privacyCheckbox')}{' '}
									<Link href="/privacy-policy" target="_blank">
										{tForm('privacyLink')}
									</Link>
								</span>
							</label>
							{errors.privacy && <span className="discuss__error">{errors.privacy}</span>}

							{submitError && (
								<p className="discuss__error discuss__error--submit" role="alert">
									{submitError}
								</p>
							)}

							<button type="submit" className="arrow-btn arrow-btn--lg arrow-btn--strong discuss__submit" disabled={loading}>
								<span className="arrow-btn__label">{loading ? tForm('loadingButton') : t('submitButton')}</span>
								<span className="arrow-btn__arrow glass" aria-hidden="true">
									<Image src="/icons/arrow-36.svg" alt="" width={36} height={36} />
								</span>
							</button>
						</form>
					</div>
				</div>
			</div>
		</section>
	);
}
